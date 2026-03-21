// ─── TacticsBoard – constants ──────────────────────────────────────────────────

// Die ersten 4 Farben entsprechen exakt den Spieler-Token-Farben aus getZoneColor()
// (formation/helpers.ts), damit Pfeile und Zonen visuell mit der Aufstellung matchen.
export const PALETTE: { label: string; value: string }[] = [
  { label: 'Rot (Angriff)',    value: '#ef4444' }, // getZoneColor: Attack
  { label: 'Grün (Mittelfeld)', value: '#22c55e' }, // getZoneColor: Midfield
  { label: 'Blau (Abwehr)',    value: '#3b82f6' }, // getZoneColor: Defence
  { label: 'Orange (TW)',      value: '#f59e0b' }, // getZoneColor: TW zone
  { label: 'Weiß',             value: '#ffffff' }, // freie Markierungen
  { label: 'Gelb',             value: '#ffd600' }, // freie Markierungen
];

/**
 * Portrait-mode SVG circle compensation factor:
 *   rx = ry * AX  renders a visually round circle in a 105×68 (DIN A4-style) viewport.
 * Not used in landscape modes; see pitchAX inside useTacticsBoard.
 */
export const AX = 105 / 68; // ≈ 1.544
