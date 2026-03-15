// ─── TacticsBoard – constants ──────────────────────────────────────────────────

export const PALETTE: { label: string; value: string }[] = [
  { label: 'Weiß',   value: '#ffffff' },
  { label: 'Gelb',   value: '#ffd600' },
  { label: 'Rot',    value: '#f44336' },
  { label: 'Cyan',   value: '#00e5ff' },
  { label: 'Orange', value: '#ff9100' },
  { label: 'Grün',   value: '#69f0ae' },
];

/**
 * Portrait-mode SVG circle compensation factor:
 *   rx = ry * AX  renders a visually round circle in a 105×68 (DIN A4-style) viewport.
 * Not used in landscape modes; see pitchAX inside useTacticsBoard.
 */
export const AX = 105 / 68; // ≈ 1.544
