import React from 'react';
import { render, screen, waitFor, act, fireEvent, within } from '@testing-library/react';
import '@testing-library/jest-dom';

// ── Browser API shims ──────────────────────────────────────────────────────────

Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: jest.fn().mockImplementation((query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: jest.fn(),
    removeListener: jest.fn(),
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  })),
});

// ── MUI Icon mocks ─────────────────────────────────────────────────────────────

jest.mock('@mui/icons-material/BookmarkBorder', () => () => <span>BookmarkBorderIcon</span>);
jest.mock('@mui/icons-material/Bookmark', () => () => <span>BookmarkIcon</span>);
jest.mock('@mui/icons-material/SportsSoccer', () => () => <span>SportsSoccerIcon</span>);
jest.mock('@mui/icons-material/School', () => () => <span>SchoolIcon</span>);
jest.mock('@mui/icons-material/Delete', () => () => <span>DeleteIcon</span>);
jest.mock('@mui/icons-material/VisibilityOff', () => () => <span>VisibilityOffIcon</span>);
jest.mock('@mui/icons-material/Visibility', () => () => <span>VisibilityIcon</span>);
jest.mock('@mui/icons-material/Add', () => () => <span>AddIcon</span>);
jest.mock('@mui/icons-material/Search', () => () => <span>SearchIcon</span>);

// ── MUI component mocks ────────────────────────────────────────────────────────

jest.mock('@mui/material', () => {
  const actual = jest.requireActual('@mui/material');
  return {
    ...actual,
    Box: (props: any) => <div data-testid={props['data-testid']} {...props}>{props.children}</div>,
    Stack: (props: any) => <div {...props}>{props.children}</div>,
    Paper: (props: any) => <div {...props}>{props.children}</div>,
    Card: (props: any) => <div data-testid="Card" {...props}>{props.children}</div>,
    CardContent: (props: any) => <div {...props}>{props.children}</div>,
    Typography: (props: any) => <span data-testid={props['data-testid']} {...props}>{props.children}</span>,
    Chip: (props: any) => <span data-testid="Chip" data-label={props.label}>{props.label}</span>,
    Divider: () => <hr />,
    Button: (props: any) => <button onClick={props.onClick} data-testid={props['data-testid'] ?? 'Button'}>{props.children}</button>,
    IconButton: (props: any) => <button onClick={props.onClick} data-testid={props['data-testid'] ?? 'IconButton'} aria-label={props['aria-label']}>{props.children}</button>,
    Tooltip: (props: any) => <span title={props.title}>{props.children}</span>,
    TextField: (props: any) => (
      <input
        data-testid={props['data-testid'] ?? 'TextField'}
        placeholder={props.placeholder}
        value={props.value ?? ''}
        onChange={(e) => props.onChange?.(e)}
      />
    ),
    InputAdornment: (props: any) => <span>{props.children}</span>,
    Dialog: (props: any) => props.open ? <div role="dialog" data-testid="Dialog">{props.children}</div> : null,
    DialogTitle: (props: any) => <h2>{props.children}</h2>,
    DialogContent: (props: any) => <div>{props.children}</div>,
    Pagination: (props: any) => (
      <div data-testid="Pagination">
        <button data-testid="page-prev" onClick={() => props.onChange?.(null, props.page - 1)}>Prev</button>
        <span data-testid="page-current">{props.page}</span>
        <button data-testid="page-next" onClick={() => props.onChange?.(null, props.page + 1)}>Next</button>
      </div>
    ),
    List: (props: any) => <ul>{props.children}</ul>,
    ListItemButton: (props: any) => <li role="button" onClick={props.onClick} style={props.style}>{props.children}</li>,
    ListItemText: (props: any) => <span data-testid="ListItemText" data-primary={props.primary} data-secondary={props.secondary}>{props.primary}</span>,
    ListItemSecondaryAction: (props: any) => <span>{props.children}</span>,
    ToggleButtonGroup: ({ children, onChange, value }: any) => (
      <div data-testid="ToggleButtonGroup" data-value={value}>
        {React.Children.map(children, (child: any) =>
          React.cloneElement(child, { onChange: (e: any, v: any) => onChange?.(e, v) })
        )}
      </div>
    ),
    ToggleButton: ({ children, value, onChange, ...props }: any) => (
      <button
        data-testid={`ToggleButton-${value}`}
        onClick={() => onChange?.(null, value)}
      >
        {children}
      </button>
    ),
    CircularProgress: () => <span data-testid="CircularProgress" />,
    Snackbar: (props: any) => props.open ? <div data-testid="Snackbar">{props.children}</div> : null,
    Alert: (props: any) => <div data-testid="Alert" role="alert">{props.children}</div>,
    Skeleton: () => <div data-testid="Skeleton" />,
  };
});

