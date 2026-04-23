import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import TacticsBoardModal from '../TacticsBoardModal';

// ── Mock FabStackProvider ──────────────────────────────────────────────────────
const mockHideForModal  = jest.fn();
const mockShowAfterModal = jest.fn();

jest.mock('../../components/FabStackProvider', () => ({
  useFabStack: () => ({
    hideForModal:  mockHideForModal,
    showAfterModal: mockShowAfterModal,
    hidden: false,
    fabs: [],
    addFab: jest.fn(),
    removeFab: jest.fn(),
  }),
}));

// ── Mock child components ──────────────────────────────────────────────────────
// TacticsToolbar is always rendered with isLandscapeMobile=true by the modal.
// In landscape-mobile mode the presentation button is ALWAYS visible (no isBrowserFS gate).
jest.mock('../tacticsBoard/TacticsToolbar', () => ({
  TacticsToolbar: (props: any) => (
    <div>
      <div>Tactics Toolbar</div>
      <button type="button" onClick={props.onTogglePresentationMode}>Präsent.</button>
    </div>
  ),
}));
jest.mock('../tacticsBoard/TacticsBar',  () => ({ TacticsBar:  () => <div>Tactics Bar</div> }));
jest.mock('../tacticsBoard/PitchCanvas', () => ({ PitchCanvas: () => null }));
jest.mock('../tacticsBoard/StatusBar',   () => ({ StatusBar:   () => <div>Status Bar</div> }));

// ── Mock useTacticsBoard ───────────────────────────────────────────────────────
const mockHandleSave = jest.fn();

const makeBoardState = (overrides: Record<string, unknown> = {}) => ({
  isDirty: false,
  handleSave: mockHandleSave,
  containerRef: { current: null },
  svgRef: { current: null },
  pitchRef: { current: null },
  formationName: '', formationCode: undefined, notes: undefined,
  tool: 'arrow', setTool: jest.fn(),
  color: '#fff', setColor: jest.fn(),
  fullPitch: true, setFullPitch: jest.fn(),
  elements: [], opponents: [],
  saving: false, saveMsg: null, isBrowserFS: false,
  showNotes: false, setShowNotes: jest.fn(),
  tactics: [{ id: 't1', name: 'Standard', elements: [], opponents: [] }],
  activeTacticId: 't1', setActiveTacticId: jest.fn(),
  renamingId: null, setRenamingId: jest.fn(),
  renameValue: '', setRenameValue: jest.fn(),
  preview: null, drawing: false, elDrag: null, oppDrag: null,
  pitchAX: 1, pitchAspect: '1920 / 1357', svgCursor: 'crosshair',
  ownPlayers: [], markerId: jest.fn(() => 'id'),
  activeTactic: undefined,
  selectedId: null, setSelectedId: jest.fn(),
  handleAddOpponent: jest.fn(), handleUndo: jest.fn(), handleClear: jest.fn(),
  handleResetPlayerPositions: jest.fn(),
  handleSvgDown: jest.fn(), handleSvgMove: jest.fn(), handleSvgUp: jest.fn(), handleSvgLeave: jest.fn(),
  handleElDown: jest.fn(), handleOppDown: jest.fn(), handleOwnPlayerDown: jest.fn(),
  handleNewTactic: jest.fn(), handleDeleteTactic: jest.fn(),
  handleLoadPreset: jest.fn(), confirmRename: jest.fn(),
  handleDeleteSelected: jest.fn(), handleRedo: jest.fn(),
  toggleFullscreen: jest.fn(),
  canUndo: false, canRedo: false,
  setTactics: jest.fn(),
  ...overrides,
});

jest.mock('../tacticsBoard/useTacticsBoard', () => ({
  useTacticsBoard: jest.fn(),
}));

const { useTacticsBoard } = jest.requireMock('../tacticsBoard/useTacticsBoard');
const mockBoardClean = () => useTacticsBoard.mockReturnValue(makeBoardState({ isDirty: false }));
const mockBoardDirty = () => useTacticsBoard.mockReturnValue(makeBoardState({ isDirty: true }));

const defaultProps = { open: true, onClose: jest.fn(), formation: null };

beforeEach(() => {
  jest.clearAllMocks();
  mockHandleSave.mockResolvedValue(undefined);
  mockBoardClean();
});

// ── Helpers ────────────────────────────────────────────────────────────────────
function clickClose() {
  fireEvent.click(screen.getByLabelText('Board schließen'));
}

function enterPresentationMode() {
  fireEvent.click(screen.getByText('Präsent.'));
}


