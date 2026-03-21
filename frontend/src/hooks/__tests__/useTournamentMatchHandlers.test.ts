import { renderHook, act } from '@testing-library/react';
import { useTournamentMatchHandlers } from '../useTournamentMatchHandlers';

// ── Mock apiRequest ───────────────────────────────────────────────────────────
jest.mock('../../utils/api', () => ({
  apiRequest: jest.fn(),
}));
import { apiRequest } from '../../utils/api';
const mockApiRequest = apiRequest as jest.MockedFunction<typeof apiRequest>;

const teams = [
  { value: '1', label: 'FC Musterstadt' },
  { value: '2', label: 'SV Beispielburg' },
];

const buildMatch = (overrides: Record<string, any> = {}) => ({
  id: `draft-${Date.now()}`,
  round: '1',
  slot: '1',
  homeTeamId: '1',
  awayTeamId: '2',
  homeTeamName: 'FC Musterstadt',
  awayTeamName: 'SV Beispielburg',
  scheduledAt: '',
  ...overrides,
});

const makeParams = (overrides: Record<string, any> = {}) => {
  const tournamentMatches: any[] = overrides.tournamentMatches ?? [];
  const setTournamentMatches = jest.fn();
  const onChange = jest.fn();
  const reloadMatches = jest.fn().mockResolvedValue(undefined);

  return {
    event: { tournamentId: overrides.tournamentId ?? undefined, ...overrides.event },
    tournamentMatches,
    setTournamentMatches,
    teams,
    onChange,
    reloadMatches,
  };
};

