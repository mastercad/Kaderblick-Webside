<?php

namespace App\Service;

use App\Entity\DashboardWidget;
use App\Entity\ReportDefinition;
use App\Entity\User;
use App\Entity\UserRelation;
use App\Repository\DashboardWidgetRepository;
use Doctrine\ORM\EntityManagerInterface;

/**
 * Creates and maintains the default dashboard for new or newly-linked users.
 *
 * Base widgets (Kalender, Anstehende Termine, Neuigkeiten, Nachrichten) are
 * created once when a user verifies their e-mail.
 *
 * Team-specific report widgets (Tore, Vorlagen, Schüsse, Karten …) are added
 * whenever a player or coach relation is (re-)assigned by an admin.  The method
 * is idempotent: it never adds duplicate widgets for the same team.
 */
class DefaultDashboardService
{
    /**
     * Base widget definitions: type → preferred width in Bootstrap columns.
     * Position 0-3 is assigned in order; existing types are skipped.
     */
    private const BASE_WIDGETS = [
        ['type' => 'calendar',        'width' => 12],
        ['type' => 'upcoming_events', 'width' => 6],
        ['type' => 'news',            'width' => 6],
        ['type' => 'messages',        'width' => 12],
    ];

    public function __construct(
        private EntityManagerInterface $em,
        private DashboardWidgetRepository $widgetRepo,
    ) {
    }

    /**
     * Full setup: base widgets + team reports.
     * Safe to call multiple times – already-existing widgets/reports are skipped.
     */
    public function createDefaultDashboard(User $user): void
    {
        $this->ensureBaseWidgets($user);
        $this->addMissingTeamReports($user);
    }

    /**
     * Only adds team-specific report widgets for newly assigned relations.
     * Call this after an admin saves player/coach assignments.
     */
    public function syncTeamReports(User $user): void
    {
        $this->addMissingTeamReports($user);
    }

    // ──────────────────────────────────────────────────────────────────────────
    // Private helpers
    // ──────────────────────────────────────────────────────────────────────────

    private function ensureBaseWidgets(User $user): void
    {
        $existing = $this->widgetRepo->findBy(['user' => $user]);
        $existingTypes = array_map(static fn (DashboardWidget $w) => $w->getType(), $existing);
        $nextPosition = $this->maxPosition($existing) + 1;

        // If the user has NO widgets at all we use the canonical positions 0-3.
        $useCanonical = empty($existing);
        $canonical = 0;

        foreach (self::BASE_WIDGETS as $def) {
            if (in_array($def['type'], $existingTypes, true)) {
                if ($useCanonical) {
                    ++$canonical;
                }
                continue;
            }

            $widget = new DashboardWidget();
            $widget->setUser($user);
            $widget->setType($def['type']);
            $widget->setWidth($def['width']);
            $widget->setPosition($useCanonical ? $canonical++ : $nextPosition++);
            $widget->setEnabled(true);
            $widget->setDefault(false);
            $widget->setConfig([]);

            $this->em->persist($widget);
        }

        $this->em->flush();
    }

