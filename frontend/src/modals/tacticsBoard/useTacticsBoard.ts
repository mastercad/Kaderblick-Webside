// ─── TacticsBoard – main state hook ───────────────────────────────────────────
import { useRef, useState, useCallback, useEffect, useId } from 'react';
import React from 'react';
import { apiJson } from '../../utils/api';
import type { Formation, PlayerData } from '../formation/types';
import {
  Tool, DrawElement, FieldZone, OpponentToken, TacticEntry, TacticsBoardData,
  DrawPreview, ElDragState, OppDragState,
} from './types';
import type { TacticPreset } from './types';
import { svgCoords, makeMarkerId } from './utils';
import { PALETTE } from './constants';

// ─── Return type ──────────────────────────────────────────────────────────────

export interface TacticsBoardState {
  // Refs
  svgRef: React.RefObject<SVGSVGElement | null>;
  containerRef: React.RefObject<HTMLDivElement | null>;
  pitchRef: React.RefObject<HTMLDivElement | null>;

  // Tool / color
  tool: Tool;
  setTool: (t: Tool) => void;
  color: string;
  setColor: (c: string) => void;

  // Tactics
  tactics: TacticEntry[];
  setTactics: React.Dispatch<React.SetStateAction<TacticEntry[]>>;
  activeTacticId: string;
  setActiveTacticId: (id: string) => void;
  renamingId: string | null;
  setRenamingId: (id: string | null) => void;
  renameValue: string;
  setRenameValue: (v: string) => void;

  // Drawing
  preview: DrawPreview | null;
  drawing: boolean;

  // UI toggles
  fullPitch: boolean;
  setFullPitch: React.Dispatch<React.SetStateAction<boolean>>;
  isBrowserFS: boolean;
  showNotes: boolean;
  setShowNotes: React.Dispatch<React.SetStateAction<boolean>>;

  // Save
  saving: boolean;
  saveMsg: { ok: boolean; text: string } | null;
  isDirty: boolean;

  // Drag
  elDrag: ElDragState | null;
  oppDrag: OppDragState | null;

  // Derived
  elements: DrawElement[];
  opponents: OpponentToken[];
  activeTactic: TacticEntry | undefined;
  pitchAX: number;
  pitchAspect: string;
  svgCursor: string;
  ownPlayers: Array<PlayerData & { sx: number; sy: number }>;
  formationName: string;
  formationCode: string | undefined;
  notes: string | undefined;
  markerId: (hex: string, kind: 'solid' | 'dashed') => string;