describe('useTournamentMatchHandlers', () => {
  beforeEach(() => jest.clearAllMocks());

  // ── Dialog state ──────────────────────────────────────────────────────────

  it('setImportOpen / setManualOpen / setGeneratorOpen toggle dialog visibility', () => {
    const params = makeParams();
    const { result } = renderHook(() => useTournamentMatchHandlers(params));

    act(() => { result.current.setImportOpen(true); });
    expect(result.current.importOpen).toBe(true);

    act(() => { result.current.setManualOpen(true); });
    expect(result.current.manualOpen).toBe(true);

    act(() => { result.current.setGeneratorOpen(true); });
    expect(result.current.generatorOpen).toBe(true);
  });

  // ── syncDraftsToParent ────────────────────────────────────────────────────

  it('syncDraftsToParent calls onChange with draft-only matches', () => {
    const draft = buildMatch({ id: 'draft-99' });
    const persisted = buildMatch({ id: 42 });
    const params = makeParams({ tournamentMatches: [draft, persisted] });
    const { result } = renderHook(() => useTournamentMatchHandlers(params));

    act(() => { result.current.syncDraftsToParent(); });

    expect(params.onChange).toHaveBeenCalledWith(
      'pendingTournamentMatches',
      expect.arrayContaining([
        expect.objectContaining({ homeTeamId: draft.homeTeamId }),
      ]),
    );
    // Persisted matches must NOT appear in drafts
    const call = params.onChange.mock.calls[0][1];
    expect(call).toHaveLength(1);
  });

  it('syncDraftsToParent is a no-op when tournamentId is set (persisted tournament)', () => {
    const draft = buildMatch({ id: 'draft-1' });
    const params = makeParams({ tournamentId: 'tour-5', tournamentMatches: [draft] });
    const { result } = renderHook(() => useTournamentMatchHandlers(params));

    act(() => { result.current.syncDraftsToParent(); });
    expect(params.onChange).not.toHaveBeenCalled();
  });

  // ── handleTournamentMatchChange ───────────────────────────────────────────

  it('handleTournamentMatchChange updates tournamentMatchId and propagates teams', () => {
    const match = buildMatch({ id: 'match-1', homeTeamId: '1', awayTeamId: '2' });
    const params = makeParams({ tournamentMatches: [match] });
    const { result } = renderHook(() => useTournamentMatchHandlers(params));

    act(() => { result.current.handleTournamentMatchChange('match-1'); });

    expect(params.onChange).toHaveBeenCalledWith('tournamentMatchId', 'match-1');
    expect(params.onChange).toHaveBeenCalledWith('homeTeam', '1');
    expect(params.onChange).toHaveBeenCalledWith('awayTeam', '2');
  });

  // ── handleAddMatch ────────────────────────────────────────────────────────

  it('handleAddMatch appends a draft match and starts editing it', () => {
    const params = makeParams();
    const { result } = renderHook(() => useTournamentMatchHandlers(params));

    act(() => { result.current.handleAddMatch(); });

    const [[newMatches]] = params.setTournamentMatches.mock.calls;
    expect(newMatches).toHaveLength(1);
    expect(String(newMatches[0].id)).toMatch(/^draft-/);
    expect(result.current.editingMatchId).toBeTruthy();
  });

  // ── handleEditMatch ───────────────────────────────────────────────────────

  it('handleEditMatch sets editingMatchId and copies match into draft', () => {
    const match = buildMatch({ id: 'draft-77' });
    const params = makeParams({ tournamentMatches: [match] });
    const { result } = renderHook(() => useTournamentMatchHandlers(params));

    act(() => { result.current.handleEditMatch(match); });

    expect(result.current.editingMatchId).toBe('draft-77');
    expect(result.current.editingMatchDraft).toEqual(match);
  });

  // ── handleCancelEdit ──────────────────────────────────────────────────────

  it('handleCancelEdit clears editingMatchId and draft', () => {
    const match = buildMatch({ id: 'draft-5' });
    const params = makeParams({ tournamentMatches: [match] });
    const { result } = renderHook(() => useTournamentMatchHandlers(params));

    act(() => { result.current.handleEditMatch(match); });
    act(() => { result.current.handleCancelEdit(); });

    expect(result.current.editingMatchId).toBeNull();
    expect(result.current.editingMatchDraft).toBeNull();
  });

  // ── handleSaveMatch (draft) ───────────────────────────────────────────────

  it('handleSaveMatch updates draft match locally without API call', async () => {
    const match = buildMatch({ id: 'draft-10', round: '1' });
    const params = makeParams({ tournamentMatches: [match] });
    const { result } = renderHook(() => useTournamentMatchHandlers(params));

    act(() => { result.current.handleEditMatch(match); });
    act(() => { result.current.setEditingMatchDraft({ ...match, round: '2' }); });
    await act(async () => { await result.current.handleSaveMatch(); });

    const [[savedMatches]] = params.setTournamentMatches.mock.calls;
    expect(savedMatches[0].round).toBe('2');
    expect(mockApiRequest).not.toHaveBeenCalled();
  });

  // ── handleDeleteMatch (draft) ─────────────────────────────────────────────

  it('handleDeleteMatch removes draft match without API call', async () => {
    const match = buildMatch({ id: 'draft-20' });
    const params = makeParams({ tournamentMatches: [match] });
    const { result } = renderHook(() => useTournamentMatchHandlers(params));

    await act(async () => { await result.current.handleDeleteMatch('draft-20'); });

    const [[remaining]] = params.setTournamentMatches.mock.calls;
    expect(remaining).toHaveLength(0);
    expect(mockApiRequest).not.toHaveBeenCalled();
  });

  // ── handleDeleteMatch (persisted) ─────────────────────────────────────────

  it('handleDeleteMatch calls DELETE API for persisted match', async () => {
    mockApiRequest
      .mockResolvedValueOnce({ ok: true } as any)                   // DELETE
      .mockResolvedValueOnce({ ok: true, json: async () => [] } as any); // reload

    const match = buildMatch({ id: 55 });
    const params = makeParams({ tournamentId: 'tour-1', tournamentMatches: [match] });
    const { result } = renderHook(() => useTournamentMatchHandlers(params));

    await act(async () => { await result.current.handleDeleteMatch(55); });

    expect(mockApiRequest).toHaveBeenCalledWith(
      expect.stringContaining('/matches/55'),
      expect.objectContaining({ method: 'DELETE' }),
    );
  });

  // ── handleImportClose ─────────────────────────────────────────────────────

  it('handleImportClose sets pendingTournamentMatches for new tournaments', async () => {
    const params = makeParams();
    const { result } = renderHook(() => useTournamentMatchHandlers(params));

    const payload = [{ homeTeamId: '1', awayTeamId: '2', homeTeamName: '', awayTeamName: '' }];

    await act(async () => { await result.current.handleImportClose(payload); });

    expect(params.onChange).toHaveBeenCalledWith('pendingTournamentMatches', payload);
  });

  it('handleImportClose reloads matches for existing tournament', async () => {
    const params = makeParams({ tournamentId: 'tour-3' });
    const { result } = renderHook(() => useTournamentMatchHandlers(params));

    await act(async () => { await result.current.handleImportClose([]); });

    expect(params.reloadMatches).toHaveBeenCalledWith('tour-3', params.setTournamentMatches);
  });

  // ── handleGeneratorClose ──────────────────────────────────────────────────

  it('handleGeneratorClose writes matches and config fields via onChange', () => {
    const params = makeParams();
    const { result } = renderHook(() => useTournamentMatchHandlers(params));

    const matches = [{ homeTeamId: '1', awayTeamId: '2', homeTeamName: '', awayTeamName: '' }];
    const config = { gameMode: 'group', tournamentType: 'outdoor', roundDuration: 12, breakTime: 3, numberOfGroups: 4 };

    act(() => { result.current.handleGeneratorClose(matches, config); });

    expect(params.onChange).toHaveBeenCalledWith('pendingTournamentMatches', matches);
    expect(params.onChange).toHaveBeenCalledWith('tournamentGameMode', 'group');
    expect(params.onChange).toHaveBeenCalledWith('tournamentRoundDuration', 12);
    expect(params.onChange).toHaveBeenCalledWith('tournamentBreakTime', 3);
    expect(params.onChange).toHaveBeenCalledWith('tournamentNumberOfGroups', 4);
    expect(result.current.generatorOpen).toBe(false);
  });
});
