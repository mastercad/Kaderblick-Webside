/**
 * Tests for the PresetPicker popover component.
 *
 * NOTE on setup: `anchorEl` is only valid after beforeEach runs, so every test
 * calls `props()` to get a fresh prop object that captures the current element.
 */
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import type { TacticPreset } from '../types';

// ---------------------------------------------------------------------------
// Mock usePresets
// ---------------------------------------------------------------------------

const mockSavePreset   = jest.fn();
const mockDeletePreset = jest.fn();
const mockRefresh      = jest.fn();

const defaultPresets: TacticPreset[] = [
  {
    id: 'builtin-1',
    title: 'Gegenpressing (4-3-3)',
    category: 'Pressing',
    description: 'Pressing-Beschreibung',
    isSystem: true,
    canDelete: false,
    data: { name: 'Gegenpressing (4-3-3)', elements: [], opponents: [] },
  },
  {
    id: 42,
    title: 'Eigene Vorlage',
    category: 'Angriff',
    description: 'Meine eigene Vorlage',
    isSystem: false,
    canDelete: true,
    createdBy: 'Max Mustermann',
    data: { name: 'Eigene Vorlage', elements: [], opponents: [] },
  },
];

jest.mock('../usePresets', () => ({
  usePresets: jest.fn(),
}));

import { usePresets } from '../usePresets';
import { PresetPicker } from '../PresetPicker';

const mockUsePresets = usePresets as jest.MockedFunction<typeof usePresets>;

function setupMockPresets(overrides: Partial<ReturnType<typeof usePresets>> = {}) {
  mockUsePresets.mockReturnValue({
    byCategory: {
      Pressing: [defaultPresets[0]],
      Angriff:  [defaultPresets[1]],
    },
    presets: defaultPresets,
    loading: false,
    error:   null,
    savePreset:   mockSavePreset,
    deletePreset: mockDeletePreset,
    refresh:      mockRefresh,
    ...overrides,
  });
}

// anchorEl is created fresh in beforeEach – props() reads the current value
let anchorEl: HTMLDivElement;

/** Returns a fresh props object that reads the current anchorEl. */
const props = (overrides: Record<string, unknown> = {}) => ({
  anchorEl,
  onClose:      jest.fn(),
  onLoadPreset: jest.fn(),
  ...overrides,
});

beforeEach(() => {
  jest.clearAllMocks();
  setupMockPresets();
  anchorEl = document.createElement('div');
  document.body.appendChild(anchorEl);
});

afterEach(() => {
  document.body.removeChild(anchorEl);
});

// ---------------------------------------------------------------------------
// Rendering
// ---------------------------------------------------------------------------

describe('PresetPicker – rendering', () => {
  it('shows the "Taktik-Vorlagen" header when open', () => {
    render(<PresetPicker {...props()} />);
    expect(screen.getByText('Taktik-Vorlagen')).toBeInTheDocument();
  });

  it('renders an "Alle" category chip', () => {
    render(<PresetPicker {...props()} />);
    expect(screen.getByText('Alle')).toBeInTheDocument();
  });

  it('renders a chip for each category that has presets', () => {
    render(<PresetPicker {...props()} />);
    expect(screen.getByText('Pressing')).toBeInTheDocument();
    expect(screen.getByText('Angriff')).toBeInTheDocument();
  });

  it('renders all preset titles', () => {
    render(<PresetPicker {...props()} />);
    expect(screen.getByText('Gegenpressing (4-3-3)')).toBeInTheDocument();
    expect(screen.getByText('Eigene Vorlage')).toBeInTheDocument();
  });

  it('does NOT render when anchorEl is null', () => {
    render(<PresetPicker {...props({ anchorEl: null })} />);
    expect(screen.queryByText('Taktik-Vorlagen')).not.toBeInTheDocument();
  });
});

// ---------------------------------------------------------------------------
// Loading / Error states
// ---------------------------------------------------------------------------

describe('PresetPicker – loading & error', () => {
  it('shows a loading spinner while loading=true', () => {
    setupMockPresets({ loading: true, presets: [], byCategory: {} });
    render(<PresetPicker {...props()} />);
    expect(document.querySelector('[role="progressbar"]')).toBeInTheDocument();
  });

  it('shows the error message when error is set', () => {
    setupMockPresets({ error: 'Netzwerkfehler', loading: false });
    render(<PresetPicker {...props()} />);
    expect(screen.getByText('Netzwerkfehler')).toBeInTheDocument();
  });

  it('shows "Keine Vorlagen" message when the list is empty and not loading', () => {
    setupMockPresets({ presets: [], byCategory: {}, loading: false });
    render(<PresetPicker {...props()} />);
    expect(screen.getByText(/Keine Vorlagen/)).toBeInTheDocument();
  });
});

// ---------------------------------------------------------------------------
// Load action
// ---------------------------------------------------------------------------

describe('PresetPicker – loading a preset', () => {
  it('calls onLoadPreset when "Laden" is clicked', () => {
    const onLoadPreset = jest.fn();
    render(<PresetPicker {...props({ onLoadPreset })} />);

    const ladenButtons = screen.getAllByText('Laden');
    fireEvent.click(ladenButtons[0]);

    expect(onLoadPreset).toHaveBeenCalledTimes(1);
    expect(onLoadPreset).toHaveBeenCalledWith(defaultPresets[0]);
  });

  it('calls onLoadPreset with the second preset when second "Laden" is clicked', () => {
    const onLoadPreset = jest.fn();
    render(<PresetPicker {...props({ onLoadPreset })} />);

    const ladenButtons = screen.getAllByText('Laden');
    fireEvent.click(ladenButtons[1]);

    expect(onLoadPreset).toHaveBeenCalledWith(defaultPresets[1]);
  });
});