  // Handlers
  handleAddOpponent: () => void;
  handleSave: () => Promise<void>;
  handleSvgDown: (e: React.MouseEvent | React.TouchEvent) => void;
  handleSvgMove: (e: React.MouseEvent | React.TouchEvent) => void;
  handleSvgUp: () => void;
  handleElDown: (
    e: React.MouseEvent | React.TouchEvent,
    id: string,
    mode?: 'move' | 'start' | 'end' | 'resize',
  ) => void;
  handleOppDown: (e: React.MouseEvent | React.TouchEvent, id: string) => void;
  handleClear: () => void;
  handleUndo: () => void;
  handleNewTactic: () => void;
  handleDeleteTactic: (id: string) => void;
  /** Load a tactic preset as a new tab (never overwrites existing work). */
  handleLoadPreset: (preset: TacticPreset) => void;
  confirmRename: () => void;
  toggleFullscreen: () => Promise<void>;
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useTacticsBoard(
  open: boolean,
  formation: Formation | null,
  onBoardSaved?: (updatedFormation: Formation) => void,
): TacticsBoardState {
  const uid          = useId();
  const svgRef       = useRef<SVGSVGElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const pitchRef     = useRef<HTMLDivElement>(null);

  // ── Tool / color ──────────────────────────────────────────────────────────
  const [tool, setTool]   = useState<Tool>('arrow');
  const [color, setColor] = useState(PALETTE[0].value);

  // ── Multi-tactic state ────────────────────────────────────────────────────
  const [tactics, setTactics]               = useState<TacticEntry[]>([]);
  const [activeTacticId, setActiveTacticId] = useState<string>('');
  const [renamingId, setRenamingId]         = useState<string | null>(null);
  const [renameValue, setRenameValue]       = useState('');

  // ── Drawing state ─────────────────────────────────────────────────────────
  const [preview, setPreview] = useState<DrawPreview | null>(null);
  const [drawing, setDrawing] = useState(false);

  // ── UI toggles ────────────────────────────────────────────────────────────
  const [fullPitch, setFullPitch]     = useState(true);
  const [isBrowserFS, setIsBrowserFS] = useState(false);
  const [showNotes, setShowNotes]     = useState(false);

  // ── Save state ────────────────────────────────────────────────────────────
  const [saving, setSaving]   = useState(false);
  const [saveMsg, setSaveMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [isDirty, setIsDirty] = useState(false);

  // ── Drag state ────────────────────────────────────────────────────────────
  const [elDrag, setElDrag]   = useState<ElDragState  | null>(null);
  const [oppDrag, setOppDrag] = useState<OppDragState | null>(null);

  // ── Derived: active tactic ────────────────────────────────────────────────
  const activeTactic = tactics.find(t => t.id === activeTacticId) ?? tactics[0];
  const elements     = activeTactic?.elements  ?? [];
  const opponents    = activeTactic?.opponents ?? [];

  // ── Pitch layout helpers ──────────────────────────────────────────────────
  const pitchAspect = fullPitch ? '1920 / 1357' : '1357 / 960';
  const pitchAX     = fullPitch ? (1357 / 1920) : (960 / 1357);

  const playerScreenPos = (px: number, py: number) =>
    fullPitch
      ? { sx: 50 + py * 0.5, sy: px }
      : { sx: px, sy: py };

  const ownPlayers = (formation?.formationData?.players ?? []).map(p => ({
    ...p,
    ...playerScreenPos(p.x, p.y),
  }));

  const formationName = formation?.name ?? '';
  const formationCode = formation?.formationData?.code;
  const notes         = formation?.formationData?.notes;

  // ── Marker id helper ──────────────────────────────────────────────────────
  const markerId = (hex: string, kind: 'solid' | 'dashed') =>
    makeMarkerId(uid, hex, kind);

  // ── SVG cursor ────────────────────────────────────────────────────────────
  const svgCursor = elDrag || oppDrag
    ? 'grabbing'
    : tool === 'pointer' ? 'default' : 'crosshair';

  // ── Mutation helpers – always operate on the active tactic ────────────────
  const updateActiveElements = useCallback(
    (fn: (prev: DrawElement[]) => DrawElement[]) => {
      setIsDirty(true);
      setTactics(prev =>
        prev.map(t => t.id !== activeTacticId ? t : { ...t, elements: fn(t.elements) }));
    },
    [activeTacticId],
  );

  const updateActiveOpponents = useCallback(
    (fn: (prev: OpponentToken[]) => OpponentToken[]) => {
      setIsDirty(true);
      setTactics(prev =>
        prev.map(t => t.id !== activeTacticId ? t : { ...t, opponents: fn(t.opponents) }));
    },
    [activeTacticId],
  );

  // ── Load effect ───────────────────────────────────────────────────────────
  useEffect(() => {
    if (!open) return;
    const fd  = formation?.formationData as any;
    const arr = fd?.tacticsBoardDataArr as TacticEntry[] | undefined;
    const old = fd?.tacticsBoardData   as TacticsBoardData | undefined;

    let loaded: TacticEntry[];
    if (Array.isArray(arr) && arr.length > 0) {
      loaded = arr;
    } else if (old) {
      loaded = [{
        id: 'tactic-1', name: 'Standard',
        elements: old.elements ?? [], opponents: old.opponents ?? [],
      }];
    } else {
      loaded = [{ id: 'tactic-1', name: 'Standard', elements: [], opponents: [] }];
    }
    setTactics(loaded);
    setActiveTacticId(loaded[0].id);
    setPreview(null); setDrawing(false);
    setElDrag(null);  setOppDrag(null); setSaveMsg(null); setRenamingId(null);
    setIsDirty(false);
  }, [open, formation?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Browser fullscreen ────────────────────────────────────────────────────
  useEffect(() => {
    const handler = () => setIsBrowserFS(!!document.fullscreenElement);
    document.addEventListener('fullscreenchange', handler);
    return () => document.removeEventListener('fullscreenchange', handler);
  }, []);

  const toggleFullscreen = useCallback(async () => {
    if (!document.fullscreenElement) {
      await containerRef.current?.requestFullscreen?.();
    } else {
      await document.exitFullscreen();
    }
  }, []);

  // ── Add opponent ──────────────────────────────────────────────────────────
  const handleAddOpponent = useCallback(() => {
    updateActiveOpponents(prev => {
      const n          = prev.length;
      const col        = n % 4;
      const row        = Math.floor(n / 4);
      const nextNumber = n === 0 ? 1 : Math.max(...prev.map(o => o.number)) + 1;
      return [...prev, {
        id: `opp-${Date.now()}-${Math.random()}`,
        x: 5  + col       * 10,
        y: 15 + (row % 5) * 16,
        number: nextNumber,
      }];
    });
    setTool('pointer');
  }, [updateActiveOpponents]);

  // ── Save ──────────────────────────────────────────────────────────────────
  const handleSave = useCallback(async () => {
    if (!formation) return;
    setSaving(true); setSaveMsg(null);
    try {
      const now          = new Date().toISOString();
      const boardDataArr = tactics.map(t =>
        t.id === activeTacticId ? { ...t, savedAt: now } : t,
      );
      const updatedFormationData = {
        ...formation.formationData,
        tacticsBoardDataArr: boardDataArr,
      };
      const resp = await apiJson<{ formation: Formation }>(`/formation/${formation.id}/edit`, {
        method: 'POST',
        body: { name: formationName, formationData: updatedFormationData },
      });
      setSaveMsg({ ok: true, text: 'Taktik gespeichert ✓' });
      setIsDirty(false);
      if (resp?.formation) onBoardSaved?.(resp.formation);
    } catch {
      setSaveMsg({ ok: false, text: 'Fehler beim Speichern' });
    } finally {
      setSaving(false);
      setTimeout(() => setSaveMsg(null), 3500);
    }
  }, [formation, tactics, activeTacticId, formationName, onBoardSaved]);

  // ── SVG draw start ────────────────────────────────────────────────────────
  const handleSvgDown = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    if (tool === 'pointer') return;
    e.preventDefault();
    if (!svgRef.current) return;
    const pt = svgCoords(e, svgRef.current);
    setDrawing(true);
    setPreview({ x1: pt.x, y1: pt.y, x2: pt.x, y2: pt.y });
  }, [tool]);

  // ── SVG move (drag handler for opponents, elements, + live preview) ────────
  const handleSvgMove = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    if (!svgRef.current) return;

    if (oppDrag) {
      e.preventDefault();
      const pt = svgCoords(e, svgRef.current);
      const dx = pt.x - oppDrag.startX;
      const dy = pt.y - oppDrag.startY;
      updateActiveOpponents(prev => prev.map(o =>
        o.id !== oppDrag.id ? o : {
          ...o,
          x: Math.max(2,  Math.min(98, o.x + dx)),
          y: Math.max(1,  Math.min(99, o.y + dy)),
        },
      ));
      setOppDrag(prev => prev
        ? { ...prev, startX: pt.x, startY: pt.y, hasMoved: prev.hasMoved || Math.hypot(dx, dy) > 0.5 }
        : null,
      );
      return;
    }

    if (elDrag) {
      e.preventDefault();
      const pt = svgCoords(e, svgRef.current);
      const dx = pt.x - elDrag.startX;
      const dy = pt.y - elDrag.startY;
      updateActiveElements(prev => prev.map(el => {
        if (el.id !== elDrag.id) return el;

        if (elDrag.mode === 'start' && (el.kind === 'arrow' || el.kind === 'run')) {
          return { ...el,
            x1: Math.max(0, Math.min(100, pt.x)),
            y1: Math.max(0, Math.min(100, pt.y)),
          };
        }
        if (elDrag.mode === 'end' && (el.kind === 'arrow' || el.kind === 'run')) {
          return { ...el,
            x2: Math.max(0, Math.min(100, pt.x)),
            y2: Math.max(0, Math.min(100, pt.y)),
          };
        }
        if (elDrag.mode === 'resize' && el.kind === 'zone') {
          return { ...el,
            r: Math.max(3, Math.min(40, Math.hypot(pt.x - el.cx, pt.y - el.cy))),
          };
        }
        // mode === 'move'
        if (el.kind === 'arrow' || el.kind === 'run') {
          return { ...el,
            x1: Math.max(0, Math.min(100, el.x1 + dx)),
            y1: Math.max(0, Math.min(100, el.y1 + dy)),
            x2: Math.max(0, Math.min(100, el.x2 + dx)),
            y2: Math.max(0, Math.min(100, el.y2 + dy)),
          };
        }
        return { ...el,
          cx: Math.max(3, Math.min(97, (el as FieldZone).cx + dx)),
          cy: Math.max(3, Math.min(97, (el as FieldZone).cy + dy)),
        } as FieldZone;
      }));
      setElDrag(prev => prev
        ? { ...prev, startX: pt.x, startY: pt.y, hasMoved: prev.hasMoved || Math.hypot(dx, dy) > 0.5 }
        : null,
      );
      return;
    }

    if (!drawing || tool === 'pointer') return;
    e.preventDefault();
    const pt = svgCoords(e, svgRef.current);
    setPreview(prev => prev ? { ...prev, x2: pt.x, y2: pt.y } : null);
  }, [oppDrag, elDrag, drawing, tool, updateActiveElements, updateActiveOpponents]);

