import { useState, useCallback } from 'react';
import { EventData, SelectOption } from '../types/event';
import { apiRequest } from '../utils/api';

export interface UseTournamentMatchHandlersParams {
  event: EventData;
  tournamentMatches: any[];
  setTournamentMatches: (matches: any[]) => void;
  teams: SelectOption[];
  onChange: (field: string, value: any) => void;
  reloadMatches: (tournamentId: string | undefined, setMatches: (m: any[]) => void) => Promise<void>;
}

export interface UseTournamentMatchHandlersResult {
  // Dialog visibility
  importOpen: boolean;
  manualOpen: boolean;
  generatorOpen: boolean;
  setImportOpen: (open: boolean) => void;
  setManualOpen: (open: boolean) => void;
  setGeneratorOpen: (open: boolean) => void;

  // Inline match editing
  editingMatchId: string | number | null;
  editingMatchDraft: any;
  setEditingMatchDraft: (draft: any) => void;

  // Handlers
  syncDraftsToParent: (matches?: any[]) => void;
  handleTournamentMatchChange: (matchId: string) => void;
  handleGeneratePlan: () => Promise<void>;
  handleAddMatch: () => void;
  handleEditMatch: (match: any) => void;
  handleSaveMatch: () => Promise<void>;
  handleCancelEdit: () => void;
  handleDeleteMatch: (matchId: string | number) => Promise<void>;
  handleImportClose: (payload?: any[]) => Promise<void>;
  handleManualClose: (payload?: any[]) => Promise<void>;
  handleGeneratorClose: (
    matches: any[],
    config?: {
      gameMode?: string;
      tournamentType?: string;
      roundDuration?: number;
      breakTime?: number;
      numberOfGroups?: number;
    },
  ) => void;
}

/**
 * Manages all tournament match CRUD operations as well as the dialog open/close
 * state for ImportMatchesDialog, ManualMatchesEditor and TournamentMatchGeneratorDialog.
 */
