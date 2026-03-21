import React from 'react';
import { render, screen, waitFor, act, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import Coaches from '../Coaches';

// ────── Mock MUI ──────
jest.mock('@mui/material', () => {
  const actual = jest.requireActual('@mui/material');
  return {
    ...actual,
    Typography: (props: any) => <span {...props}>{props.children}</span>,
    FormControl: (props: any) => <div>{props.children}</div>,
    InputLabel: (props: any) => <label {...props}>{props.children}</label>,
    Select: (props: any) => <select data-testid="team-select" onChange={props.onChange} value={props.value}>{props.children}</select>,
    MenuItem: (props: any) => <option value={props.value}>{props.children}</option>,
    Chip: (props: any) => <span data-testid="Chip">{props.label}</span>,
    Stack: (props: any) => <div {...props}>{props.children}</div>,
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

jest.mock('@mui/icons-material/School', () => () => <span>SchoolIcon</span>);
jest.mock('@mui/icons-material/FilterList', () => () => <span>FilterIcon</span>);
jest.mock('@mui/icons-material/Add', () => () => <span>+</span>);
jest.mock('@mui/icons-material/Search', () => () => <span>🔍</span>);
jest.mock('@mui/icons-material/Edit', () => () => <span>✏️</span>);
jest.mock('@mui/icons-material/Delete', () => () => <span>🗑️</span>);
jest.mock('@mui/icons-material/InfoOutlined', () => () => <span>ℹ️</span>);
jest.mock('@mui/icons-material/Clear', () => () => <span>✕</span>);

// Mock child modals
jest.mock('../../modals/CoachDetailsModal', () => (props: any) => (
  props.open ? <div data-testid="CoachDetailsModal">Details</div> : null
));
jest.mock('../../modals/CoachDeleteConfirmationModal', () => (props: any) => (
  props.open ? <div data-testid="CoachDeleteModal">Delete</div> : null
));
jest.mock('../../modals/CoachEditModal', () => (props: any) => (
  props.openCoachEditModal ? <div data-testid="CoachEditModal">Edit</div> : null
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
const mockCoachesResponse = {
  coaches: [
    {
      id: 1,
      firstName: 'Thomas',
      lastName: 'Müller',
      email: 'thomas@example.com',
      birthdate: '1980-05-10',
      clubAssignments: [{ id: 1, startDate: '2024-01-01', endDate: null, club: { id: 1, name: 'FC Test' } }],
      teamAssignments: [{ id: 1, startDate: '2024-01-01', endDate: null, team: { id: 1, name: 'U17', ageGroup: { id: 1, name: 'U17' }, league: { id: 1, name: 'Kreisliga' }, type: null } }],
      licenseAssignments: [{ id: 1, name: 'B-Lizenz', startDate: '2022-01-01', endDate: null, license: { id: 1, name: 'B-Lizenz' } }],
      nationalityAssignments: [{ id: 1, startDate: '2024-01-01', endDate: null, nationality: { id: 1, name: 'Deutsch' } }],
      permissions: { canView: true, canEdit: true, canCreate: true, canDelete: true },
    },
    {
      id: 2,
      firstName: 'Maria',
      lastName: 'Berger',
      email: 'maria@example.com',
      birthdate: '1985-09-22',
      clubAssignments: [],
      teamAssignments: [],
      licenseAssignments: [],
      nationalityAssignments: [],
      permissions: { canView: true, canEdit: true, canCreate: true, canDelete: true },
    },
  ],
  total: 30,
  page: 1,
  limit: 25,
};

const mockTeamsResponse = {
  teams: [
    { id: 1, name: 'U17', ageGroup: { id: 1, name: 'U17' }, league: { id: 1, name: 'Kreisliga' }, permissions: { canView: true, canEdit: true, canCreate: true, canDelete: true } },
    { id: 2, name: 'U19', ageGroup: { id: 2, name: 'U19' }, league: { id: 1, name: 'Kreisliga' }, permissions: { canView: true, canEdit: true, canCreate: true, canDelete: true } },
  ],
};

beforeEach(() => {
  mockApiJson.mockReset();
  mockApiJson.mockImplementation((url: string) => {
    if (url.includes('/api/teams/list')) return Promise.resolve(mockTeamsResponse);
    if (url.includes('/api/coaches')) return Promise.resolve(mockCoachesResponse);
    return Promise.resolve({});
  });
});

// ────── Tests ──────

describe('Coaches Page', () => {
  it('renders page title', async () => {
    await act(async () => { render(<Coaches />); });
    await waitFor(() => {
      expect(screen.getByText('Trainer')).toBeInTheDocument();
    });
  });

  it('loads coaches on mount', async () => {
    await act(async () => { render(<Coaches />); });
    await waitFor(() => {
      expect(mockApiJson).toHaveBeenCalledWith(expect.stringContaining('/api/coaches'));
    });
  });

  it('loads teams for filter dropdown', async () => {
    await act(async () => { render(<Coaches />); });
    await waitFor(() => {
      expect(mockApiJson).toHaveBeenCalledWith(expect.stringContaining('/api/teams/list'));
    });
  });

  it('displays coach data in table', async () => {
    await act(async () => { render(<Coaches />); });
    await waitFor(() => {
      expect(screen.getByText(/Thomas Müller/)).toBeInTheDocument();
      expect(screen.getByText(/Maria Berger/)).toBeInTheDocument();
    });
  });

  it('shows total count', async () => {
    await act(async () => { render(<Coaches />); });
    await waitFor(() => {
      expect(screen.getByText('30')).toBeInTheDocument();
    });
  });

  it('passes server pagination props to table', async () => {
    await act(async () => { render(<Coaches />); });
    await waitFor(() => {
      const pagination = screen.getByTestId('TablePagination');
      expect(pagination).toBeInTheDocument();
      expect(pagination).toHaveAttribute('data-count', '30');
      expect(pagination).toHaveAttribute('data-page', '0');
      expect(pagination).toHaveAttribute('data-rows-per-page', '25');
    });
  });

  it('fetches next page when pagination changes', async () => {
    await act(async () => { render(<Coaches />); });
    await waitFor(() => {
      expect(screen.getByTestId('TablePagination')).toBeInTheDocument();
    });

    mockApiJson.mockClear();
    mockApiJson.mockImplementation((url: string) => {
      if (url.includes('/api/teams/list')) return Promise.resolve(mockTeamsResponse);
      return Promise.resolve({ ...mockCoachesResponse, page: 2 });
    });

    await act(async () => {
      fireEvent.click(screen.getByTestId('next-page'));
    });

    await waitFor(() => {
      const coachCalls = mockApiJson.mock.calls.filter(
        (c: any[]) => c[0].includes('/api/coaches')
      );
      const lastCall = coachCalls[coachCalls.length - 1][0];
      expect(lastCall).toContain('page=2');
    });
  });

  it('shows empty state when no coaches', async () => {
    mockApiJson.mockImplementation((url: string) => {
      if (url.includes('/api/teams/list')) return Promise.resolve(mockTeamsResponse);
      return Promise.resolve({ coaches: [], total: 0, page: 1, limit: 25 });
    });

    await act(async () => { render(<Coaches />); });

    await waitFor(() => {
      expect(screen.getByText('Keine Trainer vorhanden')).toBeInTheDocument();
    });
  });

  it('shows error state on API failure', async () => {
    mockApiJson.mockImplementation((url: string) => {
      if (url.includes('/api/teams/list')) return Promise.resolve(mockTeamsResponse);
      return Promise.reject(new Error('Network error'));
    });

    await act(async () => { render(<Coaches />); });

    await waitFor(() => {
      expect(screen.getByText('Fehler beim Laden der Trainer.')).toBeInTheDocument();
    });
  });

  it('sends teamId filter parameter', async () => {
    await act(async () => { render(<Coaches />); });
    await waitFor(() => {
      expect(screen.getByTestId('team-select')).toBeInTheDocument();
    });

    mockApiJson.mockClear();
    mockApiJson.mockImplementation((url: string) => {
      if (url.includes('/api/teams/list')) return Promise.resolve(mockTeamsResponse);
      return Promise.resolve({ ...mockCoachesResponse, total: 5 });
    });

    await act(async () => {
      fireEvent.change(screen.getByTestId('team-select'), { target: { value: '1' } });
    });

    await waitFor(() => {
      const coachCalls = mockApiJson.mock.calls.filter(
        (c: any[]) => c[0].includes('/api/coaches')
      );
      if (coachCalls.length > 0) {
        const lastCall = coachCalls[coachCalls.length - 1][0];
        expect(lastCall).toContain('teamId=1');
      }
    });
  });

  it('displays column headers', async () => {
    await act(async () => { render(<Coaches />); });
    await waitFor(() => {
      expect(screen.getByText('Name')).toBeInTheDocument();
      expect(screen.getByText('Verein')).toBeInTheDocument();
      expect(screen.getByText('Teams')).toBeInTheDocument();
      expect(screen.getByText('Lizenzen')).toBeInTheDocument();
    });
  });

  it('renders club assignments', async () => {
    await act(async () => { render(<Coaches />); });
    await waitFor(() => {
      expect(screen.getByText('FC Test')).toBeInTheDocument();
    });
  });

  it('renders license assignments', async () => {
    await act(async () => { render(<Coaches />); });
    await waitFor(() => {
      expect(screen.getByText('B-Lizenz')).toBeInTheDocument();
    });
  });
});
