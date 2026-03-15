/**
 * Built-in tactic presets.
 *
 * These presets are always available offline, without an API call.
 * They mirror the system presets seeded via TacticPresetFixtures.php.
 *
 * Coordinate system  (SVG viewBox 0 0 100 100):
 *   x = 0   → opponent goal (left)       x = 100 → own goal (right)
 *   y = 0   → top                         y = 100 → bottom
 *   Own team: right half (x 50-100)
 *
 * DrawElement 'arrow' = tactical pass / pressing arrow (solid arrowhead)
 * DrawElement 'run'   = player run / movement arrow    (dashed line)
 * DrawElement 'zone'  = highlighted pitch area          (filled circle)
 */

import type { TacticPreset } from './types';

// ---------------------------------------------------------------------------
// Color tokens
// ---------------------------------------------------------------------------
const RED    = '#ef4444';   // pressing / danger
const YELLOW = '#facc15';   // pass / tactical instruction
const GREEN  = '#22c55e';   // run / counter
const BLUE   = '#3b82f6';   // defensive block / zone / build-up

// ---------------------------------------------------------------------------
// Helpers to build typed DrawElements
// ---------------------------------------------------------------------------

function arrow(id: string, x1: number, y1: number, x2: number, y2: number, color = YELLOW) {
  return { id, kind: 'arrow' as const, x1, y1, x2, y2, color };
}

function run(id: string, x1: number, y1: number, x2: number, y2: number, color = GREEN) {
  return { id, kind: 'run' as const, x1, y1, x2, y2, color };
}

function zone(id: string, cx: number, cy: number, r: number, color = RED) {
  return { id, kind: 'zone' as const, cx, cy, r, color };
}

function opp(id: string, x: number, y: number, number = 0) {
  return { id, x, y, number };
}

// ---------------------------------------------------------------------------
// Built-in presets
// ---------------------------------------------------------------------------