export function useTournamentMatchHandlers({
  event,
  tournamentMatches,
  setTournamentMatches,
  teams,
  onChange,
  reloadMatches,
}: UseTournamentMatchHandlersParams): UseTournamentMatchHandlersResult {
  const [importOpen, setImportOpen]     = useState(false);
  const [manualOpen, setManualOpen]     = useState(false);
  const [generatorOpen, setGeneratorOpen] = useState(false);

  const [editingMatchId, setEditingMatchId]     = useState<string | number | null>(null);
  const [editingMatchDraft, setEditingMatchDraft] = useState<any>(null);

  // ── Helpers ───────────────────────────────────────────────────────────────

  const resolveTeamName = useCallback(
    (id: any) => teams.find(t => String(t.value) === String(id))?.label || '',
    [teams],
  );

  /**
   * Writes draft matches back to the parent form field so they are included
   * in the save payload for unsaved tournaments.
   */
  const syncDraftsToParent = useCallback(
    (matches?: any[]) => {
      if (event?.tournamentId) return; // persisted tournament — nothing to sync
      const drafts = (matches || tournamentMatches || [])
        .filter(m => String(m.id).startsWith('draft-'))
        .map(m => ({
          homeTeamId:   m.homeTeamId   || m.homeTeam   || '',
          awayTeamId:   m.awayTeamId   || m.awayTeam   || '',
          homeTeamName: m.homeTeamName || '',
          awayTeamName: m.awayTeamName || '',
          round:        m.round        || undefined,
          slot:         m.slot         || undefined,
          scheduledAt:  m.scheduledAt  || undefined,
        }));
      onChange('pendingTournamentMatches', drafts);
    },
    [event?.tournamentId, tournamentMatches, onChange],
  );

  // ── Match selection ───────────────────────────────────────────────────────

  const handleTournamentMatchChange = useCallback(
    (matchId: string) => {
      onChange('tournamentMatchId', matchId);
      const match = tournamentMatches.find(x => String(x.id) === String(matchId));
      if (match) {
        if (match.homeTeamId) onChange('homeTeam', String(match.homeTeamId));
        if (match.awayTeamId) onChange('awayTeam', String(match.awayTeamId));
      }
    },
    [onChange, tournamentMatches],
  );

  // ── Plan generation ───────────────────────────────────────────────────────

  const handleGeneratePlan = useCallback(async () => {
    if (!event.tournamentId) return;
    try {
      const res = await apiRequest(
        `/api/tournaments/${event.tournamentId}/generate-plan`,
        { method: 'POST' },
      );
      if (res.ok) {
        await reloadMatches(event.tournamentId, setTournamentMatches);
      } else if (res.status === 403) {
        alert('Keine Berechtigung, Turnierplan zu generieren.');
      } else {
        alert('Fehler beim Erzeugen des Turnierplans');
      }
    } catch {
      alert('Fehler beim Erzeugen des Turnierplans');
    }
  }, [event.tournamentId, reloadMatches, setTournamentMatches]);

  // ── Inline CRUD ───────────────────────────────────────────────────────────

  const handleAddMatch = useCallback(() => {
    const newDraft = {
      id: `draft-${Date.now()}`,
      round: '', slot: '',
      homeTeamId: '', awayTeamId: '',
      homeTeamName: '', awayTeamName: '',
      scheduledAt: '',
    };
    const updated = [...(tournamentMatches || []), newDraft];
    setTournamentMatches(updated);
    setEditingMatchId(newDraft.id);
    setEditingMatchDraft(newDraft);
    syncDraftsToParent(updated);
  }, [tournamentMatches, setTournamentMatches, syncDraftsToParent]);

  const handleEditMatch = useCallback((match: any) => {
    setEditingMatchId(match.id);
    setEditingMatchDraft({ ...match });
  }, []);

  const handleSaveMatch = useCallback(async () => {
    if (!editingMatchDraft) return;
    const updated = (tournamentMatches || []).map((x: any) =>
      x.id === editingMatchDraft.id ? { ...x, ...editingMatchDraft } : x,
    );
    setTournamentMatches(updated);
    syncDraftsToParent(updated);
    setEditingMatchId(null);
    setEditingMatchDraft(null);

    if (event.tournamentId && !String(editingMatchDraft.id).startsWith('draft-')) {
      try {
        await apiRequest(
          `/api/tournaments/${event.tournamentId}/matches/${editingMatchDraft.id}`,
          {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(editingMatchDraft),
          },
        );
        const res = await apiRequest(`/api/tournaments/${event.tournamentId}/matches`);
        setTournamentMatches((await res.json()) || []);
      } catch { /* ignore */ }
    }
  }, [editingMatchDraft, tournamentMatches, event.tournamentId, setTournamentMatches, syncDraftsToParent]);

  const handleCancelEdit = useCallback(() => {
    setEditingMatchId(null);
    setEditingMatchDraft(null);
  }, []);

  const handleDeleteMatch = useCallback(
    async (matchId: string | number) => {
      if (String(matchId).startsWith('draft-')) {
        const updated = (tournamentMatches || []).filter((x: any) => x.id !== matchId);
        setTournamentMatches(updated);
        syncDraftsToParent(updated);
        return;
      }
      if (!event.tournamentId) return;
      try {
        await apiRequest(
          `/api/tournaments/${event.tournamentId}/matches/${matchId}`,
          { method: 'DELETE' },
        );
        const res = await apiRequest(`/api/tournaments/${event.tournamentId}/matches`);
        setTournamentMatches((await res.json()) || []);
      } catch { /* ignore */ }
    },
    [tournamentMatches, event.tournamentId, setTournamentMatches, syncDraftsToParent],
  );

  // ── Sub-dialog close handlers ─────────────────────────────────────────────

  const handleImportClose = useCallback(
    async (payload?: any[]) => {
      setImportOpen(false);
      if (!event.tournamentId) {
        if (payload?.length) {
          onChange('pendingTournamentMatches', payload);
          setTournamentMatches(
            payload.map((m: any, idx: number) => ({
              id: `draft-${idx}`,
              ...m,
              homeTeamName: resolveTeamName(m.homeTeamId) || m.homeTeamName || '',
              awayTeamName: resolveTeamName(m.awayTeamId) || m.awayTeamName || '',
            })),
          );
        }
        return;
      }
      await reloadMatches(event.tournamentId, setTournamentMatches);
    },
    [event.tournamentId, onChange, resolveTeamName, setTournamentMatches, reloadMatches],
  );

  const handleManualClose = useCallback(
    async (payload?: any[]) => {
      setManualOpen(false);
      if (event.tournamentId) {
        await reloadMatches(event.tournamentId, setTournamentMatches);
        return;
      }
      if (payload?.length) {
        onChange('pendingTournamentMatches', payload);
        setTournamentMatches(
          payload.map((m: any, idx: number) => ({
            id: `draft-${idx}`,
            ...m,
            homeTeamName: resolveTeamName(m.homeTeamId) || m.homeTeamName || '',
            awayTeamName: resolveTeamName(m.awayTeamId) || m.awayTeamName || '',
          })),
        );
      }
    },
    [event.tournamentId, onChange, resolveTeamName, setTournamentMatches, reloadMatches],
  );

  const handleGeneratorClose = useCallback(
    (
      matches: any[],
      config?: {
        gameMode?: string;
        tournamentType?: string;
        roundDuration?: number;
        breakTime?: number;
        numberOfGroups?: number;
      },
    ) => {
      onChange('pendingTournamentMatches', matches);
      if (config) {
        if (config.gameMode)                     onChange('tournamentGameMode',       config.gameMode);
        if (config.tournamentType)               onChange('tournamentType',           config.tournamentType);
        if (config.roundDuration !== undefined)  onChange('tournamentRoundDuration',  config.roundDuration);
        if (config.breakTime !== undefined)      onChange('tournamentBreakTime',      config.breakTime);
        if (config.numberOfGroups !== undefined) onChange('tournamentNumberOfGroups', config.numberOfGroups);
      }
      setTournamentMatches(
        matches.map((m: any, idx: number) => ({
          id: `draft-${idx}`,
          ...m,
          homeTeamName: resolveTeamName(m.homeTeamId) || m.homeTeamName || '',
          awayTeamName: resolveTeamName(m.awayTeamId) || m.awayTeamName || '',
        })),
      );
      setGeneratorOpen(false);
    },
    [onChange, resolveTeamName, setTournamentMatches],
  );

  return {
    importOpen, manualOpen, generatorOpen,
    setImportOpen, setManualOpen, setGeneratorOpen,
    editingMatchId, editingMatchDraft, setEditingMatchDraft,
    syncDraftsToParent,
    handleTournamentMatchChange,
    handleGeneratePlan,
    handleAddMatch, handleEditMatch, handleSaveMatch, handleCancelEdit, handleDeleteMatch,
    handleImportClose, handleManualClose, handleGeneratorClose,
  };
}
