/**
 * Tests für formation/helpers.ts
 *
 * Prüft die reine Funktion positionCategory() und getZoneColor().
 */
import { getZoneColor, positionCategory } from '../helpers';

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
