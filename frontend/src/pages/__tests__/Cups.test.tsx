import React from 'react';
import { render, screen, waitFor, act, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import Cups from '../Cups';

// ────── Mock MUI ──────
jest.mock('@mui/material', () => {
  const actual = jest.requireActual('@mui/material');
  return {
    ...actual,
    Typography: (props: any) => <span {...props}>{props.children}</span>,
    Paper: (props: any) => <div {...props}>{props.children}</div>,
    Box: (props: any) => <div {...props}>{props.children}</div>,
    Button: (props: any) => <button onClick={props.onClick} data-testid={props['data-testid']}>{props.children}</button>,
    Skeleton: () => <div data-testid="Skeleton" />,
    Alert: (props: any) => <div data-testid="Alert" role="alert">{props.children}</div>,
    Snackbar: (props: any) => props.open ? <div data-testid="Snackbar">{props.children}</div> : null,
    TextField: (props: any) => (
      <input
        data-testid="search-input"
        placeholder={props.placeholder}
        value={props.value}
        onChange={(e: any) => props.onChange?.(e)}
      />
    ),
    InputAdornment: (props: any) => <span>{props.children}</span>,
    Tooltip: (props: any) => <span>{props.children}</span>,
    IconButton: (props: any) => <button onClick={props.onClick}>{props.children}</button>,
    Stack: (props: any) => <div {...props}>{props.children}</div>,
    Table: (props: any) => <table>{props.children}</table>,
    TableBody: (props: any) => <tbody>{props.children}</tbody>,
    TableCell: (props: any) => <td>{props.children}</td>,
    TableContainer: (props: any) => <div>{props.children}</div>,
    TableHead: (props: any) => <thead>{props.children}</thead>,
    TableRow: (props: any) => <tr>{props.children}</tr>,
  };
});

jest.mock('@mui/icons-material/WorkspacePremium', () => () => <span>WorkspacePremiumIcon</span>);
jest.mock('@mui/icons-material/Add', () => () => <span>+</span>);
jest.mock('@mui/icons-material/Search', () => () => <span>🔍</span>);
jest.mock('@mui/icons-material/Edit', () => () => <span>✏️</span>);
jest.mock('@mui/icons-material/Delete', () => () => <span>🗑️</span>);
jest.mock('@mui/icons-material/Clear', () => () => <span>✕</span>);
jest.mock('@mui/icons-material/InfoOutlined', () => () => <span>ℹ️</span>);

// ────── Mock child modals ──────
jest.mock('../../modals/CupEditModal', () => (props: any) =>
  props.openCupEditModal ? <div data-testid="CupEditModal">Edit</div> : null
);
jest.mock('../../modals/CupDeleteConfirmationModal', () => (props: any) =>
  props.open ? (
    <div data-testid="CupDeleteModal">
      <button data-testid="confirm-delete" onClick={props.onConfirm}>Bestätigen</button>
    </div>
  ) : null
);

// ────── Mock API ──────
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

// ────── Test data ──────
const mockCupsResponse = {
  cups: [
    { id: 1, name: 'DFB-Pokal', permissions: { canView: true, canEdit: true, canCreate: true, canDelete: true } },
    { id: 2, name: 'Landespokal', permissions: { canView: true, canEdit: true, canCreate: true, canDelete: true } },
    { id: 3, name: 'Kreispokal', permissions: { canView: true, canEdit: false, canCreate: true, canDelete: false } },
  ],
};

beforeEach(() => {
  mockApiJson.mockReset();
  mockApiJson.mockResolvedValue(mockCupsResponse);
});

// ────── Tests ──────

describe('Cups Page', () => {
  describe('Rendering & Data Loading', () => {
    it('renders page title "Pokale"', async () => {
      await act(async () => { render(<Cups />); });
      await waitFor(() => {
        expect(screen.getByText('Pokale')).toBeInTheDocument();
      });
    });

    it('fetches cups from /api/cups on mount', async () => {
      await act(async () => { render(<Cups />); });
      await waitFor(() => {
        expect(mockApiJson).toHaveBeenCalledWith('/api/cups');
      });
    });

    it('displays cup names in table', async () => {
      await act(async () => { render(<Cups />); });
      await waitFor(() => {
        expect(screen.getByText('DFB-Pokal')).toBeInTheDocument();
        expect(screen.getByText('Landespokal')).toBeInTheDocument();
        expect(screen.getByText('Kreispokal')).toBeInTheDocument();
      });
    });

    it('renders "Name" column header', async () => {
      await act(async () => { render(<Cups />); });
      await waitFor(() => {
        expect(screen.getByText('Name')).toBeInTheDocument();
      });
    });

    it('shows item count badge', async () => {
      await act(async () => { render(<Cups />); });
      await waitFor(() => {
        expect(screen.getByText('3')).toBeInTheDocument();
      });
    });
  });

  describe('Empty & Error States', () => {
    it('shows empty state when no cups returned', async () => {
      mockApiJson.mockResolvedValue({ cups: [] });
      await act(async () => { render(<Cups />); });
      await waitFor(() => {
        expect(screen.getByText('Keine Pokale vorhanden')).toBeInTheDocument();
      });
    });

    it('shows error message on API failure', async () => {
      mockApiJson.mockRejectedValue(new Error('Server error'));
      await act(async () => { render(<Cups />); });
      await waitFor(() => {
        expect(screen.getByText('Fehler beim Laden der Pokale.')).toBeInTheDocument();
      });
    });
  });

  describe('Search', () => {
    it('filters cups by search term', async () => {
      await act(async () => { render(<Cups />); });
      await waitFor(() => {
        expect(screen.getByText('DFB-Pokal')).toBeInTheDocument();
      });

      const searchInput = screen.getByTestId('search-input');
      await act(async () => {
        fireEvent.change(searchInput, { target: { value: 'dfb' } });
      });

      await waitFor(() => {
        expect(screen.getByText('DFB-Pokal')).toBeInTheDocument();
        expect(screen.queryByText('Landespokal')).not.toBeInTheDocument();
        expect(screen.queryByText('Kreispokal')).not.toBeInTheDocument();
      });
    });

    it('shows all cups when search is cleared', async () => {
      await act(async () => { render(<Cups />); });
      await waitFor(() => { expect(screen.getByText('DFB-Pokal')).toBeInTheDocument(); });

      const searchInput = screen.getByTestId('search-input');
      await act(async () => { fireEvent.change(searchInput, { target: { value: 'dfb' } }); });
      await act(async () => { fireEvent.change(searchInput, { target: { value: '' } }); });

      await waitFor(() => {
        expect(screen.getByText('DFB-Pokal')).toBeInTheDocument();
        expect(screen.getByText('Landespokal')).toBeInTheDocument();
        expect(screen.getByText('Kreispokal')).toBeInTheDocument();
      });
    });

    it('shows empty state when search matches nothing', async () => {
      await act(async () => { render(<Cups />); });
      await waitFor(() => { expect(screen.getByText('DFB-Pokal')).toBeInTheDocument(); });

      const searchInput = screen.getByTestId('search-input');
      await act(async () => {
        fireEvent.change(searchInput, { target: { value: 'xyznotfound' } });
      });

      await waitFor(() => {
        expect(screen.getByText('Keine Pokale vorhanden')).toBeInTheDocument();
      });
    });
  });

  describe('Create Modal', () => {
    it('opens CupEditModal when "Neuer Pokal" create button is clicked', async () => {
      await act(async () => { render(<Cups />); });
      await waitFor(() => { expect(screen.getByText('Neuer Pokal')).toBeInTheDocument(); });

      expect(screen.queryByTestId('CupEditModal')).not.toBeInTheDocument();

      await act(async () => {
        fireEvent.click(screen.getAllByText('Neuer Pokal')[0]);
      });

      await waitFor(() => {
        expect(screen.getByTestId('CupEditModal')).toBeInTheDocument();
      });
    });
  });

  describe('Edit Modal', () => {
    it('opens CupEditModal on edit button click (canEdit: true)', async () => {
      await act(async () => { render(<Cups />); });
      await waitFor(() => { expect(screen.getByText('DFB-Pokal')).toBeInTheDocument(); });

      const editButtons = screen.getAllByText('✏️');
      expect(editButtons.length).toBeGreaterThan(0);

      await act(async () => { fireEvent.click(editButtons[0]); });

      await waitFor(() => {
        expect(screen.getByTestId('CupEditModal')).toBeInTheDocument();
      });
    });
  });

  describe('Delete Flow', () => {
    it('opens delete modal on delete button click (canDelete: true)', async () => {
      await act(async () => { render(<Cups />); });
      await waitFor(() => { expect(screen.getByText('DFB-Pokal')).toBeInTheDocument(); });

      const deleteButtons = screen.getAllByText('🗑️');
      expect(deleteButtons.length).toBeGreaterThan(0);

      await act(async () => { fireEvent.click(deleteButtons[0]); });

      await waitFor(() => {
        expect(screen.getByTestId('CupDeleteModal')).toBeInTheDocument();
      });
    });

    it('calls DELETE endpoint and removes cup from list on confirm', async () => {
      mockApiJson
        .mockResolvedValueOnce(mockCupsResponse)  // initial load
        .mockResolvedValueOnce({});                // DELETE

      await act(async () => { render(<Cups />); });
      await waitFor(() => { expect(screen.getByText('DFB-Pokal')).toBeInTheDocument(); });

      const deleteButtons = screen.getAllByText('🗑️');
      await act(async () => { fireEvent.click(deleteButtons[0]); });
      await waitFor(() => { expect(screen.getByTestId('CupDeleteModal')).toBeInTheDocument(); });

      await act(async () => { fireEvent.click(screen.getByTestId('confirm-delete')); });

      await waitFor(() => {
        expect(mockApiJson).toHaveBeenCalledWith('/api/cups/1', { method: 'DELETE' });
      });
    });

    it('shows success snackbar after deletion', async () => {
      mockApiJson
        .mockResolvedValueOnce(mockCupsResponse)
        .mockResolvedValueOnce({});

      await act(async () => { render(<Cups />); });
      await waitFor(() => { expect(screen.getByText('DFB-Pokal')).toBeInTheDocument(); });

      const deleteButtons = screen.getAllByText('🗑️');
      await act(async () => { fireEvent.click(deleteButtons[0]); });
      await act(async () => { fireEvent.click(screen.getByTestId('confirm-delete')); });

      await waitFor(() => {
        expect(screen.getByText('Pokal gelöscht')).toBeInTheDocument();
      });
    });

    it('shows error snackbar when deletion fails', async () => {
      mockApiJson
        .mockResolvedValueOnce(mockCupsResponse)
        .mockRejectedValueOnce(new Error('Delete failed'));

      await act(async () => { render(<Cups />); });
      await waitFor(() => { expect(screen.getByText('DFB-Pokal')).toBeInTheDocument(); });

      const deleteButtons = screen.getAllByText('🗑️');
      await act(async () => { fireEvent.click(deleteButtons[0]); });
      await act(async () => { fireEvent.click(screen.getByTestId('confirm-delete')); });

      await waitFor(() => {
        expect(screen.getByText('Fehler beim Löschen des Pokals.')).toBeInTheDocument();
      });
    });
  });

  describe('Permissions', () => {
    it('does not show edit button for cups without canEdit permission', async () => {
      mockApiJson.mockResolvedValue({
        cups: [
          { id: 1, name: 'DFB-Pokal', permissions: { canView: true, canEdit: false, canCreate: true, canDelete: false } },
        ],
      });

      await act(async () => { render(<Cups />); });
      await waitFor(() => { expect(screen.getByText('DFB-Pokal')).toBeInTheDocument(); });

      expect(screen.queryByText('✏️')).not.toBeInTheDocument();
    });

    it('does not show delete button for cups without canDelete permission', async () => {
      mockApiJson.mockResolvedValue({
        cups: [
          { id: 1, name: 'DFB-Pokal', permissions: { canView: true, canEdit: false, canCreate: true, canDelete: false } },
        ],
      });

      await act(async () => { render(<Cups />); });
      await waitFor(() => { expect(screen.getByText('DFB-Pokal')).toBeInTheDocument(); });

      expect(screen.queryByText('🗑️')).not.toBeInTheDocument();
    });
  });
});
