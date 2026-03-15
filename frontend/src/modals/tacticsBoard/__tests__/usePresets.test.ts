/**
 * Tests for usePresets hook.
 */
import { renderHook, act, waitFor } from '@testing-library/react';
import { usePresets } from '../usePresets';
import { BUILTIN_PRESETS } from '../presetData';
import { apiJson } from '../../../utils/api';
import type { TacticPreset } from '../types';

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------

jest.mock('../../../utils/api', () => ({
  apiJson: jest.fn(),
}));

const mockApiJson = apiJson as jest.MockedFunction<typeof apiJson>;

// Minimal DB preset (returned by the API)
const makeDbPreset = (overrides: Partial<TacticPreset> = {}): TacticPreset => ({
  id: 99,
  title: 'DB Vorlage',
  category: 'Angriff',
  description: 'Test-Vorlage aus der DB',
  isSystem: false,
  canDelete: true,
  createdBy: 'Max Mustermann',
  data: {
    name: 'DB Vorlage',
    elements: [],
    opponents: [],
  },
  ...overrides,
});

beforeEach(() => {
  jest.clearAllMocks();
  // Default: API returns an empty array
  mockApiJson.mockResolvedValue([]);
});

// ---------------------------------------------------------------------------
// Initial state
// ---------------------------------------------------------------------------

describe('usePresets – initial state (open=false)', () => {
  it('does not call the API when open is false', () => {
    renderHook(() => usePresets(false));
    expect(mockApiJson).not.toHaveBeenCalled();
  });

  it('returns loading=false and no error before the modal opens', () => {
    const { result } = renderHook(() => usePresets(false));
    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBeNull();
  });
});

// ---------------------------------------------------------------------------
// Fetch on open
// ---------------------------------------------------------------------------

describe('usePresets – fetching', () => {
  it('calls GET /api/tactic-presets when open becomes true', async () => {
    renderHook(() => usePresets(true));

    await waitFor(() => expect(mockApiJson).toHaveBeenCalledTimes(1));
    expect(mockApiJson).toHaveBeenCalledWith('/api/tactic-presets');
  });

  it('sets loading=true while the request is in flight', async () => {
    let resolvePromise!: (v: TacticPreset[]) => void;
    mockApiJson.mockReturnValue(
      new Promise<TacticPreset[]>(resolve => { resolvePromise = resolve; })
    );

    const { result } = renderHook(() => usePresets(true));

    // The effect runs asynchronously; after the first tick loading should be true
    await waitFor(() => expect(result.current.loading).toBe(true));

    act(() => resolvePromise([]));
    await waitFor(() => expect(result.current.loading).toBe(false));
  });

  it('returns built-in presets when the API returns an empty array', async () => {
    mockApiJson.mockResolvedValue([]);

    const { result } = renderHook(() => usePresets(true));
    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.presets.length).toBe(BUILTIN_PRESETS.length);
  });

  it('sets error when the API rejects, but still returns built-ins', async () => {
    mockApiJson.mockRejectedValue(new Error('Network error'));

    const { result } = renderHook(() => usePresets(true));
    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.error).not.toBeNull();
    // Built-in presets are still available
    expect(result.current.presets.length).toBeGreaterThan(0);
  });

  it('re-fetches when refresh() is called', async () => {
    mockApiJson.mockResolvedValue([]);

    const { result } = renderHook(() => usePresets(true));
    await waitFor(() => expect(result.current.loading).toBe(false));

    act(() => result.current.refresh());
    await waitFor(() => expect(mockApiJson).toHaveBeenCalledTimes(2));
  });
});

// ---------------------------------------------------------------------------
// Merging logic
// ---------------------------------------------------------------------------

describe('usePresets – merging DB and built-in presets', () => {
  it('adds DB presets that do not overlap with built-ins', async () => {
    const dbPreset = makeDbPreset({ title: 'Einzigartiger DB Titel' });
    mockApiJson.mockResolvedValue([dbPreset]);

    const { result } = renderHook(() => usePresets(true));
    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.presets).toContainEqual(dbPreset);
    expect(result.current.presets.length).toBe(BUILTIN_PRESETS.length + 1);
  });

  it('DB preset overrides built-in with the same title', async () => {
    const builtinTitle = BUILTIN_PRESETS[0].title;
    const dbPreset = makeDbPreset({ title: builtinTitle, description: 'Neue Beschreibung' });
    mockApiJson.mockResolvedValue([dbPreset]);

    const { result } = renderHook(() => usePresets(true));
    await waitFor(() => expect(result.current.loading).toBe(false));

    // Total count unchanged (replacement, not addition)
    expect(result.current.presets.length).toBe(BUILTIN_PRESETS.length);

    const overridden = result.current.presets.find(p => p.title === builtinTitle);
    expect(overridden?.description).toBe('Neue Beschreibung');
  });
});