// ---------------------------------------------------------------------------
// Category filter
// ---------------------------------------------------------------------------

describe('PresetPicker – category filtering', () => {
  it('clicking a Pressing chip filters the list to Pressing presets only', () => {
    render(<PresetPicker {...props()} />);

    // "Pressing" appears both in the chip row and in the preset row.
    // Click the first occurrence (the chip).
    const pressingElements = screen.getAllByText('Pressing');
    fireEvent.click(pressingElements[0]);

    expect(screen.queryByText('Eigene Vorlage')).not.toBeInTheDocument();
    expect(screen.getByText('Gegenpressing (4-3-3)')).toBeInTheDocument();
  });

  it('"Alle" chip restores the full list after filtering', () => {
    render(<PresetPicker {...props()} />);

    const pressingElements = screen.getAllByText('Pressing');
    fireEvent.click(pressingElements[0]);
    fireEvent.click(screen.getByText('Alle'));

    expect(screen.getByText('Eigene Vorlage')).toBeInTheDocument();
    expect(screen.getByText('Gegenpressing (4-3-3)')).toBeInTheDocument();
  });
});

// ---------------------------------------------------------------------------
// Delete action
// ---------------------------------------------------------------------------

describe('PresetPicker – deleting a preset', () => {
  it('renders a delete icon button for the preset with canDelete=true', () => {
    render(<PresetPicker {...props()} />);
    expect(document.querySelector('[data-testid="DeleteOutlinedIcon"]')).not.toBeNull();
  });

  it('does not render a delete icon for system presets (canDelete=false)', () => {
    setupMockPresets({
      presets: [defaultPresets[0]],
      byCategory: { Pressing: [defaultPresets[0]] },
    });
    render(<PresetPicker {...props()} />);
    expect(document.querySelector('[data-testid="DeleteOutlinedIcon"]')).toBeNull();
  });

  it('calls deletePreset with the correct id when delete button is clicked', async () => {
    mockDeletePreset.mockResolvedValue(undefined);
    render(<PresetPicker {...props()} />);

    const deleteIcon = document.querySelector('[data-testid="DeleteOutlinedIcon"]') as HTMLElement;
    const deleteBtn  = deleteIcon.closest('button') as HTMLButtonElement;
    fireEvent.click(deleteBtn);

    await waitFor(() => expect(mockDeletePreset).toHaveBeenCalledWith(42));
  });

  it('shows an error alert when deletePreset rejects', async () => {
    mockDeletePreset.mockRejectedValue(new Error('Server error'));
    render(<PresetPicker {...props()} />);

    const deleteIcon = document.querySelector('[data-testid="DeleteOutlinedIcon"]') as HTMLElement;
    const deleteBtn  = deleteIcon.closest('button') as HTMLButtonElement;
    fireEvent.click(deleteBtn);

    await waitFor(() =>
      expect(screen.getByText('Löschen fehlgeschlagen.')).toBeInTheDocument()
    );
  });
});

// ---------------------------------------------------------------------------
// Save form
// ---------------------------------------------------------------------------

describe('PresetPicker – save form', () => {
  const tacticData = { name: 'Aktuell', elements: [], opponents: [] };

  it('shows the save button when currentTacticData is provided', () => {
    render(<PresetPicker {...props({ currentTacticData: tacticData })} />);
    expect(screen.getByText(/Aktuelle Taktik als Vorlage speichern/)).toBeInTheDocument();
  });

  it('does NOT show the save button when currentTacticData is undefined', () => {
    render(<PresetPicker {...props()} currentTacticData={undefined} />);
    expect(screen.queryByText(/Vorlage speichern/)).not.toBeInTheDocument();
  });

  it('opens the save form when the save button is clicked', () => {
    render(<PresetPicker {...props({ currentTacticData: tacticData })} />);
    fireEvent.click(screen.getByText(/Aktuelle Taktik als Vorlage speichern/));
    expect(screen.getByLabelText(/Name der Vorlage/i)).toBeInTheDocument();
  });

  it('closes the save form when "Abbrechen" is clicked', () => {
    render(<PresetPicker {...props({ currentTacticData: tacticData })} />);
    fireEvent.click(screen.getByText(/Aktuelle Taktik als Vorlage speichern/));
    fireEvent.click(screen.getByText('Abbrechen'));
    expect(screen.queryByLabelText(/Name der Vorlage/i)).not.toBeInTheDocument();
  });
});

// ---------------------------------------------------------------------------
// Close button
// ---------------------------------------------------------------------------

describe('PresetPicker – close', () => {
  it('calls onClose when the × icon button is clicked', () => {
    const onClose = jest.fn();
    render(<PresetPicker {...props({ onClose })} />);

    const closeIcon = document.querySelector('[data-testid="CloseIcon"]') as HTMLElement;
    expect(closeIcon).not.toBeNull();

    const closeBtn = closeIcon.closest('button') as HTMLButtonElement;
    fireEvent.click(closeBtn);

    expect(onClose).toHaveBeenCalled();
  });
});