  // ── SVG pointer up ────────────────────────────────────────────────────────
  const handleSvgUp = useCallback(() => {
    if (oppDrag) {
      if (!oppDrag.hasMoved) {
        updateActiveOpponents(prev => prev.filter(o => o.id !== oppDrag.id));
      }
      setOppDrag(null);
      return;
    }
    if (elDrag) {
      if (!elDrag.hasMoved && tool === 'pointer') {
        updateActiveElements(prev => prev.filter(el => el.id !== elDrag.id));
      }
      setElDrag(null);
      return;
    }

    if (!drawing || !preview) { setDrawing(false); return; }
    setDrawing(false);
    const dist = Math.hypot(preview.x2 - preview.x1, preview.y2 - preview.y1);
    if (dist < 2) { setPreview(null); return; }

    const id = `el-${Date.now()}-${Math.random()}`;
    if (tool === 'arrow' || tool === 'run') {
      updateActiveElements(prev => [...prev, {
        id, kind: tool,
        x1: preview.x1, y1: preview.y1,
        x2: preview.x2, y2: preview.y2,
        color,
      }]);
    } else if (tool === 'zone') {
      updateActiveElements(prev => [...prev, {
        id, kind: 'zone',
        cx: preview.x1, cy: preview.y1,
        r: Math.min(dist, 35),
        color,
      }]);
    }
    setPreview(null);
  }, [oppDrag, elDrag, drawing, preview, tool, color, updateActiveElements, updateActiveOpponents]);