// ── AdminPageLayout mock (renders children + loading/error/snackbar) ──────────

jest.mock('../../components/AdminPageLayout', () => ({
  AdminPageLayout: ({ children, loading, error, snackbar, onSnackbarClose, title }: any) => (
    <div data-testid="AdminPageLayout">
      <h1 data-testid="page-title">{title}</h1>
      {loading && <div data-testid="loading-state">Lädt...</div>}
      {error && <div data-testid="error-state" role="alert">{error}</div>}
      {!loading && !error && children}
      {snackbar?.open && (
        <div data-testid="snackbar-message" onClick={onSnackbarClose}>{snackbar.message}</div>
      )}
    </div>
  ),
  AdminEmptyState: ({ title, createLabel, onCreate }: any) => (
    <div data-testid="AdminEmptyState">
      <span>{title}</span>
      {createLabel && <button onClick={onCreate}>{createLabel}</button>}
    </div>
  ),
}));

// ── API mocks ──────────────────────────────────────────────────────────────────

jest.mock('../../utils/api', () => ({
  apiJson: jest.fn(),
  apiRequest: jest.fn(),
}));

import { apiJson, apiRequest } from '../../utils/api';
const mockApiJson = apiJson as jest.MockedFunction<typeof apiJson>;
const mockApiRequest = apiRequest as jest.MockedFunction<typeof apiRequest>;

// ── Suppress console noise ─────────────────────────────────────────────────────
beforeAll(() => {
  jest.spyOn(console, 'error').mockImplementation(() => {});
  jest.spyOn(console, 'log').mockImplementation(() => {});
});
afterAll(() => {
  (console.error as jest.Mock).mockRestore();
  (console.log as jest.Mock).mockRestore();
});

// ── Component under test ───────────────────────────────────────────────────────

import Watchlist from '../Watchlist';

// ── Fixtures ───────────────────────────────────────────────────────────────────

const makePlayerEntry = (id = 1, overrides: Record<string, any> = {}) => ({
  id,
  isAnonymous: false,
  createdAt: '2026-01-01T00:00:00+00:00',
  type: 'player' as const,
  player: {
    id: 10 + id,
    firstName: 'Max',
    lastName: `Mustermann${id}`,
    clubAssignments: [{ id: 1, startDate: '2024-01-01', endDate: null, club: { id: 1, name: 'FC Test' } }],
    stats: {
      totalGames: 5,
      totalMinutesPlayed: 450,
      eventCounts: [{ type: 'Tore', count: 3 }],
    },
  },
  ...overrides,
});

const makeCoachEntry = (id = 2) => ({
  id,
  isAnonymous: false,
  createdAt: '2026-01-15T00:00:00+00:00',
  type: 'coach' as const,
  coach: {
    id: 20 + id,
    firstName: 'Karl',
    lastName: 'Trainer',
    clubAssignments: [],
  },
});

const makeSearchResult = (id: number, name: string, isWatched = false) => ({
  id,
  name,
  currentClub: 'FC Testverein',
  isWatched,
});

// ── Tests ──────────────────────────────────────────────────────────────────────

