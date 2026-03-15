/**
 * Tests für useSquadDrop
 *
 * Prüft HTML5-Drag aus der Squad-Liste aufs Feld:
 * – Ablage auf Platzhalter (Koordinaten + Position-Label bleiben)
 * – Ablage auf echten Feldspieler (Verdrängung auf Bank)
 * – Ablage auf freie Fläche (Spieler wird dort eingefügt)
 * – Highlight-Logik während DragOver
 */
import { renderHook, act } from '@testing-library/react';
import { useRef, useState } from 'react';
import { useSquadDrop } from '../useSquadDrop';
import type { Player, PlayerData } from '../types';

// ─── Hilfsfunktionen ──────────────────────────────────────────────────────────

const placeholder = (id: number, x: number, y: number): PlayerData => ({
  id, x, y, number: id, name: 'PH', position: 'TW', playerId: null, isRealPlayer: false,
});

const fieldPlayer = (id: number, x: number, y: number, playerId: number): PlayerData => ({
  id, x, y, number: id, name: `Sp${id}`, playerId, isRealPlayer: true,
});

const squadPlayer = (id: number, name: string): Player => ({
  id, name, shirtNumber: id, position: 'ST', alternativePositions: [],
});

/**
 * Mock pitch element: Bounding box 0/0, 100×100px.
 * → getRelativePosition(clientX, clientY) = { x: clientX, y: clientY }
 */
const mockPitchEl = {
  getBoundingClientRect: () => ({ left: 0, top: 0, width: 100, height: 100 }),
} as unknown as HTMLDivElement;

const makeDragEvent = (clientX: number, clientY: number) =>
  ({
    preventDefault: jest.fn(),
    clientX, clientY,
    dataTransfer: { dropEffect: '' },
  } as unknown as React.DragEvent);

const setup = (initialPlayers: PlayerData[], initialBench: PlayerData[] = []) => {
  return renderHook(() => {
    const [players,  setPlayers]  = useState<PlayerData[]>(initialPlayers);
    const [bench,    setBench]    = useState<PlayerData[]>(initialBench);
    const [nextNum,  setNextNum]  = useState(99);
    const pitchRef = useRef<HTMLDivElement>(mockPitchEl);

    const drop = useSquadDrop({
      players, setPlayers,
      benchPlayers: bench, setBenchPlayers: setBench,
      nextPlayerNumber: nextNum, setNextPlayerNumber: setNextNum,
      pitchRef,
    });

    return { players, bench, ...drop };
  });
};

// ─── handleSquadDragStart / End ───────────────────────────────────────────────

describe('handleSquadDragStart / handleSquadDragEnd', () => {
  it('setzt squadDragPlayer beim Start', () => {
    const { result } = setup([]);
    const player = squadPlayer(1, 'Reus');
    act(() => { result.current.handleSquadDragStart(player); });
    expect(result.current.squadDragPlayer).toEqual(player);
  });

  it('löscht squadDragPlayer und highlightedTokenId beim End', () => {
    const { result } = setup([placeholder(1, 50, 50)]);
    act(() => { result.current.handleSquadDragStart(squadPlayer(1, 'Reus')); });
    act(() => { result.current.handleSquadDragEnd(); });
    expect(result.current.squadDragPlayer).toBeNull();
    expect(result.current.highlightedTokenId).toBeNull();
  });
});

// ─── handlePitchDragOver – Highlight ─────────────────────────────────────────

describe('handlePitchDragOver – highlightedTokenId', () => {
  it('setzt highlightedTokenId auf das nächstgelegene Token', () => {
    const { result } = setup([placeholder(1, 30, 30), placeholder(2, 70, 70)]);
    const player = squadPlayer(99, 'Reus');

    act(() => { result.current.handleSquadDragStart(player); });
    act(() => { result.current.handlePitchDragOver(makeDragEvent(32, 32)); }); // nahe Token 1

    expect(result.current.highlightedTokenId).toBe(1);
  });

  it('setzt highlightedTokenId auf null wenn kein Token in der Nähe', () => {
    const { result } = setup([placeholder(1, 10, 10)]);
    act(() => { result.current.handleSquadDragStart(squadPlayer(99, 'Reus')); });
    act(() => { result.current.handlePitchDragOver(makeDragEvent(80, 80)); }); // weit weg

    expect(result.current.highlightedTokenId).toBeNull();
  });
});

