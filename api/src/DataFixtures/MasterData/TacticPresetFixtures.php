<?php

namespace App\DataFixtures\MasterData;

use App\Entity\TacticPreset;
use App\Repository\TacticPresetRepository;
use Doctrine\Bundle\FixturesBundle\Fixture;
use Doctrine\Bundle\FixturesBundle\FixtureGroupInterface;
use Doctrine\Persistence\ObjectManager;

/**
 * Seeds the built-in (system) tactic presets.
 *
 * Each preset is idempotent via TacticPresetRepository::upsert() –
 * safe to run multiple times.
 *
 * Coordinate system:
 *   SVG viewBox 0 0 100 100
 *   x = 0  → opponent goal (left)     x = 100 → own goal (right)
 *   y = 0  → top                      y = 100 → bottom
 *   Own team occupies right half (x 50-100).
 */
class TacticPresetFixtures extends Fixture implements FixtureGroupInterface
{
    public function __construct(
        private readonly TacticPresetRepository $repository
    ) {
    }

    public static function getGroups(): array
    {
        return ['master'];
    }

    public function load(ObjectManager $manager): void
    {
        foreach ($this->buildPresets() as $definition) {
            $preset = new TacticPreset();
            $preset->setTitle($definition['title']);
            $preset->setCategory($definition['category']);
            $preset->setDescription($definition['description']);
            $preset->setIsSystem(true);
            $preset->setData($definition['data']);

            $this->repository->upsert($preset);
        }

        $manager->flush();
    }

    // -----------------------------------------------------------------
    // Preset definitions
    // -----------------------------------------------------------------

    /**
     * @return array<int, array{title: string, category: string, description: string, data: array<string, mixed>}>
     */
    private function buildPresets(): array
    {
        return [
            $this->presetGegenpressing(),
            $this->presetSchnellerKonter(),
            $this->presetEckballKurz(),
            $this->presetFreistossFlank(),
            $this->presetSpielaufbauDreieck(),
            $this->presetMittelfeldblock(),
        ];
    }

    // ------------------------------------------------------------------
    // Helper: create DrawElement arrays matching the frontend type definitions
    //
    // TacticEntry shape:
    //   { name, elements: DrawElement[], opponents: OpponentToken[] }
    //
    // DrawElement = FieldArrow | FieldZone
    //   FieldArrow: { id, kind: 'arrow'|'run', x1, y1, x2, y2, color }
    //   FieldZone:  { id, kind: 'zone',         cx, cy, r,  color }
    //
    // OpponentToken: { id, x, y, number }
    //
    // Coordinate system:
    //   x = 0  → opponent goal (left)    x = 100 → own goal (right)
    //   y = 0  → top                     y = 100 → bottom
    // ------------------------------------------------------------------

    /** Pressing / tactical arrow (drawn with arrowhead). */
    /** @return array<string, mixed> */
    private function arrow(
        string $id,
        float $x1,
        float $y1,
        float $x2,
        float $y2,
        string $color = '#facc15'
    ): array {
        return [
            'id' => $id,
            'kind' => 'arrow',
            'x1' => $x1, 'y1' => $y1,
            'x2' => $x2, 'y2' => $y2,
            'color' => $color,
        ];
    }

    /** Run / movement arrow (dashed style). */
    /** @return array<string, mixed> */
    private function run(
        string $id,
        float $x1,
        float $y1,
        float $x2,
        float $y2,
        string $color = '#22c55e'
    ): array {
        return [
            'id' => $id,
            'kind' => 'run',
            'x1' => $x1, 'y1' => $y1,
            'x2' => $x2, 'y2' => $y2,
            'color' => $color,
        ];
    }

    /** Highlighted pitch zone. */
    /** @return array<string, mixed> */
    private function zone(
        string $id,
        float $cx,
        float $cy,
        float $r,
        string $color = '#ef4444'
    ): array {
        return [
            'id' => $id,
            'kind' => 'zone',
            'cx' => $cx,
            'cy' => $cy,
            'r' => $r,
            'color' => $color,
        ];
    }

    /** @return array<string, mixed> */
    private function opponent(string $id, float $x, float $y, int $number = 0): array
    {
        return ['id' => $id, 'x' => $x, 'y' => $y, 'number' => $number];
    }

    // -----------------------------------------------------------------
    // Preset 1 – Gegenpressing (4-3-3)
    // -----------------------------------------------------------------