describe('Watchlist', () => {
  beforeEach(() => {
    mockApiJson.mockReset();
    mockApiRequest.mockReset();
  });

  // ── Laden & Anzeigen ────────────────────────────────────────────────────────

  it('zeigt Seiten-Titel an', async () => {
    mockApiJson.mockResolvedValueOnce({ watchlist: [] });

    await act(async () => { render(<Watchlist />); });

    await waitFor(() => {
      expect(screen.getByTestId('page-title')).toHaveTextContent('Beobachtungsliste');
    });
  });

  it('lädt die Watchlist beim Mounten', async () => {
    mockApiJson.mockResolvedValueOnce({ watchlist: [] });

    await act(async () => { render(<Watchlist />); });

    await waitFor(() => {
      expect(mockApiJson).toHaveBeenCalledWith('/api/watchlist');
    });
  });

  it('zeigt Spieler-Einträge an', async () => {
    mockApiJson.mockResolvedValueOnce({ watchlist: [makePlayerEntry(1)] });

    await act(async () => { render(<Watchlist />); });

    await waitFor(() => {
      expect(screen.getByText(/Mustermann1/)).toBeInTheDocument();
    });
  });

  it('zeigt Trainer-Einträge an', async () => {
    mockApiJson.mockResolvedValueOnce({ watchlist: [makeCoachEntry(2)] });

    await act(async () => { render(<Watchlist />); });

    await waitFor(() => {
      expect(screen.getByText('Trainer')).toBeInTheDocument();
    });
  });

  it('zeigt Spieler-Stats an wenn vorhanden', async () => {
    mockApiJson.mockResolvedValueOnce({ watchlist: [makePlayerEntry(1)] });

    await act(async () => { render(<Watchlist />); });

    await waitFor(() => {
      expect(screen.getByText('5')).toBeInTheDocument();   // totalGames
      expect(screen.getByText('450')).toBeInTheDocument(); // totalMinutesPlayed
    });
  });

  it('zeigt aktuellen Verein an', async () => {
    mockApiJson.mockResolvedValueOnce({ watchlist: [makePlayerEntry(1)] });

    await act(async () => { render(<Watchlist />); });

    await waitFor(() => {
      expect(screen.getByText(/FC Test/)).toBeInTheDocument();
    });
  });

  it('zeigt "Vereinslos" wenn keine aktive Clubzugehörigkeit', async () => {
    const entry = makePlayerEntry(1);
    entry.player.clubAssignments = [];
    mockApiJson.mockResolvedValueOnce({ watchlist: [entry] });

    await act(async () => { render(<Watchlist />); });

    await waitFor(() => {
      expect(screen.getByText('Vereinslos')).toBeInTheDocument();
    });
  });

  it('zeigt Fehler bei Ladefehler', async () => {
    mockApiJson.mockRejectedValueOnce(new Error('Network Error'));

    await act(async () => { render(<Watchlist />); });

    await waitFor(() => {
      expect(screen.getByTestId('error-state')).toBeInTheDocument();
    });
  });

  it('zeigt Empty-State wenn Liste leer', async () => {
    mockApiJson.mockResolvedValueOnce({ watchlist: [] });

    await act(async () => { render(<Watchlist />); });

    await waitFor(() => {
      expect(screen.getByTestId('AdminEmptyState')).toBeInTheDocument();
    });
  });

  // ── Filter ──────────────────────────────────────────────────────────────────

  it('filtert Einträge nach Name', async () => {
    mockApiJson.mockResolvedValueOnce({
      watchlist: [makePlayerEntry(1), makePlayerEntry(3)],
    });

    await act(async () => { render(<Watchlist />); });

    await waitFor(() => {
      expect(screen.getByText(/Mustermann1/)).toBeInTheDocument();
      expect(screen.getByText(/Mustermann3/)).toBeInTheDocument();
    });

    // Tippe "Mustermann1" in Suchfeld
    const input = screen.getByPlaceholderText('In Liste suchen...');
    await act(async () => { fireEvent.change(input, { target: { value: 'Mustermann1' } }); });

    await waitFor(() => {
      expect(screen.getByText(/Mustermann1/)).toBeInTheDocument();
      expect(screen.queryByText(/Mustermann3/)).not.toBeInTheDocument();
    });
  });

  it('zeigt "Kein Eintrag gefunden" wenn Filter keine Treffer hat', async () => {
    mockApiJson.mockResolvedValueOnce({ watchlist: [makePlayerEntry(1)] });

    await act(async () => { render(<Watchlist />); });
    await waitFor(() => expect(screen.getByText(/Mustermann1/)).toBeInTheDocument());

    const input = screen.getByPlaceholderText('In Liste suchen...');
    await act(async () => { fireEvent.change(input, { target: { value: 'XYZ_unbekannt' } }); });

    await waitFor(() => {
      expect(screen.getByText('Kein Eintrag gefunden.')).toBeInTheDocument();
    });
  });

  // ── Löschen ─────────────────────────────────────────────────────────────────

  it('entfernt Eintrag nach Klick auf Löschen-Button', async () => {
    mockApiJson.mockResolvedValueOnce({ watchlist: [makePlayerEntry(1)] });
    mockApiRequest.mockResolvedValueOnce(undefined as unknown as Response);

    await act(async () => { render(<Watchlist />); });
    await waitFor(() => expect(screen.getByText(/Mustermann1/)).toBeInTheDocument());

    const deleteButtons = screen.getAllByTestId('IconButton');
    // Letzter Button in jeder Karte ist der Lösch-Button
    await act(async () => { fireEvent.click(deleteButtons[deleteButtons.length - 1]); });

    await waitFor(() => {
      expect(mockApiRequest).toHaveBeenCalledWith(
        '/api/watchlist/1',
        expect.objectContaining({ method: 'DELETE' }),
      );
    });

    await waitFor(() => {
      expect(screen.queryByText(/Mustermann1/)).not.toBeInTheDocument();
    });
  });

  it('zeigt Snackbar-Fehler bei fehlgeschlagenem Löschen', async () => {
    mockApiJson.mockResolvedValueOnce({ watchlist: [makePlayerEntry(1)] });
    mockApiRequest.mockRejectedValueOnce(new Error('Server Error'));

    await act(async () => { render(<Watchlist />); });
    await waitFor(() => expect(screen.getByText(/Mustermann1/)).toBeInTheDocument());

    const deleteButtons = screen.getAllByTestId('IconButton');
    await act(async () => { fireEvent.click(deleteButtons[deleteButtons.length - 1]); });

    await waitFor(() => {
      expect(screen.getByTestId('snackbar-message')).toHaveTextContent('Fehler beim Entfernen.');
    });
  });

  // ── Anonymität umschalten ───────────────────────────────────────────────────

  it('toggelt isAnonymous via PATCH', async () => {
    mockApiJson.mockResolvedValueOnce({ watchlist: [makePlayerEntry(1)] });
    mockApiRequest.mockResolvedValueOnce(undefined as unknown as Response);

    await act(async () => { render(<Watchlist />); });
    await waitFor(() => expect(screen.getByText(/Mustermann1/)).toBeInTheDocument());

    // Erster IconButton in der Karte ist der Anonym-Toggle
    const buttons = screen.getAllByTestId('IconButton');
    await act(async () => { fireEvent.click(buttons[0]); });

    await waitFor(() => {
      expect(mockApiRequest).toHaveBeenCalledWith(
        '/api/watchlist/1',
        expect.objectContaining({ method: 'PATCH', body: { isAnonymous: true } }),
      );
    });
  });

  // ── Dialog öffnen ───────────────────────────────────────────────────────────

  it('öffnet Hinzufügen-Dialog bei Klick auf Button', async () => {
    mockApiJson.mockResolvedValueOnce({ watchlist: [] });

    await act(async () => { render(<Watchlist />); });
    await waitFor(() => expect(screen.getByTestId('AdminEmptyState')).toBeInTheDocument());

    const addButton = screen.getByText('Hinzufügen');
    await act(async () => { fireEvent.click(addButton); });

    await waitFor(() => {
      expect(screen.getByRole('dialog')).toBeInTheDocument();
    });
  });

  it('zeigt "Spieler oder Trainer beobachten" als Dialog-Titel', async () => {
    mockApiJson.mockResolvedValueOnce({ watchlist: [] });

    await act(async () => { render(<Watchlist />); });
    await waitFor(() => expect(screen.getByTestId('AdminEmptyState')).toBeInTheDocument());

    await act(async () => { fireEvent.click(screen.getByText('Hinzufügen')); });

    await waitFor(() => {
      expect(screen.getByText('Spieler oder Trainer beobachten')).toBeInTheDocument();
    });
  });

  // ── Dialog-Suche ────────────────────────────────────────────────────────────

  it('sucht nach Spielern wenn mind. 2 Zeichen eingegeben werden', async () => {
    jest.useFakeTimers();
    mockApiJson
      .mockResolvedValueOnce({ watchlist: [] })
      .mockResolvedValueOnce({ results: [makeSearchResult(1, 'Franz Müller')] });

    await act(async () => { render(<Watchlist />); });
    await waitFor(() => expect(screen.getByTestId('AdminEmptyState')).toBeInTheDocument());

    await act(async () => { fireEvent.click(screen.getByText('Hinzufügen')); });
    await waitFor(() => expect(screen.getByRole('dialog')).toBeInTheDocument());

    const searchInput = screen.getByPlaceholderText('Spielername suchen...');
    await act(async () => { fireEvent.change(searchInput, { target: { value: 'Fr' } }); });
    await act(async () => { jest.runAllTimers(); });
    await act(async () => { await Promise.resolve(); });

    await waitFor(() => {
      expect(mockApiJson).toHaveBeenCalledWith(
        expect.stringContaining('/api/watchlist/search?q=Fr&type=player'),
      );
    });
    jest.useRealTimers();
  });

  it('sucht nach Trainern wenn Trainer-Tab ausgewählt ist', async () => {
    jest.useFakeTimers();
    mockApiJson
      .mockResolvedValueOnce({ watchlist: [] })
      .mockResolvedValueOnce({ results: [makeSearchResult(5, 'Karl Kluge')] });

    await act(async () => { render(<Watchlist />); });
    await waitFor(() => expect(screen.getByTestId('AdminEmptyState')).toBeInTheDocument());

    await act(async () => { fireEvent.click(screen.getByText('Hinzufügen')); });
    await waitFor(() => expect(screen.getByRole('dialog')).toBeInTheDocument());

    // Trainer-Tab wählen
    await act(async () => { fireEvent.click(screen.getByTestId('ToggleButton-coach')); });

    const searchInput = screen.getByPlaceholderText('Trainername suchen...');
    await act(async () => { fireEvent.change(searchInput, { target: { value: 'Ka' } }); });
    await act(async () => { jest.runAllTimers(); });
    await act(async () => { await Promise.resolve(); });

    await waitFor(() => {
      expect(mockApiJson).toHaveBeenCalledWith(
        expect.stringContaining('type=coach'),
      );
    });
    jest.useRealTimers();
  });

  it('zeigt Suchergebnisse in der Liste an', async () => {
    jest.useFakeTimers();
    mockApiJson
      .mockResolvedValueOnce({ watchlist: [] })
      .mockResolvedValueOnce({ results: [makeSearchResult(1, 'Franz Müller')] });

    await act(async () => { render(<Watchlist />); });
    await waitFor(() => expect(screen.getByTestId('AdminEmptyState')).toBeInTheDocument());

    await act(async () => { fireEvent.click(screen.getByText('Hinzufügen')); });
    await waitFor(() => expect(screen.getByRole('dialog')).toBeInTheDocument());

    const searchInput = screen.getByPlaceholderText('Spielername suchen...');
    await act(async () => { fireEvent.change(searchInput, { target: { value: 'Fr' } }); });
    await act(async () => { jest.runAllTimers(); });
    await act(async () => { await Promise.resolve(); });

    await waitFor(() => {
      expect(screen.getByText('Franz Müller')).toBeInTheDocument();
    });
    jest.useRealTimers();
  });

  it('zeigt "Keine Ergebnisse." wenn Suche leer zurückkommt', async () => {
    jest.useFakeTimers();
    mockApiJson
      .mockResolvedValueOnce({ watchlist: [] })
      .mockResolvedValueOnce({ results: [] });

    await act(async () => { render(<Watchlist />); });
    await waitFor(() => expect(screen.getByTestId('AdminEmptyState')).toBeInTheDocument());

    await act(async () => { fireEvent.click(screen.getByText('Hinzufügen')); });
    await waitFor(() => expect(screen.getByRole('dialog')).toBeInTheDocument());

    const searchInput = screen.getByPlaceholderText('Spielername suchen...');
    await act(async () => { fireEvent.change(searchInput, { target: { value: 'XX' } }); });
    await act(async () => { jest.runAllTimers(); });
    await act(async () => { await Promise.resolve(); });

    await waitFor(() => {
      expect(screen.getByText('Keine Ergebnisse.')).toBeInTheDocument();
    });
    jest.useRealTimers();
  });

  // ── Pagination ──────────────────────────────────────────────────────────────

  it('zeigt Pagination wenn mehr als 10 Einträge vorhanden', async () => {
    const entries = Array.from({ length: 11 }, (_, i) => makePlayerEntry(i + 1));
    mockApiJson.mockResolvedValueOnce({ watchlist: entries });

    await act(async () => { render(<Watchlist />); });

    await waitFor(() => {
      expect(screen.getByTestId('Pagination')).toBeInTheDocument();
    });
  });

  it('zeigt keine Pagination wenn 10 oder weniger Einträge', async () => {
    const entries = Array.from({ length: 10 }, (_, i) => makePlayerEntry(i + 1));
    mockApiJson.mockResolvedValueOnce({ watchlist: entries });

    await act(async () => { render(<Watchlist />); });

    await waitFor(() => {
      expect(screen.queryByTestId('Pagination')).not.toBeInTheDocument();
    });
  });

  it('wechselt auf Seite 2 wenn Pagination-Button geklickt', async () => {
    const entries = Array.from({ length: 11 }, (_, i) => makePlayerEntry(i + 1));
    mockApiJson.mockResolvedValueOnce({ watchlist: entries });

    await act(async () => { render(<Watchlist />); });
    await waitFor(() => expect(screen.getByTestId('Pagination')).toBeInTheDocument());

    await act(async () => { fireEvent.click(screen.getByTestId('page-next')); });

    await waitFor(() => {
      expect(screen.getByTestId('page-current')).toHaveTextContent('2');
    });
  });

  it('setzt Pagination auf Seite 1 zurück wenn Filter geändert wird', async () => {
    const entries = Array.from({ length: 15 }, (_, i) => makePlayerEntry(i + 1));
    mockApiJson.mockResolvedValueOnce({ watchlist: entries });

    await act(async () => { render(<Watchlist />); });
    await waitFor(() => expect(screen.getByTestId('Pagination')).toBeInTheDocument());

    // Zur Seite 2 navigieren
    await act(async () => { fireEvent.click(screen.getByTestId('page-next')); });
    await waitFor(() => expect(screen.getByTestId('page-current')).toHaveTextContent('2'));

    // Filter eingeben → zurück auf Seite 1
    const input = screen.getByPlaceholderText('In Liste suchen...');
    await act(async () => { fireEvent.change(input, { target: { value: 'Muster' } }); });

    await waitFor(() => {
      expect(screen.getByTestId('page-current')).toHaveTextContent('1');
    });
  });
});
