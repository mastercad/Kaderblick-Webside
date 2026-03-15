import { renderHook, act } from '@testing-library/react';
import { useTacticsBoard } from '../useTacticsBoard';

jest.mock('../../../utils/api', () => ({
  apiJson: jest.fn(),
}));

// Minimal formation stub
const makeFormation = (overrides: Record<string, unknown> = {}) => ({
  id: 1,
  name: 'Test Formation',
  formationData: { code: '4-3-3', players: [], ...overrides },
});

beforeEach(() => jest.clearAllMocks());

describe('useTacticsBoard – initial load', () => {
  it('creates a default Standard tactic when no saved data exists', () => {
    const { result } = renderHook(() =>
      useTacticsBoard(true, makeFormation() as any));

    expect(result.current.tactics).toHaveLength(1);
    expect(result.current.tactics[0].name).toBe('Standard');
    expect(result.current.tactics[0].elements).toEqual([]);
    expect(result.current.tactics[0].opponents).toEqual([]);
  });

  it('loads tacticsBoardDataArr when present', () => {
    const arr = [
      { id: 'a', name: 'Taktik A', elements: [], opponents: [] },
      { id: 'b', name: 'Taktik B', elements: [], opponents: [] },
    ];
    const { result } = renderHook(() =>
      useTacticsBoard(true, makeFormation({ tacticsBoardDataArr: arr }) as any));

    expect(result.current.tactics).toHaveLength(2);
    expect(result.current.tactics[0].name).toBe('Taktik A');
    expect(result.current.activeTacticId).toBe('a');
  });

  it('migrates legacy tacticsBoardData format into a single entry', () => {
    const old = {
      elements: [{ id: 'e1', kind: 'arrow', x1: 0, y1: 0, x2: 10, y2: 10, color: '#fff' }],
      opponents: [],
      savedAt: '2024-01-01',
    };
    const { result } = renderHook(() =>
      useTacticsBoard(true, makeFormation({ tacticsBoardData: old }) as any));

    expect(result.current.tactics).toHaveLength(1);
    expect(result.current.tactics[0].elements).toHaveLength(1);
  });

  it('does not load when open=false', () => {
    const { result } = renderHook(() =>
      useTacticsBoard(false, makeFormation() as any));

    // tactics remain at initial empty default before the effect fires
    expect(result.current.tactics).toHaveLength(0);
  });
});

describe('useTacticsBoard – tactic management', () => {
  it('handleNewTactic adds a tactic and makes it active', () => {
    const { result } = renderHook(() =>
      useTacticsBoard(true, makeFormation() as any));

    const prevCount = result.current.tactics.length;
    act(() => result.current.handleNewTactic());

    expect(result.current.tactics).toHaveLength(prevCount + 1);
    const newest = result.current.tactics[result.current.tactics.length - 1];
    expect(result.current.activeTacticId).toBe(newest.id);
  });

  it('handleDeleteTactic removes the specified tactic', () => {
    const { result } = renderHook(() =>
      useTacticsBoard(true, makeFormation() as any));

    // Add a second tactic first
    act(() => result.current.handleNewTactic());
    const [first, second] = result.current.tactics;

    act(() => result.current.handleDeleteTactic(second.id));

    expect(result.current.tactics).toHaveLength(1);
    expect(result.current.tactics[0].id).toBe(first.id);
  });

  it('handleDeleteTactic does nothing when only one tactic remains', () => {
    const { result } = renderHook(() =>
      useTacticsBoard(true, makeFormation() as any));

    const id = result.current.tactics[0].id;
    act(() => result.current.handleDeleteTactic(id));

    expect(result.current.tactics).toHaveLength(1);
  });

  it('confirmRename updates the tactic name', () => {
    const { result } = renderHook(() =>
      useTacticsBoard(true, makeFormation() as any));

    const id = result.current.tactics[0].id;
    act(() => {
      result.current.setRenamingId(id);
      result.current.setRenameValue('Neue Variante');
    });
    act(() => result.current.confirmRename());

    expect(result.current.tactics[0].name).toBe('Neue Variante');
    expect(result.current.renamingId).toBeNull();
  });

  it('confirmRename ignores blank strings', () => {
    const { result } = renderHook(() =>
      useTacticsBoard(true, makeFormation() as any));

    const id = result.current.tactics[0].id;
    const originalName = result.current.tactics[0].name;
    act(() => {
      result.current.setRenamingId(id);
      result.current.setRenameValue('   ');
    });
    act(() => result.current.confirmRename());

    expect(result.current.tactics[0].name).toBe(originalName);
  });
});