// ─── handlePitchDrop – Platzhalter ersetzen ───────────────────────────────────

describe('handlePitchDrop – auf Platzhalter', () => {
  it('ersetzt Platzhalter: Name/Nr/playerId aktualisiert, x/y bleibt, isRealPlayer=true', () => {
    const ph = placeholder(1, 40, 40);
    const { result } = setup([ph]);
    const sp = squadPlayer(10, 'Neuer');

    act(() => { result.current.handleSquadDragStart(sp); });
    act(() => { result.current.handlePitchDrop(makeDragEvent(40, 40)); });

    const slot = result.current.players.find(p => p.id === 1);
    expect(slot?.isRealPlayer).toBe(true);
    expect(slot?.name).toBe('Neuer');
    expect(slot?.playerId).toBe(10);
    expect(slot?.x).toBe(40); // Koordinaten unverändert
    expect(slot?.y).toBe(40);
  });

  it('löscht squadDragPlayer nach dem Drop', () => {
    const { result } = setup([placeholder(1, 30, 30)]);
    act(() => { result.current.handleSquadDragStart(squadPlayer(10, 'Neuer')); });
    act(() => { result.current.handlePitchDrop(makeDragEvent(30, 30)); });
    expect(result.current.squadDragPlayer).toBeNull();
  });
});

// ─── handlePitchDrop – echten Feldspieler verdrängen ─────────────────────────

describe('handlePitchDrop – auf echten Feldspieler', () => {
  it('Squad-Spieler belegt den Slot; verdrängter Feldspieler geht auf die Bank', () => {
    const fp = fieldPlayer(1, 20, 20, 5);
    const { result } = setup([fp]);
    const sp = squadPlayer(10, 'Reus');

    act(() => { result.current.handleSquadDragStart(sp); });
    act(() => { result.current.handlePitchDrop(makeDragEvent(20, 20)); });

    const onField = result.current.players.find(p => p.id === 1);
    expect(onField?.name).toBe('Reus');
    expect(onField?.playerId).toBe(10);
    expect(result.current.bench.some(p => p.id === 1)).toBe(true);
  });
});

// ─── handlePitchDrop – freie Fläche ──────────────────────────────────────────

describe('handlePitchDrop – freie Feldfläche', () => {
  it('fügt Spieler an den Drop-Koordinaten ein wenn kein Token in der Nähe', () => {
    const { result } = setup([placeholder(1, 10, 10)]); // weit weg vom Drop-Punkt
    const sp = squadPlayer(10, 'Reus');

    act(() => { result.current.handleSquadDragStart(sp); });
    act(() => { result.current.handlePitchDrop(makeDragEvent(90, 90)); });

    const newPlayer = result.current.players.find(p => p.playerId === 10);
    expect(newPlayer).toBeTruthy();
    expect(newPlayer?.x).toBeCloseTo(90, 0);
    expect(newPlayer?.y).toBeCloseTo(90, 0);
  });
});

// ─── Duplikat-Schutz ──────────────────────────────────────────────────────────

describe('handlePitchDrop – Duplikat-Schutz', () => {
  it('ignoriert Drop wenn Spieler bereits auf dem Feld', () => {
    const existingOnField = fieldPlayer(1, 50, 50, 10);
    const { result } = setup([existingOnField]);
    const sp = squadPlayer(10, 'Reus'); // gleiche playerId

    act(() => { result.current.handleSquadDragStart(sp); });
    act(() => { result.current.handlePitchDrop(makeDragEvent(20, 20)); });

    expect(result.current.players.filter(p => p.playerId === 10)).toHaveLength(1);
  });

  it('ignoriert Drop wenn Spieler bereits auf der Bank', () => {
    const bench = [{ id: 99, x: 0, y: 0, number: 10, name: 'Reus', playerId: 10, isRealPlayer: true as const }];
    const { result } = setup([placeholder(1, 50, 50)], bench);
    const sp = squadPlayer(10, 'Reus');

    act(() => { result.current.handleSquadDragStart(sp); });
    act(() => { result.current.handlePitchDrop(makeDragEvent(50, 50)); });

    expect(result.current.players.filter(p => p.playerId === 10)).toHaveLength(0);
  });
});