    /** @return array<string, mixed> */
    private function presetGegenpressing(): array
    {
        return [
            'title' => 'Gegenpressing (4-3-3)',
            'category' => TacticPreset::CATEGORY_PRESSING,
            'description' => 'Sofortiges Pressing nach Ballverlust. Stürmer schließen Pässe ab, Mittelfeldlinie schiebt hoch, Pressfalle im gegnerischen Aufbau.',
            'data' => [
                'name' => 'Gegenpressing (4-3-3)',
                'elements' => [
                    // Stürmer presst Ballführenden
                    $this->arrow('a1', 57, 50, 32, 50, '#ef4444'),
                    // LW schließt Passlinie oben
                    $this->arrow('a2', 60, 18, 34, 24, '#ef4444'),
                    // RW schließt Passlinie unten
                    $this->arrow('a3', 60, 82, 34, 76, '#ef4444'),
                    // CM-L sichert Halbraum
                    $this->run('a4', 70, 32, 54, 40, '#facc15'),
                    // CM-R sichert Halbraum
                    $this->run('a5', 70, 68, 54, 60, '#facc15'),
                    // Pressfalle-Zone
                    $this->zone('z1', 38, 50, 14, '#ef4444'),
                ],
                'opponents' => [
                    $this->opponent('o1', 38, 50, 6),  // Ballführender
                    $this->opponent('o2', 32, 22, 3),
                    $this->opponent('o3', 30, 78, 7),
                ],
            ],
        ];
    }

    // -----------------------------------------------------------------
    // Preset 2 – Schneller Konter
    // -----------------------------------------------------------------

    /** @return array<string, mixed> */
    private function presetSchnellerKonter(): array
    {
        return [
            'title' => 'Schneller Konter',
            'category' => TacticPreset::CATEGORY_ATTACK,
            'description' => 'Nach Ballgewinn sofort in die Tiefe. Außenstürmer sprinten auf die Lücken, Mittelstürmer läuft hinter die Linie.',
            'data' => [
                'name' => 'Schneller Konter',
                'elements' => [
                    // LW-Sprint (oben)
                    $this->run('a1', 72, 15, 12, 20, '#22c55e'),
                    // ST-Sprint (mitte)
                    $this->run('a2', 72, 50, 12, 50, '#22c55e'),
                    // RW-Sprint (unten)
                    $this->run('a3', 72, 85, 12, 80, '#22c55e'),
                    // Steilpass
                    $this->arrow('a4', 70, 50, 18, 42, '#facc15'),
                    // Abschlusszone
                    $this->zone('z1', 12, 50, 14, '#22c55e'),
                ],
                'opponents' => [
                    $this->opponent('o1', 50, 38, 4),
                    $this->opponent('o2', 50, 62, 5),
                    $this->opponent('o3', 40, 50, 6),
                    $this->opponent('o4', 35, 28, 2),
                    $this->opponent('o5', 35, 72, 3),
                ],
            ],
        ];
    }

    // -----------------------------------------------------------------
    // Preset 3 – Eckball kurz
    // -----------------------------------------------------------------

    /** @return array<string, mixed> */
    private function presetEckballKurz(): array
    {
        return [
            'title' => 'Eckball kurz',
            'category' => TacticPreset::CATEGORY_STANDARDS,
            'description' => 'Kurze Ecke zur Überzahl am Eckpunkt, dann Kombination und Flanke in den gefährlichen Raum.',
            'data' => [
                'name' => 'Eckball kurz',
                'elements' => [
                    // Kurzer Anspiel
                    $this->arrow('a1', 5, 4, 14, 10, '#facc15'),
                    // Anläufer kommt zur kurzen Ecke
                    $this->run('a2', 18, 18, 14, 10, '#facc15'),
                    // Zweite Kombination
                    $this->arrow('a3', 14, 10, 5, 22, '#facc15'),
                    // Flanke in den Strafraum
                    $this->arrow('a4', 5, 22, 12, 46, '#facc15'),
                    // Vorderpfosten-Lauf
                    $this->run('a5', 22, 60, 6, 42, '#22c55e'),
                    // Hinterpfosten nachrücken
                    $this->run('a6', 24, 72, 9, 54, '#22c55e'),
                    // Gefahrenzone im Strafraum
                    $this->zone('z1', 8, 50, 12, '#ef4444'),
                ],
                'opponents' => [],
            ],
        ];
    }

    // -----------------------------------------------------------------
    // Preset 4 – Freistoß Flanke
    // -----------------------------------------------------------------