  // ── Element drag start ────────────────────────────────────────────────────
  const handleElDown = useCallback((
    e: React.MouseEvent | React.TouchEvent,
    id: string,
    mode: 'move' | 'start' | 'end' | 'resize' = 'move',
  ) => {
    e.stopPropagation();
    e.preventDefault();
    if (!svgRef.current) return;
    const pt = svgCoords(e, svgRef.current);
    setElDrag({ id, mode, startX: pt.x, startY: pt.y, hasMoved: false });
  }, []);

  // ── Opponent drag start ───────────────────────────────────────────────────
  const handleOppDown = useCallback((e: React.MouseEvent | React.TouchEvent, id: string) => {
    e.stopPropagation();
    e.preventDefault();
    if (!svgRef.current) return;
    const pt = svgCoords(e, svgRef.current);
    setOppDrag({ id, startX: pt.x, startY: pt.y, hasMoved: false });
  }, []);

  // ── Clear / Undo ──────────────────────────────────────────────────────────
  const handleClear = useCallback(() => {
    updateActiveElements(() => []);
    updateActiveOpponents(() => []);
  }, [updateActiveElements, updateActiveOpponents]);

  const handleUndo = useCallback(() => {
    updateActiveElements(prev => prev.slice(0, -1));
  }, [updateActiveElements]);