// ─────────────────────────────────────────────────────────────────────────────
// Default sidebar state
// ─────────────────────────────────────────────────────────────────────────────
describe('TacticsBoardModal – default sidebar state', () => {
  it('left sidebar (TacticsToolbar) is visible by default', () => {
    render(<TacticsBoardModal {...defaultProps} />);
    expect(screen.getByText('Tactics Toolbar')).toBeInTheDocument();
  });

  it('right sidebar (TacticsBar) is hidden by default', () => {
    render(<TacticsBoardModal {...defaultProps} />);
    expect(screen.queryByText('Tactics Bar')).not.toBeInTheDocument();
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Sidebar toggle strips
// ─────────────────────────────────────────────────────────────────────────────
describe('TacticsBoardModal – sidebar toggle strips', () => {
  it('clicking the left toggle hides the left sidebar', () => {
    render(<TacticsBoardModal {...defaultProps} />);
    expect(screen.getByText('Tactics Toolbar')).toBeInTheDocument();
    fireEvent.click(screen.getByLabelText('Linke Werkzeugleiste schließen'));
    expect(screen.queryByText('Tactics Toolbar')).not.toBeInTheDocument();
  });

  it('clicking the left toggle again restores the left sidebar', () => {
    render(<TacticsBoardModal {...defaultProps} />);
    fireEvent.click(screen.getByLabelText('Linke Werkzeugleiste schließen'));
    fireEvent.click(screen.getByLabelText('Linke Werkzeugleiste öffnen'));
    expect(screen.getByText('Tactics Toolbar')).toBeInTheDocument();
  });

  it('clicking the right toggle shows the right sidebar', () => {
    render(<TacticsBoardModal {...defaultProps} />);
    expect(screen.queryByText('Tactics Bar')).not.toBeInTheDocument();
    fireEvent.click(screen.getByLabelText('Rechte Taktikleiste öffnen'));
    expect(screen.getByText('Tactics Bar')).toBeInTheDocument();
  });

  it('clicking the right toggle again hides the right sidebar', () => {
    render(<TacticsBoardModal {...defaultProps} />);
    fireEvent.click(screen.getByLabelText('Rechte Taktikleiste öffnen'));
    fireEvent.click(screen.getByLabelText('Rechte Taktikleiste schließen'));
    expect(screen.queryByText('Tactics Bar')).not.toBeInTheDocument();
  });

  it('toggle strips are not rendered in presentation mode', () => {
    render(<TacticsBoardModal {...defaultProps} />);
    enterPresentationMode();
    expect(screen.queryByLabelText('Linke Werkzeugleiste schließen')).not.toBeInTheDocument();
    expect(screen.queryByLabelText('Linke Werkzeugleiste öffnen')).not.toBeInTheDocument();
    expect(screen.queryByLabelText('Rechte Taktikleiste öffnen')).not.toBeInTheDocument();
    expect(screen.queryByLabelText('Rechte Taktikleiste schließen')).not.toBeInTheDocument();
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Top action buttons drawer
// ─────────────────────────────────────────────────────────────────────────────
describe('TacticsBoardModal – top action buttons drawer', () => {
  it('save and close buttons are present by default', () => {
    render(<TacticsBoardModal {...defaultProps} />);
    expect(screen.getByLabelText('Board schließen')).toBeInTheDocument();
  });

  it('drawer tab starts in the "visible" state', () => {
    render(<TacticsBoardModal {...defaultProps} />);
    expect(screen.getByLabelText('Aktionsleiste ausblenden')).toBeInTheDocument();
  });

  it('clicking the drawer tab switches label to "einblenden"', () => {
    render(<TacticsBoardModal {...defaultProps} />);
    fireEvent.click(screen.getByLabelText('Aktionsleiste ausblenden'));
    expect(screen.getByLabelText('Aktionsleiste einblenden')).toBeInTheDocument();
  });

  it('clicking the drawer tab twice returns to "ausblenden" state', () => {
    render(<TacticsBoardModal {...defaultProps} />);
    fireEvent.click(screen.getByLabelText('Aktionsleiste ausblenden'));
    fireEvent.click(screen.getByLabelText('Aktionsleiste einblenden'));
    expect(screen.getByLabelText('Aktionsleiste ausblenden')).toBeInTheDocument();
  });

  it('action buttons container is still in DOM when hidden (CSS transform, not unmounted)', () => {
    render(<TacticsBoardModal {...defaultProps} />);
    fireEvent.click(screen.getByLabelText('Aktionsleiste ausblenden'));
    // The close button is still in the DOM (translate-hidden, not removed)
    expect(screen.getByLabelText('Board schließen')).toBeInTheDocument();
  });

  it('drawer tab is not rendered in presentation mode', () => {
    render(<TacticsBoardModal {...defaultProps} />);
    enterPresentationMode();
    expect(screen.queryByLabelText('Aktionsleiste ausblenden')).not.toBeInTheDocument();
    expect(screen.queryByLabelText('Aktionsleiste einblenden')).not.toBeInTheDocument();
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Presentation mode
// ─────────────────────────────────────────────────────────────────────────────
describe('TacticsBoardModal – presentation mode', () => {
  it('enters presentation mode without isBrowserFS being true', () => {
    useTacticsBoard.mockReturnValue(makeBoardState({ isBrowserFS: false }));
    render(<TacticsBoardModal {...defaultProps} />);
    enterPresentationMode();
    expect(screen.getByText('Präsentation beenden')).toBeInTheDocument();
  });

  it('hides TacticsToolbar in presentation mode', () => {
    render(<TacticsBoardModal {...defaultProps} />);
    enterPresentationMode();
    expect(screen.queryByText('Tactics Toolbar')).not.toBeInTheDocument();
  });

  it('hides TacticsBar in presentation mode', () => {
    render(<TacticsBoardModal {...defaultProps} />);
    // open right sidebar first
    fireEvent.click(screen.getByLabelText('Rechte Taktikleiste öffnen'));
    enterPresentationMode();
    expect(screen.queryByText('Tactics Bar')).not.toBeInTheDocument();
  });

  it('shows exactly one "Präsentation beenden" pill in presentation mode', () => {
    render(<TacticsBoardModal {...defaultProps} />);
    enterPresentationMode();
    expect(screen.getAllByText('Präsentation beenden')).toHaveLength(1);
  });

  it('does NOT show a separate close button in presentation mode', () => {
    render(<TacticsBoardModal {...defaultProps} />);
    enterPresentationMode();
    expect(screen.queryByLabelText('Board schließen')).not.toBeInTheDocument();
  });

  it('clicking "Präsentation beenden" exits presentation mode', () => {
    render(<TacticsBoardModal {...defaultProps} />);
    enterPresentationMode();
    fireEvent.click(screen.getByText('Präsentation beenden'));
    expect(screen.queryByText('Präsentation beenden')).not.toBeInTheDocument();
  });

  it('restores TacticsToolbar after exiting presentation mode', () => {
    render(<TacticsBoardModal {...defaultProps} />);
    enterPresentationMode();
    fireEvent.click(screen.getByText('Präsentation beenden'));
    expect(screen.getByText('Tactics Toolbar')).toBeInTheDocument();
  });

  it('restores close button after exiting presentation mode', () => {
    render(<TacticsBoardModal {...defaultProps} />);
    enterPresentationMode();
    fireEvent.click(screen.getByText('Präsentation beenden'));
    expect(screen.getByLabelText('Board schließen')).toBeInTheDocument();
  });

  it('can enter and exit presentation mode multiple times', () => {
    render(<TacticsBoardModal {...defaultProps} />);
    for (let i = 0; i < 3; i++) {
      enterPresentationMode();
      expect(screen.getByText('Präsentation beenden')).toBeInTheDocument();
      fireEvent.click(screen.getByText('Präsentation beenden'));
      expect(screen.queryByText('Präsentation beenden')).not.toBeInTheDocument();
    }
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// FabStack integration (feedback button visibility)
// ─────────────────────────────────────────────────────────────────────────────
describe('TacticsBoardModal – FabStack integration', () => {
  it('calls hideForModal when the board is open', () => {
    render(<TacticsBoardModal {...defaultProps} open={true} />);
    expect(mockHideForModal).toHaveBeenCalledTimes(1);
  });

  it('does not call hideForModal when board starts closed', () => {
    render(<TacticsBoardModal {...defaultProps} open={false} />);
    expect(mockHideForModal).not.toHaveBeenCalled();
  });

  it('calls showAfterModal when board transitions from open to closed', () => {
    const { rerender } = render(<TacticsBoardModal {...defaultProps} open={true} />);
    expect(mockShowAfterModal).not.toHaveBeenCalled();
    rerender(<TacticsBoardModal {...defaultProps} open={false} />);
    expect(mockShowAfterModal).toHaveBeenCalledTimes(1);
  });

  it('hideForModal is called exactly once per open', () => {
    render(<TacticsBoardModal {...defaultProps} open={true} />);
    expect(mockHideForModal).toHaveBeenCalledTimes(1);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Close when isDirty=false
// ─────────────────────────────────────────────────────────────────────────────
describe('TacticsBoardModal – close when isDirty=false', () => {
  it('calls onClose immediately without showing a dialog', () => {
    const onClose = jest.fn();
    render(<TacticsBoardModal {...defaultProps} onClose={onClose} />);
    clickClose();
    expect(onClose).toHaveBeenCalledTimes(1);
    expect(screen.queryByText('Ungespeicherte Änderungen')).not.toBeInTheDocument();
  });

  it('does not call handleSave when closing cleanly', () => {
    render(<TacticsBoardModal {...defaultProps} />);
    clickClose();
    expect(mockHandleSave).not.toHaveBeenCalled();
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Close warning dialog (isDirty=true)
// ─────────────────────────────────────────────────────────────────────────────
describe('TacticsBoardModal – close warning dialog (isDirty=true)', () => {
  beforeEach(() => mockBoardDirty());

  it('shows the warning dialog instead of calling onClose', () => {
    const onClose = jest.fn();
    render(<TacticsBoardModal {...defaultProps} onClose={onClose} />);
    clickClose();
    expect(onClose).not.toHaveBeenCalled();
    expect(screen.getByText('Ungespeicherte Änderungen')).toBeInTheDocument();
  });

  it('shows the warning message text', () => {
    render(<TacticsBoardModal {...defaultProps} />);
    clickClose();
    expect(
      screen.getByText(/nicht auf dem Server gespeichert.*lokaler Entwurf.*automatisch wiederhergestellt/i),
    ).toBeInTheDocument();
  });

  it('renders all three action buttons', () => {
    render(<TacticsBoardModal {...defaultProps} />);
    clickClose();
    expect(screen.getByText('Weiter bearbeiten')).toBeInTheDocument();
    expect(screen.getByText('Lokal schließen')).toBeInTheDocument();
    expect(screen.getByText('Speichern & Schließen')).toBeInTheDocument();
  });

  it('"Weiter bearbeiten" dismisses the dialog without calling onClose', async () => {
    const onClose = jest.fn();
    render(<TacticsBoardModal {...defaultProps} onClose={onClose} />);
    clickClose();
    fireEvent.click(screen.getByText('Weiter bearbeiten'));
    expect(onClose).not.toHaveBeenCalled();
    await waitFor(() =>
      expect(screen.queryByText('Ungespeicherte Änderungen')).not.toBeInTheDocument(),
    );
  });

  it('"Weiter bearbeiten" does not call handleSave', () => {
    render(<TacticsBoardModal {...defaultProps} />);
    clickClose();
    fireEvent.click(screen.getByText('Weiter bearbeiten'));
    expect(mockHandleSave).not.toHaveBeenCalled();
  });

  it('"Lokal schließen" calls onClose without saving', () => {
    const onClose = jest.fn();
    render(<TacticsBoardModal {...defaultProps} onClose={onClose} />);
    clickClose();
    fireEvent.click(screen.getByText('Lokal schließen'));
    expect(mockHandleSave).not.toHaveBeenCalled();
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('"Lokal schließen" dismisses the dialog', async () => {
    render(<TacticsBoardModal {...defaultProps} />);
    clickClose();
    fireEvent.click(screen.getByText('Lokal schließen'));
    await waitFor(() =>
      expect(screen.queryByText('Ungespeicherte Änderungen')).not.toBeInTheDocument(),
    );
  });

  it('"Speichern & Schließen" calls handleSave then onClose', async () => {
    const onClose = jest.fn();
    render(<TacticsBoardModal {...defaultProps} onClose={onClose} />);
    clickClose();
    fireEvent.click(screen.getByText('Speichern & Schließen'));
    await waitFor(() => expect(onClose).toHaveBeenCalledTimes(1));
    expect(mockHandleSave).toHaveBeenCalledTimes(1);
    const saveOrder  = mockHandleSave.mock.invocationCallOrder[0];
    const closeOrder = onClose.mock.invocationCallOrder[0];
    expect(saveOrder).toBeLessThan(closeOrder);
  });

  it('"Speichern & Schließen" dismisses the warning dialog', async () => {
    render(<TacticsBoardModal {...defaultProps} />);
    clickClose();
    fireEvent.click(screen.getByText('Speichern & Schließen'));
    await waitFor(() =>
      expect(screen.queryByText('Ungespeicherte Änderungen')).not.toBeInTheDocument(),
    );
  });

  it('can be dismissed and re-triggered on a subsequent close attempt', async () => {
    const onClose = jest.fn();
    render(<TacticsBoardModal {...defaultProps} onClose={onClose} />);

    clickClose();
    fireEvent.click(screen.getByText('Weiter bearbeiten'));
    await waitFor(() =>
      expect(screen.queryByText('Ungespeicherte Änderungen')).not.toBeInTheDocument(),
    );

    clickClose();
    expect(screen.getByText('Ungespeicherte Änderungen')).toBeInTheDocument();
    expect(onClose).not.toHaveBeenCalled();
  });
});
