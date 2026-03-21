/**
 * Unit-Tests für reportHelpers.ts
 *
 * needsContext:
 *  – gibt { needsPlayer: false, needsTeam: false } für undefined/null/leer zurück
 *  – erkennt player-Dimension via xField
 *  – erkennt team-Dimension via xField
 *  – erkennt player-Dimension via groupBy (Array)
 *  – erkennt team-Dimension via groupBy (Array)
 *  – erkennt player/team-Dimension via groupBy (einzelner String, nicht Array)
 *  – beides true wenn beides gesetzt
 *  – ignoriert andere xField/groupBy-Werte
 */

import { needsContext } from '../reportHelpers';

describe('needsContext', () => {
  // ──────────────────────────────────────────────────────────────────────────
  //  Leere / fehlende Konfigurationen
  // ──────────────────────────────────────────────────────────────────────────

  it('gibt { needsPlayer: false, needsTeam: false } zurück wenn config undefined', () => {
    expect(needsContext(undefined)).toEqual({ needsPlayer: false, needsTeam: false });
  });

  it('gibt { needsPlayer: false, needsTeam: false } zurück wenn config null', () => {
    expect(needsContext(null)).toEqual({ needsPlayer: false, needsTeam: false });
  });

  it('gibt { needsPlayer: false, needsTeam: false } zurück bei leerer config', () => {
    expect(needsContext({})).toEqual({ needsPlayer: false, needsTeam: false });
  });

  // ──────────────────────────────────────────────────────────────────────────
  //  xField
  // ──────────────────────────────────────────────────────────────────────────

  it('setzt needsPlayer: true wenn xField === "player"', () => {
    const result = needsContext({ xField: 'player' });
    expect(result.needsPlayer).toBe(true);
    expect(result.needsTeam).toBe(false);
  });

  it('setzt needsTeam: true wenn xField === "team"', () => {
    const result = needsContext({ xField: 'team' });
    expect(result.needsTeam).toBe(true);
    expect(result.needsPlayer).toBe(false);
  });

  it('setzt needsPlayer/needsTeam: false bei beliebigem anderen xField', () => {
    expect(needsContext({ xField: 'matchday' })).toEqual({ needsPlayer: false, needsTeam: false });
    expect(needsContext({ xField: 'date' })).toEqual({ needsPlayer: false, needsTeam: false });
  });

  // ──────────────────────────────────────────────────────────────────────────
  //  groupBy als Array
  // ──────────────────────────────────────────────────────────────────────────

  it('setzt needsPlayer: true wenn groupBy-Array "player" enthält', () => {
    const result = needsContext({ groupBy: ['player'] });
    expect(result.needsPlayer).toBe(true);
    expect(result.needsTeam).toBe(false);
  });

  it('setzt needsTeam: true wenn groupBy-Array "team" enthält', () => {
    const result = needsContext({ groupBy: ['team'] });
    expect(result.needsTeam).toBe(true);
    expect(result.needsPlayer).toBe(false);
  });

  it('setzt needsPlayer: true wenn "player" eines von mehreren groupBy-Elementen ist', () => {
    expect(needsContext({ groupBy: ['matchday', 'player', 'position'] }).needsPlayer).toBe(true);
  });

  it('setzt needsTeam: true wenn "team" eines von mehreren groupBy-Elementen ist', () => {
    expect(needsContext({ groupBy: ['team', 'matchday'] }).needsTeam).toBe(true);
  });

  it('setzt beide false wenn groupBy-Array keine player/team-Werte enthält', () => {
    expect(needsContext({ groupBy: ['matchday', 'position'] })).toEqual({
      needsPlayer: false,
      needsTeam: false,
    });
  });

  // ──────────────────────────────────────────────────────────────────────────
  //  groupBy als einzelner String (nicht-Array, Legacy-Format)
  // ──────────────────────────────────────────────────────────────────────────

  it('setzt needsPlayer: true wenn groupBy ein einzelner String "player" ist', () => {
    const result = needsContext({ groupBy: 'player' });
    expect(result.needsPlayer).toBe(true);
  });

  it('setzt needsTeam: true wenn groupBy ein einzelner String "team" ist', () => {
    const result = needsContext({ groupBy: 'team' });
    expect(result.needsTeam).toBe(true);
  });

  it('setzt beide false wenn groupBy ein anderer einzelner String ist', () => {
    expect(needsContext({ groupBy: 'matchday' })).toEqual({ needsPlayer: false, needsTeam: false });
  });

  // ──────────────────────────────────────────────────────────────────────────
  //  Kombination: sowohl player als auch team
  // ──────────────────────────────────────────────────────────────────────────

  it('setzt beide true wenn xField "player" und groupBy "team" ist', () => {
    const result = needsContext({ xField: 'player', groupBy: ['team'] });
    expect(result.needsPlayer).toBe(true);
    expect(result.needsTeam).toBe(true);
  });

  it('setzt beide true wenn groupBy beide enthält', () => {
    const result = needsContext({ groupBy: ['player', 'team', 'matchday'] });
    expect(result.needsPlayer).toBe(true);
    expect(result.needsTeam).toBe(true);
  });

  // ──────────────────────────────────────────────────────────────────────────
  //  xField hat Vorrang: groupBy und xField kombiniert
  // ──────────────────────────────────────────────────────────────────────────

  it('erkennt player aus xField auch wenn groupBy leer ist', () => {
    const result = needsContext({ xField: 'player', groupBy: [] });
    expect(result.needsPlayer).toBe(true);
    expect(result.needsTeam).toBe(false);
  });

  it('erkennt team aus xField auch wenn groupBy undefined', () => {
    const result = needsContext({ xField: 'team', groupBy: undefined });
    expect(result.needsTeam).toBe(true);
    expect(result.needsPlayer).toBe(false);
  });
});