export const BUILTIN_PRESETS: TacticPreset[] = [
  // ── 1 ── Gegenpressing (4-3-3) ───────────────────────────────────────────
  {
    id: 'builtin-gegenpressing',
    title: 'Gegenpressing (4-3-3)',
    category: 'Pressing',
    description: 'Sofortiges Pressing nach Ballverlust. Stürmer schließen Pässe ab, Mittelfeldlinie schiebt hoch, Pressfalle im gegnerischen Aufbau.',
    isSystem: true,
    canDelete: false,
    data: {
      name: 'Gegenpressing (4-3-3)',
      elements: [
        arrow('a1', 57, 50, 32, 50, RED),      // ST presst Ballführenden
        arrow('a2', 60, 18, 34, 24, RED),      // LW schließt Passlinie oben
        arrow('a3', 60, 82, 34, 76, RED),      // RW schließt Passlinie unten
        run  ('a4', 70, 32, 54, 40, YELLOW),   // CM-L sichert Halbraum
        run  ('a5', 70, 68, 54, 60, YELLOW),   // CM-R sichert Halbraum
        zone ('z1', 38, 50, 14, RED),          // Pressfalle-Zone
      ],
      opponents: [
        opp('o1', 38, 50, 6),   // Ballführender
        opp('o2', 32, 22, 3),
        opp('o3', 30, 78, 7),
      ],
    },
  },

  // ── 2 ── Schneller Konter ────────────────────────────────────────────────
  {
    id: 'builtin-konter',
    title: 'Schneller Konter',
    category: 'Angriff',
    description: 'Nach Ballgewinn sofort in die Tiefe. Außenstürmer sprinten auf die Lücken, Mittelstürmer läuft hinter die Linie.',
    isSystem: true,
    canDelete: false,
    data: {
      name: 'Schneller Konter',
      elements: [
        run  ('a1', 72, 15, 12, 20, GREEN),    // LW-Sprint (oben)
        run  ('a2', 72, 50, 12, 50, GREEN),    // ST-Sprint (mitte)
        run  ('a3', 72, 85, 12, 80, GREEN),    // RW-Sprint (unten)
        arrow('a4', 70, 50, 18, 42, YELLOW),   // Steilpass
        zone ('z1', 12, 50, 14, GREEN),        // Abschlusszone
      ],
      opponents: [
        opp('o1', 50, 38, 4),
        opp('o2', 50, 62, 5),
        opp('o3', 40, 50, 6),
        opp('o4', 35, 28, 2),
        opp('o5', 35, 72, 3),
      ],
    },
  },

  // ── 3 ── Eckball kurz ────────────────────────────────────────────────────
  {
    id: 'builtin-eckball-kurz',
    title: 'Eckball kurz',
    category: 'Standards',
    description: 'Kurze Ecke zur Überzahl am Eckpunkt, dann Kombination und Flanke in den gefährlichen Raum.',
    isSystem: true,
    canDelete: false,
    data: {
      name: 'Eckball kurz',
      elements: [
        arrow('a1',  5,  4, 14, 10, YELLOW),   // Kurzer Anspiel
        run  ('a2', 18, 18, 14, 10, YELLOW),   // Anläufer kommt
        arrow('a3', 14, 10,  5, 22, YELLOW),   // Zweite Kombination
        arrow('a4',  5, 22, 12, 46, YELLOW),   // Flanke in den Strafraum
        run  ('a5', 22, 60,  6, 42, GREEN),    // Vorderpfosten-Lauf
        run  ('a6', 24, 72,  9, 54, GREEN),    // Hinterpfosten nachrücken
        zone ('z1',  8, 50, 12, RED),          // Gefahrenzone
      ],
      opponents: [],
    },
  },

  // ── 4 ── Freistoß Flanke ─────────────────────────────────────────────────
  {
    id: 'builtin-freistoss-flanke',
    title: 'Freistoß Flanke',
    category: 'Standards',
    description: 'Gestaffelte Raumläufe bei Flanke vom halbrechten Freistoß: Vorderpfosten, Elfmeter und Hinterpfosten.',
    isSystem: true,
    canDelete: false,
    data: {
      name: 'Freistoß Flanke',
      elements: [
        arrow('a1', 28, 14,  7, 46, YELLOW),   // Flanke
        run  ('a2', 22, 58,  6, 40, GREEN),    // Vorderpfosten-Lauf
        run  ('a3', 22, 50,  8, 50, GREEN),    // Elfmeter-Lauf
        run  ('a4', 24, 68,  7, 56, GREEN),    // Hinterpfosten-Lauf
        zone ('z1',  7, 48, 12, RED),          // Zielzone
      ],
      opponents: [
        opp('o1', 22, 44, 0),  // Mauer
        opp('o2', 22, 40, 0),
        opp('o3', 22, 48, 0),
        opp('o4', 22, 52, 0),
      ],
    },
  },

  // ── 5 ── Spielaufbau Dreieck ─────────────────────────────────────────────
  {
    id: 'builtin-spielaufbau-dreieck',
    title: 'Spielaufbau Dreieck',
    category: 'Spielaufbau',
    description: 'Strukturierter Aufbau über Dreieck IV–Sechser–Außenverteidiger mit anschließendem Steilpass in den Halbraum.',
    isSystem: true,
    canDelete: false,
    data: {
      name: 'Spielaufbau Dreieck',
      elements: [
        arrow('a1', 83, 38, 72, 20, YELLOW),   // IV → LB
        arrow('a2', 72, 20, 62, 36, YELLOW),   // LB → DM (Dreieck)
        arrow('a3', 62, 36, 50, 44, YELLOW),   // DM → Angreifer
        arrow('a4', 50, 44, 54, 32, YELLOW),   // Ablage
        run  ('a5', 68, 46, 52, 34, GREEN),    // Einlauf AM
        zone ('z1', 65, 32, 10, BLUE),         // Dreieck-Zone
      ],
      opponents: [
        opp('o1', 45, 50, 9),
        opp('o2', 42, 38, 8),
        opp('o3', 42, 62, 10),
      ],
    },
  },

  // ── 6 ── 4-4-2 Mittelfeldblock ───────────────────────────────────────────
  {
    id: 'builtin-mittelfeldblock',
    title: '4-4-2 Mittelfeldblock',
    category: 'Defensive',
    description: 'Kompakter 4-4-2 Mittelfeldblock. Außen rücken ein, Stürmer schließen Halbräume, enge Abstände zwischen den Linien.',
    isSystem: true,
    canDelete: false,
    data: {
      name: '4-4-2 Mittelfeldblock',
      elements: [
        run  ('a1', 68, 18, 54, 30, YELLOW),   // LM rückt ein
        run  ('a2', 68, 82, 54, 70, YELLOW),   // RM rückt ein
        arrow('a3', 58, 38, 46, 38, RED),      // ST-L läuft an
        arrow('a4', 58, 62, 46, 62, RED),      // ST-R läuft an
        run  ('a5', 68, 50, 52, 50, YELLOW),   // CM verdichtet
        zone ('z1', 57, 50, 18, BLUE),         // Kompaktblock
        zone ('z2', 48, 22,  8, RED),          // Flügelkorridor
        zone ('z3', 48, 78,  8, RED),          // Flügelkorridor
      ],
      opponents: [
        opp('o1', 42, 50, 10),
        opp('o2', 40, 30,  7),
        opp('o3', 40, 70, 11),
        opp('o4', 30, 22,  2),
        opp('o5', 30, 78,  3),
      ],
    },
  },
];

/** Category → display label mapping (for UI chips). */
export const CATEGORY_LABELS: Record<string, string> = {
  Pressing:    'Pressing',
  Angriff:     'Angriff',
  Standards:   'Standards',
  Spielaufbau: 'Spielaufbau',
  Defensive:   'Defensive',
};
