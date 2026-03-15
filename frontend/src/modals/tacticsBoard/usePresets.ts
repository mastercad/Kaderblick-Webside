/**
 * usePresets
 *
 * Fetches tactic presets from the API and merges them with the built-in
 * offline presets.  DB presets take precedence over identical built-ins
 * (matched by title).
 *
 * API response: TacticPreset[]  (GET /api/tactic-presets)
 */

import { useState, useEffect, useCallback } from 'react';
import type { TacticPreset, PresetCategory } from './types';
import { BUILTIN_PRESETS } from './presetData';
import { apiJson } from '../../utils/api';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface UsePresetsResult {
  /** All visible presets, grouped by category */
  byCategory: Record<string, TacticPreset[]>;
  /** Flat list of all presets */
  presets: TacticPreset[];
  loading: boolean;
  error: string | null;
  /** Save the current tactic as a new preset */
  savePreset: (args: SavePresetArgs) => Promise<TacticPreset>;
  /** Delete an own preset (non-system) */
  deletePreset: (id: number) => Promise<void>;
  /** Re-fetch from API */
  refresh: () => void;
}

export interface SavePresetArgs {
  title: string;
  category: PresetCategory;
  description: string;
  shareWithClub: boolean;
  /** The TacticEntry data to save (without id – id will be generated server-side) */
  data: TacticPreset['data'];
}

// ---------------------------------------------------------------------------
// Grouping helper
// ---------------------------------------------------------------------------

function groupByCategory(presets: TacticPreset[]): Record<string, TacticPreset[]> {
  return presets.reduce<Record<string, TacticPreset[]>>((acc, p) => {
    const key = p.category;
    if (!acc[key]) acc[key] = [];
    acc[key].push(p);
    return acc;
  }, {});
}

/**
 * Merge DB presets with built-ins.
 * DB presets with the same title override the built-in equivalent.
 */
function mergePresets(db: TacticPreset[], builtins: TacticPreset[]): TacticPreset[] {
  const dbTitles = new Set(db.map(p => p.title));
  const filtered  = builtins.filter(b => !dbTitles.has(b.title));
  return [...filtered, ...db];
}

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

export function usePresets(open: boolean): UsePresetsResult {
  const [dbPresets, setDbPresets] = useState<TacticPreset[]>([]);
  const [loading, setLoading]     = useState(false);
  const [error, setError]         = useState<string | null>(null);
  const [tick, setTick]           = useState(0);

  // Fetch from API whenever the modal opens (or refresh is requested)
  useEffect(() => {
    if (!open) return;

    let cancelled = false;

    const fetchPresets = async () => {
      setLoading(true);
      setError(null);

      try {
        const data = await apiJson<TacticPreset[]>('/api/tactic-presets');
        if (!cancelled) {
          setDbPresets(Array.isArray(data) ? data : []);
        }
      } catch (err) {
        if (!cancelled) {
          console.warn('[usePresets] Could not fetch presets from API:', err);
          // Non-fatal: built-in presets still available
          setError('Eigene Vorlagen konnten nicht geladen werden.');
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    void fetchPresets();

    return () => { cancelled = true; };
  }, [open, tick]);

  // Derived state
  const allPresets  = mergePresets(dbPresets, BUILTIN_PRESETS);
  const byCategory  = groupByCategory(allPresets);

  // ----- actions -----------------------------------------------------------

  const savePreset = useCallback(async (args: SavePresetArgs): Promise<TacticPreset> => {
    const saved = await apiJson<TacticPreset>('/api/tactic-presets', {
      method: 'POST',
      body: args,
    });

    // Optimistically add to local state
    setDbPresets(prev => [...prev, saved]);

    return saved;
  }, []);

  const deletePreset = useCallback(async (id: number): Promise<void> => {
    await apiJson<void>(`/api/tactic-presets/${id}`, { method: 'DELETE' });
    setDbPresets(prev => prev.filter(p => p.id !== id));
  }, []);

  const refresh = useCallback(() => setTick(t => t + 1), []);

  return {
    byCategory,
    presets: allPresets,
    loading,
    error,
    savePreset,
    deletePreset,
    refresh,
  };
}
