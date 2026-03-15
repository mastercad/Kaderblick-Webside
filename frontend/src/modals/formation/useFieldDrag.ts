/**
 * useFieldDrag
 *
 * Verantwortlich für:
 * - Pointer- und Touch-Drag von Tokens, die bereits auf dem Feld liegen
 * - Drag von der Bank aufs Feld via Pointer/Touch
 * - Tauschen zweier Feld-Tokens per Drag & Drop (wenn beim Loslassen ein
 *   anderer Spieler in der Nähe liegt, werden die Positionen getauscht)
 *
 * Benutzt kein HTML5-Drag-API (das übernimmt useSquadDrop).
 */
import React, { useState, useRef } from 'react';
import { getRelativePosition } from './helpers';
import type { DragSource, PlayerData } from './types';

/** In % der Felddimensionen – Token gilt als "Ziel" wenn Abstand kleiner. */
const SWAP_THRESHOLD = 9;

interface UseFieldDragParams {
  players: PlayerData[];
  setPlayers: React.Dispatch<React.SetStateAction<PlayerData[]>>;
  benchPlayers: PlayerData[];
  setBenchPlayers: React.Dispatch<React.SetStateAction<PlayerData[]>>;
  pitchRef: React.RefObject<HTMLDivElement | null>;
}

export function useFieldDrag({
  players,
  setPlayers,
  benchPlayers,
  setBenchPlayers,
  pitchRef,
}: UseFieldDragParams) {
  const [draggedPlayerId, setDraggedPlayerId] = useState<number | null>(null);
  const [draggedFrom, setDraggedFrom] = useState<DragSource | null>(null);
  /** Ref-Spiegel von draggedFrom – wird synchron aktualisiert, damit rapidfire
   *  mousemove-Handler stets den aktuellen Wert lesen (stale-closure-Safe). */
  const draggedFromRef = useRef<DragSource | null>(null);
  /** Ursprungsposition des gezogenen Tokens (für Swap-Logik). */
  const [dragOrigin, setDragOrigin] = useState<{ x: number; y: number } | null>(null);

  const updateDraggedFrom = (val: DragSource | null) => {
    draggedFromRef.current = val;
    setDraggedFrom(val);
  };

  const startDragFromField = (id: number, e: React.MouseEvent | React.TouchEvent) => {
    const origin = players.find(p => p.id === id);
    setDraggedPlayerId(id);
    updateDraggedFrom('field');
    setDragOrigin(origin ? { x: origin.x, y: origin.y } : null);
    e.stopPropagation();
    // nativen Scroll auf Touch-Geräten unterdrücken
    if ('touches' in e) e.preventDefault?.();
  };

  const startDragFromBench = (id: number, e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault(); // Verhindert Textmarkierung beim Ziehen
    setDraggedPlayerId(id);
    updateDraggedFrom('bench');
    setDragOrigin(null);
    e.stopPropagation();
  };

  const applyDragMove = (clientX: number, clientY: number) => {
    if (draggedPlayerId === null || !pitchRef.current) return;
    const pos = getRelativePosition(clientX, clientY, pitchRef.current);
    // Ref statt State lesen → immer aktuell, auch bei rapidfire mousemove
    const currentFrom = draggedFromRef.current;
    if (currentFrom === 'field') {
      setPlayers(prev => prev.map(p => p.id === draggedPlayerId ? { ...p, ...pos } : p));
    } else if (currentFrom === 'bench') {
      const benched = benchPlayers.find(p => p.id === draggedPlayerId);
      if (benched) {
        // Ref sofort auf 'field' setzen, bevor setState-Batches verarbeitet werden →
        // verhindert, dass nachfolgende Move-Events den Spieler nochmals hinzufügen
        draggedFromRef.current = 'field';
        setDraggedFrom('field');
        setDragOrigin(null);
        setBenchPlayers(prev => prev.filter(p => p.id !== draggedPlayerId));
        setPlayers(prev => [...prev, { ...benched, ...pos }]);
      }
    }
  };

  /**
   * Beim Loslassen:
   * - Field→Field: prüfe ob der gezogene Token auf einem anderen Feld-Token
   *   abgelegt wurde. Falls ja → Positionen tauschen statt überlappen.
   * - Bank→Feld: prüfe ob der Bank-Spieler auf einem Feld-Token abgelegt wurde.
   *   Falls ja → Feld-Spieler geht auf die Bank, Bank-Spieler übernimmt seine Position.
   */
  const finalizeDrop = () => {
    const currentFrom = draggedFromRef.current;
    if (draggedPlayerId !== null && currentFrom === 'field') {
      if (dragOrigin) {
        // Field-to-field: Positionen tauschen
        setPlayers(prev => {
          const dragged = prev.find(p => p.id === draggedPlayerId);
          if (!dragged) return prev;

          // Nächsten anderen Token in SWAP_THRESHOLD-Nähe suchen
          let nearest: PlayerData | null = null;
          let minDist = SWAP_THRESHOLD;
          for (const p of prev) {
            if (p.id === draggedPlayerId) continue;
            const d = Math.hypot(p.x - dragged.x, p.y - dragged.y);
            if (d < minDist) { minDist = d; nearest = p; }
          }

          if (!nearest) return prev; // kein Ziel → Token bleibt wo er ist

          // Swap: gezogener Token → Position des Ziel-Tokens, Ziel-Token → Ursprung
          const targetPos = { x: nearest.x, y: nearest.y };
          return prev.map(p => {
            if (p.id === draggedPlayerId) return { ...p, x: targetPos.x, y: targetPos.y };
            if (p.id === nearest!.id)     return { ...p, x: dragOrigin!.x, y: dragOrigin!.y };
            return p;
          });
        });
      } else {
        // Bank→Feld: verdränge Feldspieler auf die Bank
        setPlayers(prev => {
          const dragged = prev.find(p => p.id === draggedPlayerId);
          if (!dragged) return prev;

          let nearest: PlayerData | null = null;
          let minDist = SWAP_THRESHOLD;
          for (const p of prev) {
            if (p.id === draggedPlayerId) continue;
            const d = Math.hypot(p.x - dragged.x, p.y - dragged.y);
            if (d < minDist) { minDist = d; nearest = p; }
          }

          if (!nearest) return prev; // kein Ziel → Bank-Spieler bleibt wo er ist

          // Feldspieler geht auf die Bank, Bank-Spieler übernimmt seine Position
          const targetPos = { x: nearest.x, y: nearest.y };
          setBenchPlayers(b => [...b, { ...nearest! }]);
          return prev
            .filter(p => p.id !== nearest!.id)
            .map(p => p.id === draggedPlayerId ? { ...p, ...targetPos } : p);
        });
      }
    }

    setDraggedPlayerId(null);
    draggedFromRef.current = null;
    setDraggedFrom(null);
    setDragOrigin(null);
  };

  const handlePitchMouseMove = (e: React.MouseEvent) => applyDragMove(e.clientX, e.clientY);

  const handlePitchTouchMove = (e: React.TouchEvent) => {
    e.preventDefault();
    applyDragMove(e.touches[0].clientX, e.touches[0].clientY);
  };

  return {
    draggedPlayerId,
    startDragFromField,
    startDragFromBench,
    handlePitchMouseMove,
    handlePitchMouseUp: finalizeDrop,
    handlePitchTouchMove,
    handlePitchTouchEnd: finalizeDrop,
  };
}
