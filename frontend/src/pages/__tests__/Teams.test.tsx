import React from 'react';
import { render, screen, waitFor, act, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import Teams from '../Teams';

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

jest.mock('@mui/icons-material/Groups', () => () => <span>GroupsIcon</span>);
jest.mock('@mui/icons-material/Add', () => () => <span>+</span>);
jest.mock('@mui/icons-material/Search', () => () => <span>🔍</span>);
jest.mock('@mui/icons-material/Edit', () => () => <span>✏️</span>);
jest.mock('@mui/icons-material/Delete', () => () => <span>🗑️</span>);
jest.mock('@mui/icons-material/InfoOutlined', () => () => <span>ℹ️</span>);
jest.mock('@mui/icons-material/Clear', () => () => <span>✕</span>);

// Mock child modals
jest.mock('../../modals/TeamDetailsModal', () => (props: any) => (
  props.teamDetailOpen ? <div data-testid="TeamDetailsModal">Details</div> : null
));
jest.mock('../../modals/TeamDeleteConfirmationModal', () => (props: any) => (
  props.open ? <div data-testid="TeamDeleteModal">Delete</div> : null
));
jest.mock('../../modals/TeamEditModal', () => (props: any) => (
  props.openTeamEditModal ? <div data-testid="TeamEditModal">Edit</div> : null
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
const mockTeamsResponse = {
  teams: [
    {
      id: 1,
      name: 'U17 Junioren',
      ageGroup: { id: 1, name: 'U17' },
      league: { id: 1, name: 'Kreisliga' },
      permissions: { canView: true, canEdit: true, canCreate: true, canDelete: true },
    },
    {
      id: 2,
      name: 'U19 Junioren',
      ageGroup: { id: 2, name: 'U19' },
      league: { id: 2, name: 'Bezirksliga' },
      permissions: { canView: true, canEdit: true, canCreate: true, canDelete: true },
    },
  ],
  total: 12,
  page: 1,
  limit: 25,
};

beforeEach(() => {
  mockApiJson.mockReset();
  mockApiJson.mockImplementation(() => Promise.resolve(mockTeamsResponse));
});

// ────── Tests ──────

describe('Teams Page', () => {
  it('renders page title', async () => {
    await act(async () => { render(<Teams />); });
    await waitFor(() => {
      expect(screen.getByText('Teams')).toBeInTheDocument();
    });
  });

  it('loads teams on mount', async () => {
    await act(async () => { render(<Teams />); });
    await waitFor(() => {
      expect(mockApiJson).toHaveBeenCalledWith(expect.stringContaining('/api/teams'));
    });
  });

  it('displays team data in table', async () => {
    await act(async () => { render(<Teams />); });
    await waitFor(() => {
      expect(screen.getByText('U17 Junioren')).toBeInTheDocument();
      expect(screen.getByText('U19 Junioren')).toBeInTheDocument();
    });
  });

  it('shows total count', async () => {
    await act(async () => { render(<Teams />); });
    await waitFor(() => {
      expect(screen.getByText('12')).toBeInTheDocument();
    });
  });

  it('passes server pagination props to table', async () => {
    await act(async () => { render(<Teams />); });
    await waitFor(() => {
      const pagination = screen.getByTestId('TablePagination');
      expect(pagination).toBeInTheDocument();
      expect(pagination).toHaveAttribute('data-count', '12');
      expect(pagination).toHaveAttribute('data-page', '0');
      expect(pagination).toHaveAttribute('data-rows-per-page', '25');
    });
  });

  it('fetches next page on pagination click', async () => {
    await act(async () => { render(<Teams />); });
    await waitFor(() => {
      expect(screen.getByTestId('TablePagination')).toBeInTheDocument();
    });

    mockApiJson.mockClear();
    mockApiJson.mockImplementation(() => Promise.resolve({ ...mockTeamsResponse, page: 2 }));

    await act(async () => {
      fireEvent.click(screen.getByTestId('next-page'));
    });

    await waitFor(() => {
      const calls = mockApiJson.mock.calls;
      const lastCall = calls[calls.length - 1][0];
      expect(lastCall).toContain('page=2');
    });
  });

  it('shows empty state when no teams', async () => {
    mockApiJson.mockImplementation(() => Promise.resolve({ teams: [], total: 0, page: 1, limit: 25 }));

    await act(async () => { render(<Teams />); });

    await waitFor(() => {
      expect(screen.getByText('Keine Teams vorhanden')).toBeInTheDocument();
    });
  });

  it('shows error state on API failure', async () => {
    mockApiJson.mockImplementation(() => Promise.reject(new Error('Server error')));

    await act(async () => { render(<Teams />); });

    await waitFor(() => {
      expect(screen.getByText('Fehler beim Laden der Teams.')).toBeInTheDocument();
    });
  });

  it('displays column headers', async () => {
    await act(async () => { render(<Teams />); });
    await waitFor(() => {
      expect(screen.getByText('Name')).toBeInTheDocument();
      expect(screen.getByText('Altersgruppe')).toBeInTheDocument();
      expect(screen.getByText('Liga')).toBeInTheDocument();
    });
  });

  it('displays age group and league data', async () => {
    await act(async () => { render(<Teams />); });
    await waitFor(() => {
      expect(screen.getByText('U17')).toBeInTheDocument();
      expect(screen.getByText('Kreisliga')).toBeInTheDocument();
      expect(screen.getByText('U19')).toBeInTheDocument();
      expect(screen.getByText('Bezirksliga')).toBeInTheDocument();
    });
  });

  it('does not have team filter dropdown (no team filter on Teams page)', async () => {
    await act(async () => { render(<Teams />); });
    await waitFor(() => {
      expect(screen.queryByTestId('team-select')).not.toBeInTheDocument();
    });
  });
});