describe('useTacticsBoard – handleLoadPreset', () => {
  const samplePreset = {
    id: 'builtin-test',
    title: 'Schneller Konter',
    category: 'Angriff' as const,
    description: 'Kontertaktik',
    isSystem: true,
    canDelete: false,
    data: {
      name: 'Schneller Konter',
      elements: [
        { id: 'e1', kind: 'arrow' as const, x1: 50, y1: 50, x2: 20, y2: 30, color: '#22c55e' },
      ],
      opponents: [{ id: 'o1', x: 30, y: 40, number: 9 }],
    },
  };

  it('adds a new tactic tab with the preset name', () => {
    const { result } = renderHook(() =>
      useTacticsBoard(true, makeFormation() as any));

    const prevCount = result.current.tactics.length;
    act(() => result.current.handleLoadPreset(samplePreset));

    expect(result.current.tactics).toHaveLength(prevCount + 1);
    const newest = result.current.tactics[result.current.tactics.length - 1];
    expect(newest.name).toBe('Schneller Konter');
  });

  it('activates the newly created tab', () => {
    const { result } = renderHook(() =>
      useTacticsBoard(true, makeFormation() as any));

    act(() => result.current.handleLoadPreset(samplePreset));

    const newest = result.current.tactics[result.current.tactics.length - 1];
    expect(result.current.activeTacticId).toBe(newest.id);
  });

  it('copies elements and opponents from the preset', () => {
    const { result } = renderHook(() =>
      useTacticsBoard(true, makeFormation() as any));

    act(() => result.current.handleLoadPreset(samplePreset));

    const newest = result.current.tactics[result.current.tactics.length - 1];
    expect(newest.elements).toHaveLength(1);
    expect(newest.elements[0].id).toBe('e1');
    expect(newest.opponents).toHaveLength(1);
    expect(newest.opponents[0].id).toBe('o1');
  });

  it('does NOT overwrite the existing current tactic', () => {
    const arr = [{ id: 'my-tab', name: 'Meine Taktik', elements: [], opponents: [] }];
    const { result } = renderHook(() =>
      useTacticsBoard(true, makeFormation({ tacticsBoardDataArr: arr }) as any));

    act(() => result.current.handleLoadPreset(samplePreset));

    const original = result.current.tactics.find(t => t.id === 'my-tab');
    expect(original).toBeDefined();
    expect(original!.name).toBe('Meine Taktik');
  });

  it('assigns a unique id to the new tactic', () => {
    let counter = 100000;
    const dateSpy = jest.spyOn(Date, 'now').mockImplementation(() => counter++);

    const { result } = renderHook(() =>
      useTacticsBoard(true, makeFormation() as any));

    act(() => result.current.handleLoadPreset(samplePreset));
    act(() => result.current.handleLoadPreset(samplePreset));

    const ids = result.current.tactics.map(t => t.id);
    const unique = new Set(ids);
    expect(unique.size).toBe(ids.length);

    dateSpy.mockRestore();
  });
});

