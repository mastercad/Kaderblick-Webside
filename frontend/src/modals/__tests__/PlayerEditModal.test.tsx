import React from 'react';
import { render, screen, waitFor, act, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import PlayerEditModal from '../PlayerEditModal';

// ────── Mock BaseModal ──────
jest.mock('../BaseModal', () => (props: any) =>
  props.open ? <div data-testid="BaseModal">{props.title}<div>{props.children}</div></div> : null
);

// ────── Mock child modals ──────
jest.mock('../NationalityEditModal', () => (props: any) =>
  props.open ? <div data-testid="NationalityEditModal" /> : null
);
jest.mock('../ClubEditModal', () => (props: any) =>
  props.open ? <div data-testid="ClubEditModal" /> : null
);

// ────── Mock MUI ──────
jest.mock('@mui/material', () => {
  const actual = jest.requireActual('@mui/material');
  return {
    ...actual,
    Box: (props: any) => <div {...(props.sx ? { 'data-sx': JSON.stringify(props.sx) } : {})}>{props.children}</div>,
    Typography: (props: any) => <span>{props.children}</span>,
    TextField: (props: any) => (
      <input
        data-testid={props['data-testid'] || `field-${props.name || props.label}`}
        name={props.name}
        value={props.value || ''}
        placeholder={props.label}
        onChange={props.onChange}
        required={props.required}
      />
    ),
    Button: (props: any) => (
      <button data-testid={props['data-testid'] || 'Button'} onClick={props.onClick}>
        {props.children}
      </button>
    ),
    Alert: (props: any) => (
      <div data-testid="Alert" role="alert" data-severity={props.severity}>
        {props.children}
      </div>
    ),
    CircularProgress: () => <div data-testid="CircularProgress" />,
    Chip: (props: any) => <span data-testid="Chip">{props.label}</span>,
    Stack: (props: any) => <div>{props.children}</div>,
    IconButton: (props: any) => <button onClick={props.onClick}>{props.children}</button>,
    Divider: () => <hr />,
    InputAdornment: (props: any) => <span>{props.children}</span>,
  };
});

jest.mock('@mui/material/Autocomplete', () => (props: any) => (
  <div data-testid="Autocomplete">
    {props.renderInput({ InputProps: { endAdornment: null } })}
  </div>
));

// ────── Mock icons ──────
jest.mock('@mui/icons-material/Delete', () => () => <span>Delete</span>);
jest.mock('@mui/icons-material/Add', () => () => <span>Add</span>);

// ────── Mock API ──────
const mockApiJson = jest.fn();
jest.mock('../../utils/api', () => ({
  apiJson: (...args: any[]) => mockApiJson(...args),
}));

// ────── Default props ──────
const defaultProps = {
  openPlayerEditModal: true,
  playerId: null as number | null,
  onPlayerEditModalClose: jest.fn(),
  onPlayerSaved: jest.fn(),
};

function makePlayer(overrides: Record<string, any> = {}) {
  return {
    id: 5,
    firstName: 'Max',
    lastName: 'Mustermann',
    birthdate: '2000-01-01',
    email: 'max@test.de',
    clubAssignments: [],
    teamAssignments: [],
    nationalityAssignments: [],
    permissions: { canEditStammdaten: true, canEdit: true },
    ...overrides,
  };
}

function setupRefDataMock(playerResponse?: any) {
  mockApiJson.mockImplementation((url: string) => {
    if (url.includes('/api/clubs')) return Promise.resolve({ entries: [] });
    if (url.includes('/api/teams')) return Promise.resolve({ teams: [] });
    if (url.includes('/api/strong-feet')) return Promise.resolve({ strongFeets: [] });
    if (url.includes('/api/positions')) return Promise.resolve({ positions: [] });
    if (url.includes('/api/player-team-assignment-types')) return Promise.resolve({ playerTeamAssignmentTypes: [] });
    if (url.includes('/api/nationalities')) return Promise.resolve({ nationalities: [] });
    if (url.includes('/api/players/') && playerResponse) return Promise.resolve({ player: playerResponse });
    return Promise.resolve({});
  });
}

beforeAll(() => {
  jest.spyOn(console, 'log').mockImplementation(() => {});
  jest.spyOn(console, 'error').mockImplementation(() => {});
});
afterAll(() => {
  (console.log as jest.Mock).mockRestore();
  (console.error as jest.Mock).mockRestore();
});

beforeEach(() => {
  mockApiJson.mockReset();
  defaultProps.onPlayerEditModalClose.mockReset();
  defaultProps.onPlayerSaved.mockReset();
  setupRefDataMock();
});

// ────── Tests ──────

describe('PlayerEditModal – closed state', () => {
  it('renders nothing when openPlayerEditModal is false', () => {
    render(<PlayerEditModal {...defaultProps} openPlayerEditModal={false} />);
    expect(screen.queryByTestId('BaseModal')).not.toBeInTheDocument();
  });
});

describe('PlayerEditModal – open with playerId=null', () => {
  it('renders the modal when open', async () => {
    await act(async () => {
      render(<PlayerEditModal {...defaultProps} />);
    });
    expect(screen.getByTestId('BaseModal')).toBeInTheDocument();
  });

  it('shows player search section when playerId is null', async () => {
    await act(async () => {
      render(<PlayerEditModal {...defaultProps} />);
    });
    // At least one Autocomplete for the player search
    expect(screen.getAllByTestId('Autocomplete').length).toBeGreaterThanOrEqual(1);
  });

  it('shows "Neuen Spieler anlegen" button in search section', async () => {
    await act(async () => {
      render(<PlayerEditModal {...defaultProps} />);
    });
    expect(screen.getByText('Neuen Spieler anlegen')).toBeInTheDocument();
  });

  it('loads reference data (clubs, teams, etc.) on open', async () => {
    await act(async () => {
      render(<PlayerEditModal {...defaultProps} />);
    });
    await waitFor(() => {
      expect(mockApiJson).toHaveBeenCalledWith(expect.stringContaining('/api/clubs'));
      expect(mockApiJson).toHaveBeenCalledWith(expect.stringContaining('/api/teams'));
      expect(mockApiJson).toHaveBeenCalledWith(expect.stringContaining('/api/strong-feet'));
      expect(mockApiJson).toHaveBeenCalledWith(expect.stringContaining('/api/positions'));
      expect(mockApiJson).toHaveBeenCalledWith(expect.stringContaining('/api/nationalities'));
    });
  });

  it('shows title "Spieler anlegen / zuordnen" when playerId is null', async () => {
    await act(async () => {
      render(<PlayerEditModal {...defaultProps} />);
    });
    expect(screen.getByTestId('BaseModal')).toHaveTextContent('Spieler anlegen / zuordnen');
  });
});

describe('PlayerEditModal – open with playerId set', () => {
  it('fetches player data via /api/players/{id}', async () => {
    const player = makePlayer();
    setupRefDataMock(player);

    await act(async () => {
      render(<PlayerEditModal {...defaultProps} playerId={5} />);
    });

    await waitFor(() => {
      expect(mockApiJson).toHaveBeenCalledWith('/api/players/5');
    });
  });

  it('shows CircularProgress while loading', async () => {
    // delay the API response so loading state is visible
    mockApiJson.mockImplementation((url: string) => {
      if (url.includes('/api/players/5')) return new Promise(() => {});  // never resolves
      return Promise.resolve({});
    });

    await act(async () => {
      render(<PlayerEditModal {...defaultProps} playerId={5} />);
    });

    expect(screen.getByTestId('CircularProgress')).toBeInTheDocument();
  });

  it('shows player form after successful load', async () => {
    const player = makePlayer();
    setupRefDataMock(player);

    await act(async () => {
      render(<PlayerEditModal {...defaultProps} playerId={5} />);
    });

    await waitFor(() => {
      expect(screen.queryByTestId('CircularProgress')).not.toBeInTheDocument();
    });

    expect(screen.getByTestId('BaseModal')).toBeInTheDocument();
  });

  it('shows "Spieler bearbeiten" title when player has an id', async () => {
    const player = makePlayer();
    setupRefDataMock(player);

    await act(async () => {
      render(<PlayerEditModal {...defaultProps} playerId={5} />);
    });

    await waitFor(() => {
      expect(screen.queryByTestId('CircularProgress')).not.toBeInTheDocument();
    });

    expect(screen.getByTestId('BaseModal')).toHaveTextContent('Spieler bearbeiten');
  });
});

describe('PlayerEditModal – canEditStammdaten=false', () => {
  it('shows warning alert when canEditStammdaten is false', async () => {
    const player = makePlayer({ permissions: { canEditStammdaten: false, canEdit: true } });
    setupRefDataMock(player);

    await act(async () => {
      render(<PlayerEditModal {...defaultProps} playerId={5} />);
    });

    await waitFor(() => {
      expect(screen.queryByTestId('CircularProgress')).not.toBeInTheDocument();
    });

    const alert = screen.getByRole('alert');
    expect(alert).toBeInTheDocument();
    expect(alert).toHaveAttribute('data-severity', 'warning');
  });

  it('does NOT show warning alert when canEditStammdaten is true', async () => {
    const player = makePlayer({ permissions: { canEditStammdaten: true, canEdit: true } });
    setupRefDataMock(player);

    await act(async () => {
      render(<PlayerEditModal {...defaultProps} playerId={5} />);
    });

    await waitFor(() => {
      expect(screen.queryByTestId('CircularProgress')).not.toBeInTheDocument();
    });

    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });
});

describe('PlayerEditModal – form submission', () => {
  it('calls PUT /api/players/{id} for an existing player', async () => {
    const player = makePlayer();
    setupRefDataMock(player);
    mockApiJson.mockImplementation((url: string, opts?: any) => {
      if (url === '/api/players/5' && (!opts || !opts.method)) return Promise.resolve({ player });
      if (url === '/api/players/5' && opts?.method === 'PUT') return Promise.resolve({ player });
      if (url.includes('/api/clubs')) return Promise.resolve({ entries: [] });
      if (url.includes('/api/teams')) return Promise.resolve({ teams: [] });
      if (url.includes('/api/strong-feet')) return Promise.resolve({ strongFeets: [] });
      if (url.includes('/api/positions')) return Promise.resolve({ positions: [] });
      if (url.includes('/api/player-team-assignment-types')) return Promise.resolve({ playerTeamAssignmentTypes: [] });
      if (url.includes('/api/nationalities')) return Promise.resolve({ nationalities: [] });
      return Promise.resolve({});
    });

    await act(async () => {
      render(<PlayerEditModal {...defaultProps} playerId={5} />);
    });

    await waitFor(() => {
      expect(screen.queryByTestId('CircularProgress')).not.toBeInTheDocument();
    });

    await act(async () => {
      const form = document.querySelector('form#playerEditForm');
      if (form) fireEvent.submit(form);
    });

    await waitFor(() => {
      expect(mockApiJson).toHaveBeenCalledWith(
        '/api/players/5',
        expect.objectContaining({ method: 'PUT' }),
      );
    });
  });

  it('calls POST /api/players for a new player (playerId=null, search bypassed)', async () => {
    setupRefDataMock();
    mockApiJson.mockResolvedValue({});

    await act(async () => {
      render(<PlayerEditModal {...defaultProps} playerId={null} />);
    });

    // Click "Neuen Spieler anlegen" to hide search and show empty form
    await act(async () => {
      fireEvent.click(screen.getByText('Neuen Spieler anlegen'));
    });

    // Fill in a field so player state is no longer null
    await act(async () => {
      const inputs = screen.getAllByPlaceholderText('Vorname');
      fireEvent.change(inputs[0], {
        target: { name: 'firstName', value: 'Test', type: 'text', checked: false },
      });
    });

    mockApiJson.mockResolvedValue({ player: { id: 99, firstName: 'Test', lastName: '' } });

    await act(async () => {
      const form = document.querySelector('form#playerEditForm');
      if (form) fireEvent.submit(form);
    });

    await waitFor(() => {
      expect(mockApiJson).toHaveBeenCalledWith(
        '/api/players',
        expect.objectContaining({ method: 'POST' }),
      );
    });
  });
});

describe('PlayerEditModal – error handling', () => {
  it('shows error alert when player load fails', async () => {
    mockApiJson.mockImplementation((url: string) => {
      if (url.includes('/api/players/5')) return Promise.reject(new Error('Network error'));
      return Promise.resolve({});
    });

    await act(async () => {
      render(<PlayerEditModal {...defaultProps} playerId={5} />);
    });

    await waitFor(() => {
      const alert = screen.getByRole('alert');
      expect(alert).toHaveAttribute('data-severity', 'error');
    });
  });
});