  // ── Tactic management ─────────────────────────────────────────────────────
  const handleNewTactic = useCallback(() => {
    const id = `tactic-${Date.now()}`;
    setTactics(prev => [...prev, { id, name: 'Neue Taktik', elements: [], opponents: [] }]);
    setActiveTacticId(id);
    setRenamingId(id);
    setRenameValue('Neue Taktik');
    setIsDirty(true);
  }, []);

  const handleDeleteTactic = useCallback((id: string) => {
    setTactics(prev => {
      if (prev.length <= 1) return prev;
      const idx  = prev.findIndex(t => t.id === id);
      const next = prev.filter(t => t.id !== id);
      // If the deleted tactic was active, select the closest remaining one
      setActiveTacticId(current =>
        current === id ? next[Math.max(0, idx - 1)].id : current,
      );
      return next;
    });
    setIsDirty(true);
  }, []);

  const handleLoadPreset = useCallback((preset: TacticPreset) => {
    const id = `tactic-${Date.now()}`;
    const newTactic: TacticEntry = {
      id,
      name: preset.title,
      elements: preset.data.elements ?? [],
      opponents: preset.data.opponents ?? [],
    };
    setTactics(prev => [...prev, newTactic]);
    setActiveTacticId(id);
    setIsDirty(true);
  }, []);

  const confirmRename = useCallback(() => {
    if (renameValue.trim()) {
      setTactics(prev =>
        prev.map(t => t.id !== renamingId ? t : { ...t, name: renameValue.trim() }),
      );
      setIsDirty(true);
    }
    setRenamingId(null);
  }, [renameValue, renamingId]);

  // ── Return ────────────────────────────────────────────────────────────────
  return {
    svgRef, containerRef, pitchRef,
    tool, setTool, color, setColor,
    tactics, setTactics,
    activeTacticId, setActiveTacticId,
    renamingId, setRenamingId,
    renameValue, setRenameValue,
    preview, drawing,
    fullPitch, setFullPitch,
    isBrowserFS,
    showNotes, setShowNotes,
    saving, saveMsg,
    elDrag, oppDrag,
    elements, opponents, activeTactic,
    pitchAX, pitchAspect, svgCursor, markerId,
    ownPlayers, formationName, formationCode, notes,
    isDirty,
    handleAddOpponent, handleSave,
    handleSvgDown, handleSvgMove, handleSvgUp,
    handleElDown, handleOppDown,
    handleClear, handleUndo,
    handleNewTactic, handleDeleteTactic, handleLoadPreset, confirmRename,
    toggleFullscreen,
  };
}