// ---------------------------------------------------------------------------
// Grouping
// ---------------------------------------------------------------------------

describe('usePresets – byCategory', () => {
  it('groups presets correctly by category', async () => {
    mockApiJson.mockResolvedValue([]);

    const { result } = renderHook(() => usePresets(true));
    await waitFor(() => expect(result.current.loading).toBe(false));

    const { byCategory } = result.current;
    // Every preset should appear in exactly one category bucket
    const total = Object.values(byCategory).reduce((n, arr) => n + arr.length, 0);
    expect(total).toBe(result.current.presets.length);

    // Check that each key matches a known category
    Object.keys(byCategory).forEach(cat => {
      byCategory[cat].forEach(p => expect(p.category).toBe(cat));
    });
  });
});

// ---------------------------------------------------------------------------
// savePreset
// ---------------------------------------------------------------------------

describe('usePresets – savePreset', () => {
  it('calls POST /api/tactic-presets with the correct body', async () => {
    const saved = makeDbPreset();
    mockApiJson
      .mockResolvedValueOnce([])  // initial fetch
      .mockResolvedValueOnce(saved);  // save call

    const { result } = renderHook(() => usePresets(true));
    await waitFor(() => expect(result.current.loading).toBe(false));

    const args = {
      title: 'Neue Vorlage',
      category: 'Defensive' as const,
      description: 'Beschreibung',
      shareWithClub: false,
      data: { name: 'Neue Vorlage', elements: [], opponents: [] },
    };

    let returnedPreset!: TacticPreset;
    await act(async () => {
      returnedPreset = await result.current.savePreset(args);
    });

    expect(mockApiJson).toHaveBeenCalledWith('/api/tactic-presets', {
      method: 'POST',
      body: args,
    });
    expect(returnedPreset).toEqual(saved);
  });

  it('optimistically adds the new preset to the list', async () => {
    const saved = makeDbPreset({ title: 'Gespeicherte Vorlage' });
    mockApiJson
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce(saved);

    const { result } = renderHook(() => usePresets(true));
    await waitFor(() => expect(result.current.loading).toBe(false));

    const prevCount = result.current.presets.length;

    await act(async () => {
      await result.current.savePreset({
        title: 'Gespeicherte Vorlage',
        category: 'Angriff',
        description: '',
        shareWithClub: false,
        data: { name: 'Gespeicherte Vorlage', elements: [], opponents: [] },
      });
    });

    expect(result.current.presets.length).toBe(prevCount + 1);
    expect(result.current.presets.find(p => p.id === saved.id)).toBeDefined();
  });
});

// ---------------------------------------------------------------------------
// deletePreset
// ---------------------------------------------------------------------------

describe('usePresets – deletePreset', () => {
  it('calls DELETE /api/tactic-presets/{id}', async () => {
    const dbPreset = makeDbPreset({ id: 42 });
    mockApiJson
      .mockResolvedValueOnce([dbPreset])
      .mockResolvedValueOnce(undefined);  // DELETE returns void

    const { result } = renderHook(() => usePresets(true));
    await waitFor(() => expect(result.current.loading).toBe(false));

    await act(async () => {
      await result.current.deletePreset(42);
    });

    expect(mockApiJson).toHaveBeenCalledWith('/api/tactic-presets/42', {
      method: 'DELETE',
    });
  });

  it('removes the deleted preset from local state immediately', async () => {
    const dbPreset = makeDbPreset({ id: 5 });
    mockApiJson
      .mockResolvedValueOnce([dbPreset])
      .mockResolvedValueOnce(undefined);

    const { result } = renderHook(() => usePresets(true));
    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.presets.some(p => p.id === 5)).toBe(true);

    await act(async () => {
      await result.current.deletePreset(5);
    });

    expect(result.current.presets.some(p => p.id === 5)).toBe(false);
  });
});
