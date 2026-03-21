/**
 * Tests für formation/helpers.ts
 *
 * Prüft die reine Funktion positionCategory() und getZoneColor().
 */
import { getZoneColor, getPositionColor, positionCategory } from '../helpers';

// ─── positionCategory ─────────────────────────────────────────────────────────

describe('positionCategory', () => {
  // ── Nullfälle ─────────────────────────────────────────────────────────────
  it('returns null for null', ()      => expect(positionCategory(null)).toBeNull());
  it('returns null for undefined', () => expect(positionCategory(undefined)).toBeNull());
  it('returns null for empty string', () => expect(positionCategory('')).toBeNull());
  it('returns null for unknown code', () => expect(positionCategory('XY')).toBeNull());

  // ── GK – Kürzel ───────────────────────────────────────────────────────────
  it('TW → GK',           () => expect(positionCategory('TW')).toBe('GK'));
  it('tw (lowercase) → GK', () => expect(positionCategory('tw')).toBe('GK'));

  // ── DEF – Kürzel ──────────────────────────────────────────────────────────
  it('IV  → DEF', () => expect(positionCategory('IV')).toBe('DEF'));
  it('LV  → DEF', () => expect(positionCategory('LV')).toBe('DEF'));
  it('RV  → DEF', () => expect(positionCategory('RV')).toBe('DEF'));
  it('LIV → DEF', () => expect(positionCategory('LIV')).toBe('DEF'));
  it('RIV → DEF', () => expect(positionCategory('RIV')).toBe('DEF'));
  it('DV  → DEF', () => expect(positionCategory('DV')).toBe('DEF'));
  it('AV  → DEF', () => expect(positionCategory('AV')).toBe('DEF'));

  // ── MID – Kürzel ──────────────────────────────────────────────────────────
  it('ZM  → MID', () => expect(positionCategory('ZM')).toBe('MID'));
  it('DM  → MID', () => expect(positionCategory('DM')).toBe('MID'));
  it('OM  → MID', () => expect(positionCategory('OM')).toBe('MID'));
  it('LM  → MID', () => expect(positionCategory('LM')).toBe('MID'));
  it('RM  → MID', () => expect(positionCategory('RM')).toBe('MID'));
  it('AM  → MID', () => expect(positionCategory('AM')).toBe('MID'));
  it('CDM → MID', () => expect(positionCategory('CDM')).toBe('MID'));
  it('CAM → MID', () => expect(positionCategory('CAM')).toBe('MID'));

  // ── FWD – Kürzel ──────────────────────────────────────────────────────────
  it('ST  → FWD', () => expect(positionCategory('ST')).toBe('FWD'));
  it('LA  → FWD', () => expect(positionCategory('LA')).toBe('FWD'));
  it('RA  → FWD', () => expect(positionCategory('RA')).toBe('FWD'));
  it('CF  → FWD', () => expect(positionCategory('CF')).toBe('FWD'));
  it('LW  → FWD', () => expect(positionCategory('LW')).toBe('FWD'));
  it('RW  → FWD', () => expect(positionCategory('RW')).toBe('FWD'));

  // ── Volltextnamen (Fallback wenn shortName nicht gepflegt) ────────────────
  it('"Torwart" → GK',               () => expect(positionCategory('Torwart')).toBe('GK'));
  it('"goalkeeper" → GK',            () => expect(positionCategory('goalkeeper')).toBe('GK'));
  it('"Innenverteidiger" → DEF',     () => expect(positionCategory('Innenverteidiger')).toBe('DEF'));
  it('"Rechtsverteidiger" → DEF',    () => expect(positionCategory('Rechtsverteidiger')).toBe('DEF'));
  it('"Linksverteidiger" → DEF',     () => expect(positionCategory('Linksverteidiger')).toBe('DEF'));
  it('"Defensives Mittelfeld" → MID', () => expect(positionCategory('Defensives Mittelfeld')).toBe('MID'));
  it('"Zentrales Mittelfeld" → MID', () => expect(positionCategory('Zentrales Mittelfeld')).toBe('MID'));
  it('"Stürmer" → FWD',              () => expect(positionCategory('Stürmer')).toBe('FWD'));
  it('"Linksaußen" → FWD',           () => expect(positionCategory('Linksaußen')).toBe('FWD'));
  it('"Rechtsaußen" → FWD',          () => expect(positionCategory('Rechtsaußen')).toBe('FWD'));
  it('"Mittelstürmer" → FWD',        () => expect(positionCategory('Mittelstürmer')).toBe('FWD'));

  // ── Kein Treffer bei unbekannten Werten ───────────────────────────────────
  it('"Unbekannt" → null',  () => expect(positionCategory('Unbekannt')).toBeNull());
  it('"99" → null',         () => expect(positionCategory('99')).toBeNull());
});

