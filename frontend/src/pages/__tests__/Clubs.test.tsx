import React from 'react';
import { render, screen, waitFor, act, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import Clubs from '../Clubs';

// ────── Mock MUI ──────
jest.mock('@mui/material', () => {
  const actual = jest.requireActual('@mui/material');
  return {
    ...actual,
    Typography: (props: any) => <span {...props}>{props.children}</span>,
    Paper: (props: any) => <div {...props}>{props.children}</div>,
    Box: (props: any) => <div {...props}>{props.children}</div>,
    Button: (props: any) => <button onClick={props.onClick} {...props}>{props.children}</button>,
    Skeleton: () => <div data-testid="Skeleton" />,
    Alert: (props: any) => <div data-testid="Alert" role="alert">{props.children}</div>,
    Snackbar: (props: any) => props.open ? <div data-testid="Snackbar">{props.children}</div> : null,
    TextField: (props: any) => <input data-testid="search-input" placeholder={props.placeholder} value={props.value} onChange={(e: any) => props.onChange?.(e)} />,
    InputAdornment: (props: any) => <span>{props.children}</span>,
    Tooltip: (props: any) => <span>{props.children}</span>,
    IconButton: (props: any) => <button onClick={props.onClick}>{props.children}</button>,
    Chip: (props: any) => <span data-testid="Chip">{props.label}</span>,
    Stack: (props: any) => <div {...props}>{props.children}</div>,
    Table: (props: any) => <table>{props.children}</table>,
    TableBody: (props: any) => <tbody>{props.children}</tbody>,
    TableCell: (props: any) => <td onClick={props.onClick}>{props.children}</td>,
    TableContainer: (props: any) => <div>{props.children}</div>,
    TableHead: (props: any) => <thead>{props.children}</thead>,
    TableRow: (props: any) => <tr onClick={props.onClick}>{props.children}</tr>,
    TablePagination: (props: any) => (
      <div data-testid="TablePagination" data-page={props.page} data-rows-per-page={props.rowsPerPage} data-count={props.count}>
        <button data-testid="next-page" onClick={() => props.onPageChange(null, props.page + 1)}>Next</button>
        <button data-testid="prev-page" onClick={() => props.onPageChange(null, Math.max(0, props.page - 1))}>Prev</button>
      </div>
    ),
  };
});

jest.mock('@mui/icons-material/Shield', () => () => <span>ShieldIcon</span>);
jest.mock('@mui/icons-material/Add', () => () => <span>+</span>);
jest.mock('@mui/icons-material/Search', () => () => <span>🔍</span>);
jest.mock('@mui/icons-material/Edit', () => () => <span>✏️</span>);
jest.mock('@mui/icons-material/Delete', () => () => <span>🗑️</span>);
jest.mock('@mui/icons-material/InfoOutlined', () => () => <span>ℹ️</span>);
jest.mock('@mui/icons-material/Clear', () => () => <span>✕</span>);

// Mock child modals
jest.mock('../../modals/ClubDetailsModal', () => (props: any) => (
  props.open ? <div data-testid="ClubDetailsModal">Details</div> : null
));
jest.mock('../../modals/ClubDeleteConfirmationModal', () => (props: any) => (
  props.open ? <div data-testid="ClubDeleteModal">Delete</div> : null
));
jest.mock('../../modals/ClubEditModal', () => (props: any) => (
  props.openClubEditModal ? <div data-testid="ClubEditModal">Edit</div> : null
));

// Mock API
const mockApiJson = jest.fn();
jest.mock('../../utils/api', () => ({
  apiJson: (...args: any[]) => mockApiJson(...args),
}));

beforeAll(() => {
  jest.spyOn(console, 'log').mockImplementation(() => {});
  jest.spyOn(console, 'error').mockImplementation(() => {});
});
afterAll(() => {
  (console.log as jest.Mock).mockRestore();
  (console.error as jest.Mock).mockRestore();
});

// ────── Fixtures ──────
const mockClubsResponse = {
  clubs: [
    {
      id: 1,
      name: 'FC Musterstadt',
      shortName: 'FCM',
      abbreviation: 'FCM',
      stadiumName: 'Musterstadion',
      website: 'https://fcm.example.com',
      logoUrl: null,
      email: 'info@fcm.example.com',
      phone: '0123456789',
      clubColors: 'Rot-Weiß',
      contactPerson: 'Max Mustermann',
      foundingYear: 1920,
      active: true,
      location: { id: 1, name: 'Sportplatz', city: 'Musterstadt', address: 'Musterstr. 1', latitude: null, longitude: null, surfaceType: null },
      permissions: { canView: true, canEdit: true, canCreate: true, canDelete: true },
    },
    {
      id: 2,
      name: 'SV Testdorf',
      shortName: 'SVT',
      abbreviation: 'SVT',
      stadiumName: 'Testplatz',
      website: 'https://svt.example.com',
      logoUrl: null,
      email: 'info@svt.example.com',
      phone: null,
      clubColors: 'Blau-Gelb',
      contactPerson: null,
      foundingYear: 1950,
      active: true,
      location: null,
      permissions: { canView: true, canEdit: true, canCreate: true, canDelete: true },
    },
  ],
  total: 20,
  page: 1,
  limit: 25,
};

beforeEach(() => {
  mockApiJson.mockReset();
  mockApiJson.mockImplementation(() => Promise.resolve(mockClubsResponse));
});

// ────── Tests ──────

describe('Clubs Page', () => {
  it('renders page title', async () => {
    await act(async () => { render(<Clubs />); });
    await waitFor(() => {
      expect(screen.getByText('Vereine')).toBeInTheDocument();
    });
  });

  it('loads clubs on mount', async () => {
    await act(async () => { render(<Clubs />); });
    await waitFor(() => {
      expect(mockApiJson).toHaveBeenCalledWith(expect.stringContaining('/clubs'));
    });
  });

  it('displays club data in table', async () => {
    await act(async () => { render(<Clubs />); });
    await waitFor(() => {
      expect(screen.getByText('FC Musterstadt')).toBeInTheDocument();
      expect(screen.getByText('SV Testdorf')).toBeInTheDocument();
    });
  });

  it('shows total count', async () => {
    await act(async () => { render(<Clubs />); });
    await waitFor(() => {
      expect(screen.getByText('20')).toBeInTheDocument();
    });
  });

  it('passes server pagination props to table', async () => {
    await act(async () => { render(<Clubs />); });
    await waitFor(() => {
      const pagination = screen.getByTestId('TablePagination');
      expect(pagination).toBeInTheDocument();
      expect(pagination).toHaveAttribute('data-count', '20');
      expect(pagination).toHaveAttribute('data-page', '0');
      expect(pagination).toHaveAttribute('data-rows-per-page', '25');
    });
  });

  it('fetches next page on pagination click', async () => {
    await act(async () => { render(<Clubs />); });
    await waitFor(() => {
      expect(screen.getByTestId('TablePagination')).toBeInTheDocument();
    });

    mockApiJson.mockClear();
    mockApiJson.mockImplementation(() => Promise.resolve({ ...mockClubsResponse, page: 2 }));

    await act(async () => {
      fireEvent.click(screen.getByTestId('next-page'));
    });

    await waitFor(() => {
      const calls = mockApiJson.mock.calls;
      const lastCall = calls[calls.length - 1][0];
      expect(lastCall).toContain('page=2');
    });
  });

  it('shows empty state when no clubs', async () => {
    mockApiJson.mockImplementation(() => Promise.resolve({ clubs: [], total: 0, page: 1, limit: 25 }));

    await act(async () => { render(<Clubs />); });

    await waitFor(() => {
      expect(screen.getByText('Keine Vereine vorhanden')).toBeInTheDocument();
    });
  });

  it('shows error state on API failure', async () => {
    mockApiJson.mockImplementation(() => Promise.reject(new Error('Server error')));

    await act(async () => { render(<Clubs />); });

    await waitFor(() => {
      expect(screen.getByText('Fehler beim Laden der Vereine.')).toBeInTheDocument();
    });
  });

  it('displays column headers', async () => {
    await act(async () => { render(<Clubs />); });
    await waitFor(() => {
      expect(screen.getByText('Name')).toBeInTheDocument();
      expect(screen.getByText('Stadion')).toBeInTheDocument();
      expect(screen.getByText('Website')).toBeInTheDocument();
    });
  });

  it('renders stadium name', async () => {
    await act(async () => { render(<Clubs />); });
    await waitFor(() => {
      expect(screen.getByText('Musterstadion')).toBeInTheDocument();
      expect(screen.getByText('Testplatz')).toBeInTheDocument();
    });
  });

  it('renders website', async () => {
    await act(async () => { render(<Clubs />); });
    await waitFor(() => {
      expect(screen.getByText('https://fcm.example.com')).toBeInTheDocument();
    });
  });

  it('uses /clubs endpoint (not /api/clubs)', async () => {
    await act(async () => { render(<Clubs />); });
    await waitFor(() => {
      const calls = mockApiJson.mock.calls.filter((c: any[]) => c[0].includes('/clubs'));
      expect(calls.length).toBeGreaterThan(0);
      // Should NOT use /api/clubs
      const apiCalls = mockApiJson.mock.calls.filter((c: any[]) => c[0].includes('/api/clubs'));
      expect(apiCalls.length).toBe(0);
    });
  });

  it('does not have team filter dropdown', async () => {
    await act(async () => { render(<Clubs />); });
    await waitFor(() => {
      expect(screen.queryByTestId('team-select')).not.toBeInTheDocument();
    });
  });
});