    private function addMissingTeamReports(User $user): void
    {
        // Team IDs for which reports already exist (avoid duplicates)
        $knownTeamIds = $this->existingReportTeamIds($user);

        $allWidgets = $this->widgetRepo->findBy(['user' => $user]);
        $nextPosition = $this->maxPosition($allWidgets) + 1;

        // Track team IDs added in this call so we don't double-up within one run
        $addedThisRun = [];

        foreach ($user->getUserRelations() as $relation) {
            /** @var UserRelation $relation */
            $player = $relation->getPlayer();
            $coach = $relation->getCoach();

            if (null !== $player) {
                foreach ($player->getPlayerTeamAssignments() as $pta) {
                    // Skip ended assignments
                    if (null !== $pta->getEndDate()) {
                        continue;
                    }

                    $team = $pta->getTeam();
                    $teamId = (int) $team->getId();

                    if (in_array($teamId, $knownTeamIds, true) || in_array($teamId, $addedThisRun, true)) {
                        continue;
                    }
                    $addedThisRun[] = $teamId;

                    $nextPosition = $this->persistReportWidgets($user, $nextPosition, [
                        [
                            'name' => 'Tore – ' . $team->getName(),
                            'description' => 'Torstatistik aller Spieler im Team ' . $team->getName() . '.',
                            'config' => [
                                'diagramType' => 'bar',
                                'xField' => 'player',
                                'yField' => 'goals',
                                'groupBy' => [],
                                'metrics' => [],
                                'filters' => ['team' => $teamId],
                            ],
                        ],
                        [
                            'name' => 'Vorlagen – ' . $team->getName(),
                            'description' => 'Torvorlagen aller Spieler im Team ' . $team->getName() . '.',
                            'config' => [
                                'diagramType' => 'bar',
                                'xField' => 'player',
                                'yField' => 'assists',
                                'groupBy' => [],
                                'metrics' => [],
                                'filters' => ['team' => $teamId],
                            ],
                        ],
                    ]);
                }
            }

            if (null !== $coach) {
                foreach ($coach->getCoachTeamAssignments() as $cta) {
                    if (null !== $cta->getEndDate()) {
                        continue;
                    }

                    $team = $cta->getTeam();
                    $teamId = (int) $team->getId();

                    if (in_array($teamId, $knownTeamIds, true) || in_array($teamId, $addedThisRun, true)) {
                        continue;
                    }
                    $addedThisRun[] = $teamId;

                    $nextPosition = $this->persistReportWidgets($user, $nextPosition, [
                        [
                            'name' => 'Tore pro Spieler – ' . $team->getName(),
                            'description' => 'Torstatistik aller Spieler des Teams ' . $team->getName() . '.',
                            'config' => [
                                'diagramType' => 'bar',
                                'xField' => 'player',
                                'yField' => 'goals',
                                'groupBy' => [],
                                'metrics' => [],
                                'filters' => ['team' => $teamId],
                            ],
                        ],
                        [
                            'name' => 'Schüsse – ' . $team->getName(),
                            'description' => 'Schussstatistik aller Spieler im Team ' . $team->getName() . '.',
                            'config' => [
                                'diagramType' => 'bar',
                                'xField' => 'player',
                                'yField' => 'shots',
                                'groupBy' => [],
                                'metrics' => [],
                                'filters' => ['team' => $teamId],
                            ],
                        ],
                        [
                            'name' => 'Karten – ' . $team->getName(),
                            'description' => 'Verwarnungs- und Platzverweisstatistik im Team ' . $team->getName() . '.',
                            'config' => [
                                'diagramType' => 'bar',
                                'xField' => 'player',
                                'yField' => 'yellowCards',
                                'groupBy' => [],
                                'metrics' => [],
                                'filters' => ['team' => $teamId],
                            ],
                        ],
                    ]);
                }
            }
        }

        $this->em->flush();
    }

    /**
     * Persists a list of ReportDefinition + DashboardWidget pairs.
     *
     * @param array<int, array{name: string, description: string, config: array<string, mixed>}> $reports
     */
    private function persistReportWidgets(User $user, int $startPosition, array $reports): int
    {
        $position = $startPosition;

        foreach ($reports as $def) {
            $report = new ReportDefinition();
            $report->setUser($user);
            $report->setName($def['name']);
            $report->setDescription($def['description']);
            $report->setConfig($def['config']);
            $report->setIsTemplate(false);
            $this->em->persist($report);

            $widget = new DashboardWidget();
            $widget->setUser($user);
            $widget->setType('report');
            $widget->setWidth(6);
            $widget->setPosition($position++);
            $widget->setEnabled(true);
            $widget->setDefault(false);
            $widget->setConfig([]);
            $widget->setReportDefinition($report);
            $this->em->persist($widget);
        }

        return $position;
    }

    /**
     * Returns team IDs already covered by existing report widgets for this user.
     *
     * @return int[]
     */
    private function existingReportTeamIds(User $user): array
    {
        $ids = [];
        $widgets = $this->widgetRepo->findBy(['user' => $user]);

        foreach ($widgets as $widget) {
            if ('report' !== $widget->getType()) {
                continue;
            }
            $report = $widget->getReportDefinition();
            if (null === $report) {
                continue;
            }
            $teamId = $report->getConfig()['filters']['team'] ?? null;
            if (null !== $teamId) {
                $ids[] = (int) $teamId;
            }
        }

        return array_unique($ids);
    }

    /**
     * Returns the highest `position` value in a list of widgets, or -1 when empty.
     *
     * @param DashboardWidget[] $widgets
     */
    private function maxPosition(array $widgets): int
    {
        if (empty($widgets)) {
            return -1;
        }

        return max(array_map(static fn (DashboardWidget $w) => $w->getPosition(), $widgets));
    }
}