    /** @return array<string, mixed> */
    private function presetFreistossFlank(): array
    {
        return [
            'title' => 'Freistoß Flanke',
            'category' => TacticPreset::CATEGORY_STANDARDS,
            'description' => 'Gestaffelte Raumläufe in den Strafraum. Vorderpfosten-, Elfmeter- und Hinterpfostenlauf bei Flanke vom halbrechten Freistoß.',
            'data' => [
                'name' => 'Freistoß Flanke',
                'elements' => [
                    // Flanke
                    $this->arrow('a1', 28, 14, 7, 46, '#facc15'),
                    // Vorderpfosten-Lauf
                    $this->run('a2', 22, 58, 6, 40, '#22c55e'),
                    // Elfmeter-Lauf
                    $this->run('a3', 22, 50, 8, 50, '#22c55e'),
                    // Hinterpfosten-Lauf
                    $this->run('a4', 24, 68, 7, 56, '#22c55e'),
                    // Zielzone
                    $this->zone('z1', 7, 48, 12, '#ef4444'),
                ],
                'opponents' => [
                    // Mauer
                    $this->opponent('o1', 22, 44, 0),
                    $this->opponent('o2', 22, 40, 0),
                    $this->opponent('o3', 22, 48, 0),
                    $this->opponent('o4', 22, 52, 0),
                ],
            ],
        ];
    }

    // -----------------------------------------------------------------
    // Preset 5 – Spielaufbau Dreieck
    // -----------------------------------------------------------------

    /** @return array<string, mixed> */
    private function presetSpielaufbauDreieck(): array
    {
        return [
            'title' => 'Spielaufbau Dreieck',
            'category' => TacticPreset::CATEGORY_BUILD_UP,
            'description' => 'Strukturierter Aufbau über Dreieck IV–Sechser–Außenverteidiger mit anschließendem Steilpass in den Halbraum.',
            'data' => [
                'name' => 'Spielaufbau Dreieck',
                'elements' => [
                    // IV → LB
                    $this->arrow('a1', 83, 38, 72, 20, '#facc15'),
                    // LB → DM (Dreieck)
                    $this->arrow('a2', 72, 20, 62, 36, '#facc15'),
                    // DM → Angreifer
                    $this->arrow('a3', 62, 36, 50, 44, '#facc15'),
                    // Ablage
                    $this->arrow('a4', 50, 44, 54, 32, '#facc15'),
                    // Einlauf des AM
                    $this->run('a5', 68, 46, 52, 34, '#22c55e'),
                    // Dreieck-Zone
                    $this->zone('z1', 65, 32, 10, '#3b82f6'),
                ],
                'opponents' => [
                    $this->opponent('o1', 45, 50, 9),
                    $this->opponent('o2', 42, 38, 8),
                    $this->opponent('o3', 42, 62, 10),
                ],
            ],
        ];
    }

    // -----------------------------------------------------------------
    // Preset 6 – 4-4-2 Mittelfeldblock
    // -----------------------------------------------------------------

    /** @return array<string, mixed> */
    private function presetMittelfeldblock(): array
    {
        return [
            'title' => '4-4-2 Mittelfeldblock',
            'category' => TacticPreset::CATEGORY_DEFENSIVE,
            'description' => 'Kompakter Mittelfeldblock in 4-4-2. Außen rücken ein, Stürmer schließen Halbräume, enge Abstände zwischen den Linien.',
            'data' => [
                'name' => '4-4-2 Mittelfeldblock',
                'elements' => [
                    // LM rückt ein
                    $this->run('a1', 68, 18, 54, 30, '#facc15'),
                    // RM rückt ein
                    $this->run('a2', 68, 82, 54, 70, '#facc15'),
                    // ST-L läuft an
                    $this->arrow('a3', 58, 38, 46, 38, '#ef4444'),
                    // ST-R läuft an
                    $this->arrow('a4', 58, 62, 46, 62, '#ef4444'),
                    // CM verdichtet
                    $this->run('a5', 68, 50, 52, 50, '#facc15'),
                    // Kompaktblock
                    $this->zone('z1', 57, 50, 18, '#3b82f6'),
                    // Flügelkorridore
                    $this->zone('z2', 48, 22, 8, '#ef4444'),
                    $this->zone('z3', 48, 78, 8, '#ef4444'),
                ],
                'opponents' => [
                    $this->opponent('o1', 42, 50, 10),
                    $this->opponent('o2', 40, 30, 7),
                    $this->opponent('o3', 40, 70, 11),
                    $this->opponent('o4', 30, 22, 2),
                    $this->opponent('o5', 30, 78, 3),
                ],
            ],
        ];
    }
}