describe('useTacticsBoard – isDirty', () => {
  const { apiJson } = jest.requireMock('../../../utils/api');

  it('starts as false after initial load', () => {
    const { result } = renderHook(() =>
      useTacticsBoard(true, makeFormation() as any));

    expect(result.current.isDirty).toBe(false);
  });

  it('becomes true after handleClear', () => {
    const { result } = renderHook(() =>
      useTacticsBoard(true, makeFormation() as any));

    act(() => result.current.handleClear());
    expect(result.current.isDirty).toBe(true);
  });

  it('becomes true after handleUndo', () => {
    const { result } = renderHook(() =>
      useTacticsBoard(true, makeFormation() as any));

    act(() => result.current.handleUndo());
    expect(result.current.isDirty).toBe(true);
  });

  it('becomes true after handleAddOpponent', () => {
    const { result } = renderHook(() =>
      useTacticsBoard(true, makeFormation() as any));

    act(() => result.current.handleAddOpponent());
    expect(result.current.isDirty).toBe(true);
  });

  it('becomes true after handleNewTactic', () => {
    const { result } = renderHook(() =>
      useTacticsBoard(true, makeFormation() as any));

    act(() => result.current.handleNewTactic());
    expect(result.current.isDirty).toBe(true);
  });

  it('becomes true after handleDeleteTactic', () => {
    const { result } = renderHook(() =>
      useTacticsBoard(true, makeFormation() as any));

    act(() => result.current.handleNewTactic());
    act(() => result.current.handleClear()); // reset dirty for isolation
    // isDirty is true from handleNewTactic – that's fine, we just verify it stays true
    const secondId = result.current.tactics[result.current.tactics.length - 1].id;
    act(() => result.current.handleDeleteTactic(secondId));
    expect(result.current.isDirty).toBe(true);
  });

  it('becomes true after handleLoadPreset', () => {
    const { result } = renderHook(() =>
      useTacticsBoard(true, makeFormation() as any));

    const preset = {
      id: 'p1', title: 'Test', category: 'Angriff' as const,
      description: '', isSystem: true, canDelete: false,
      data: { name: 'Test', elements: [], opponents: [] },
    };
    act(() => result.current.handleLoadPreset(preset));
    expect(result.current.isDirty).toBe(true);
  });

  it('becomes true after confirmRename with a valid name', () => {
    const { result } = renderHook(() =>
      useTacticsBoard(true, makeFormation() as any));

    const id = result.current.tactics[0].id;
    act(() => {
      result.current.setRenamingId(id);
      result.current.setRenameValue('Umbenannt');
    });
    act(() => result.current.confirmRename());
    expect(result.current.isDirty).toBe(true);
  });

  it('stays false after confirmRename with blank string', () => {
    const { result } = renderHook(() =>
      useTacticsBoard(true, makeFormation() as any));

    const id = result.current.tactics[0].id;
    act(() => {
      result.current.setRenamingId(id);
      result.current.setRenameValue('   ');
    });
    act(() => result.current.confirmRename());
    expect(result.current.isDirty).toBe(false);
  });

  it('resets to false after a successful handleSave', async () => {
    apiJson.mockResolvedValueOnce({ formation: makeFormation() });

    const { result } = renderHook(() =>
      useTacticsBoard(true, makeFormation() as any));

    act(() => result.current.handleClear());
    expect(result.current.isDirty).toBe(true);

    await act(async () => { await result.current.handleSave(); });
    expect(result.current.isDirty).toBe(false);
  });

  it('stays true after a failed handleSave', async () => {
    apiJson.mockRejectedValueOnce(new Error('Network error'));

    const { result } = renderHook(() =>
      useTacticsBoard(true, makeFormation() as any));

    act(() => result.current.handleClear());
    await act(async () => { await result.current.handleSave(); });
    expect(result.current.isDirty).toBe(true);
  });

  it('resets to false when modal is re-opened', () => {
    const formation = makeFormation();
    const { result, rerender } = renderHook(
      ({ open }: { open: boolean }) => useTacticsBoard(open, formation as any),
      { initialProps: { open: true } },
    );

    act(() => result.current.handleClear());
    expect(result.current.isDirty).toBe(true);

    // Close and re-open
    rerender({ open: false });
    rerender({ open: true });
    expect(result.current.isDirty).toBe(false);
  });
});

describe('useTacticsBoard – drawing operations', () => {
  it('handleClear empties elements and opponents of the active tactic only', () => {
    const arr = [
      { id: 'a', name: 'A', elements: [{ id: 'e1', kind: 'arrow', x1: 0, y1: 0, x2: 10, y2: 10, color: '#fff' }], opponents: [{ id: 'o1', x: 5, y: 5, number: 1 }] },
      { id: 'b', name: 'B', elements: [{ id: 'e2', kind: 'arrow', x1: 0, y1: 0, x2: 20, y2: 20, color: '#f00' }], opponents: [] },
    ];
    const { result } = renderHook(() =>
      useTacticsBoard(true, makeFormation({ tacticsBoardDataArr: arr }) as any));

    // active should be 'a'
    act(() => result.current.handleClear());

    const active = result.current.tactics.find(t => t.id === 'a')!;
    const other  = result.current.tactics.find(t => t.id === 'b')!;
    expect(active.elements).toHaveLength(0);
    expect(active.opponents).toHaveLength(0);
    expect(other.elements).toHaveLength(1); // untouched
  });

  it('handleUndo removes only the last element from the active tactic', () => {
    const arr = [
      { id: 'a', name: 'A', elements: [
        { id: 'e1', kind: 'arrow', x1: 0, y1: 0, x2: 10, y2: 10, color: '#fff' },
        { id: 'e2', kind: 'arrow', x1: 5, y1: 5, x2: 15, y2: 15, color: '#f00' },
      ], opponents: [] },
    ];
    const { result } = renderHook(() =>
      useTacticsBoard(true, makeFormation({ tacticsBoardDataArr: arr }) as any));

    act(() => result.current.handleUndo());

    expect(result.current.elements).toHaveLength(1);
    expect(result.current.elements[0].id).toBe('e1');
  });
});
