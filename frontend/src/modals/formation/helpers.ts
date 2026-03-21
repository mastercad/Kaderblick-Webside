// ─── Zone color based on y-position on the half-pitch ─────────────────────────
// Portrait half-pitch: y=0 TOP = centre line (attackers), y=100 BOTTOM = own goal
export function getZoneColor(y: number): string {
  if (y > 78) return '#f59e0b'; // TW zone  – amber
  if (y > 55) return '#3b82f6'; // Defence  – blue
  if (y > 30) return '#22c55e'; // Midfield – green
  return       '#ef4444';       // Attack   – red
}

/**
 * Color based on the player's *position abbreviation* (e.g. 'TW', 'IV', 'ZM', 'ST').
 * Uses the same palette as getZoneColor so that drag previews match the final token color.
 * Falls back to grey for unknown/null positions.
 */
export function getPositionColor(position: string | null | undefined): string {
  const cat = positionCategory(position);
  if (cat === 'GK')  return '#f59e0b';
  if (cat === 'DEF') return '#3b82f6';
  if (cat === 'MID') return '#22c55e';
  if (cat === 'FWD') return '#ef4444';
  return '#6b7280'; // grey – unbekannte Position
}
// ─── Position category mapping ────────────────────────────────────────────────────────
export type PosCategory = 'GK' | 'DEF' | 'MID' | 'FWD';

// German shortName abbreviations
const GK_CODES  = ['TW'];
const DEF_CODES = ['IV', 'LV', 'RV', 'LIV', 'RIV', 'LVB', 'RVB', 'DV', 'AV', 'LAV', 'RAV'];
const MID_CODES = ['ZM', 'DM', 'ZOM', 'OM', 'AM', 'LM', 'RM', 'LF', 'RF', 'VOM', 'DMF', 'ZMF', 'LAM', 'RAM', 'CM', 'CDM', 'CAM'];
const FWD_CODES = ['ST', 'LA', 'RA', 'LS', 'RS', 'OA', 'MS', 'ZST', 'LFA', 'RFA', 'SS', 'CF', 'LW', 'RW'];

// German full-name fallbacks (for positions without shortName in DB)
const GK_NAMES  = ['torwart', 'goalkeeper', 'keeper'];
const DEF_NAMES = ['innenverteidiger', 'linker verteidiger', 'rechter verteidiger',
                   'verteidiger', 'abwehr', 'außenverteidiger', 'linksverteidiger', 'rechtsverteidiger',
                   'libero', 'vorstopper', 'stopper'];
const MID_NAMES = ['mittelfeldspieler', 'zentrales mittelfeld', 'defensives mittelfeld',
                   'offensives mittelfeld', 'linkes mittelfeld', 'rechtes mittelfeld',
                   'mittelfeld', 'flügel', 'flügelspieler', 'hängende spitze'];
const FWD_NAMES = ['stürmer', 'mittelstürmer', 'linksaußen', 'rechtsaußen',
                   'angriff', 'angreifer', 'zweite spitze', 'sturmspitze'];

/** Maps a German football position abbreviation or full name (case-insensitive) to a broad role category. */
export function positionCategory(pos: string | null | undefined): PosCategory | null {
  if (!pos) return null;
  const p = pos.toUpperCase().trim();
  // Check shortName codes first (fast exact match)
  if (GK_CODES.includes(p))  return 'GK';
  if (DEF_CODES.includes(p)) return 'DEF';
  if (MID_CODES.includes(p)) return 'MID';
  if (FWD_CODES.includes(p)) return 'FWD';
  // Fall back to full-name substring match (for positions without shortName)
  const pl = pos.toLowerCase().trim();
  if (GK_NAMES.some(n  => pl.includes(n))) return 'GK';
  if (DEF_NAMES.some(n => pl.includes(n))) return 'DEF';
  if (MID_NAMES.some(n => pl.includes(n))) return 'MID';
  if (FWD_NAMES.some(n => pl.includes(n))) return 'FWD';
  return null;
}
/** Truncate a player name to fit in a token label */
export function truncateName(name: string, maxLen = 7): string {
  if (name.length <= maxLen) return name;
  return name.slice(0, maxLen - 1) + '…';
}

/** Find a free grid position on the portrait pitch that doesn't overlap existing players */
export function findFreePosition(
  occupied: Array<{ x: number; y: number }>,
): { x: number; y: number } {
  // Portrait: x = lateral (10–88), y = depth (12–82)
  for (let row = 0; row < 5; row++) {
    for (let col = 0; col < 4; col++) {
      const x = 14 + col * 24; // spread across field width
      const y = 14 + row * 16; // spread down field depth
      if (!occupied.some(p => Math.abs(p.x - x) < 8 && Math.abs(p.y - y) < 8)) {
        return { x, y };
      }
    }
  }
  return { x: 15 + Math.random() * 70, y: 10 + Math.random() * 75 };
}

/** Extract x/y from a client pointer event relative to an element */
export function getRelativePosition(
  clientX: number,
  clientY: number,
  el: HTMLElement,
): { x: number; y: number } {
  const rect = el.getBoundingClientRect();
  return {
    x: Math.max(2, Math.min(98, ((clientX - rect.left) / rect.width) * 100)),
    y: Math.max(2, Math.min(98, ((clientY - rect.top) / rect.height) * 100)),
  };
}