// ─── getZoneColor ─────────────────────────────────────────────────────────────

describe('getZoneColor', () => {
  it('y > 78 → TW-Zone (amber)',    () => expect(getZoneColor(85)).toBe('#f59e0b'));
  it('y = 79 → TW-Zone (amber)',    () => expect(getZoneColor(79)).toBe('#f59e0b'));
  it('y = 78 → Defense-Zone (blue)',() => expect(getZoneColor(78)).toBe('#3b82f6'));
  it('y > 55 → Defense-Zone (blue)',() => expect(getZoneColor(60)).toBe('#3b82f6'));
  it('y = 55 → Midfield-Zone (green)',() => expect(getZoneColor(55)).toBe('#22c55e'));
  it('y > 30 → Midfield-Zone (green)',() => expect(getZoneColor(40)).toBe('#22c55e'));
  it('y = 30 → Attack-Zone (red)',  () => expect(getZoneColor(30)).toBe('#ef4444'));
  it('y = 0  → Attack-Zone (red)',  () => expect(getZoneColor(0)).toBe('#ef4444'));
});

// ─── getPositionColor ─────────────────────────────────────────────────────────

describe('getPositionColor', () => {
  // ── null / undefined / unbekannt → grau ──────────────────────────────────
  it('null → grau',      () => expect(getPositionColor(null)).toBe('#6b7280'));
  it('undefined → grau', () => expect(getPositionColor(undefined)).toBe('#6b7280'));
  it('"XY" → grau',      () => expect(getPositionColor('XY')).toBe('#6b7280'));

  // ── Torwart → amber (dieselbe Farbe wie TW-Zone in getZoneColor) ─────────
  it('TW → amber (#f59e0b)',        () => expect(getPositionColor('TW')).toBe('#f59e0b'));
  it('"Torwart" → amber',           () => expect(getPositionColor('Torwart')).toBe('#f59e0b'));
  it('"goalkeeper" → amber',        () => expect(getPositionColor('goalkeeper')).toBe('#f59e0b'));

  // ── Abwehr → blau ─────────────────────────────────────────────────────────
  it('IV → blau (#3b82f6)',         () => expect(getPositionColor('IV')).toBe('#3b82f6'));
  it('LV → blau',                   () => expect(getPositionColor('LV')).toBe('#3b82f6'));
  it('RV → blau',                   () => expect(getPositionColor('RV')).toBe('#3b82f6'));
  it('"Innenverteidiger" → blau',   () => expect(getPositionColor('Innenverteidiger')).toBe('#3b82f6'));
  it('"Linksverteidiger" → blau',   () => expect(getPositionColor('Linksverteidiger')).toBe('#3b82f6'));

  // ── Mittelfeld → grün ─────────────────────────────────────────────────────
  it('ZM → grün (#22c55e)',         () => expect(getPositionColor('ZM')).toBe('#22c55e'));
  it('DM → grün',                   () => expect(getPositionColor('DM')).toBe('#22c55e'));
  it('OM → grün',                   () => expect(getPositionColor('OM')).toBe('#22c55e'));
  it('"Zentrales Mittelfeld" → grün', () => expect(getPositionColor('Zentrales Mittelfeld')).toBe('#22c55e'));

  // ── Angriff → rot ─────────────────────────────────────────────────────────
  it('ST → rot (#ef4444)',          () => expect(getPositionColor('ST')).toBe('#ef4444'));
  it('LA → rot',                    () => expect(getPositionColor('LA')).toBe('#ef4444'));
  it('RA → rot',                    () => expect(getPositionColor('RA')).toBe('#ef4444'));
  it('CF → rot',                    () => expect(getPositionColor('CF')).toBe('#ef4444'));
  it('"Stürmer" → rot',             () => expect(getPositionColor('Stürmer')).toBe('#ef4444'));
  it('"Linksaußen" → rot',          () => expect(getPositionColor('Linksaußen')).toBe('#ef4444'));

  // ── Konsistenz: Farben stimmen mit getZoneColor-Palette überein ───────────
  it('GK-Farbe entspricht TW-Zone (y=90)',  () => expect(getPositionColor('TW')).toBe(getZoneColor(90)));
  it('DEF-Farbe entspricht DEF-Zone (y=65)', () => expect(getPositionColor('IV')).toBe(getZoneColor(65)));
  it('MID-Farbe entspricht MID-Zone (y=45)', () => expect(getPositionColor('ZM')).toBe(getZoneColor(45)));
  it('FWD-Farbe entspricht ATK-Zone (y=15)', () => expect(getPositionColor('ST')).toBe(getZoneColor(15)));
});
