<?php

namespace App\DataFixtures\LoadTest;

use App\DataFixtures\MasterData\CalendarEventTypeFixtures;
use App\Entity\CalendarEvent;
use App\Entity\CalendarEventType;
use App\Entity\Game;
use App\Entity\GameType;
use App\Entity\Location;
use App\Entity\Team;
use DateTime;
use Doctrine\Bundle\FixturesBundle\Fixture;
use Doctrine\Bundle\FixturesBundle\FixtureGroupInterface;
use Doctrine\Common\DataFixtures\DependentFixtureInterface;
use Doctrine\ORM\EntityManagerInterface;
use Doctrine\Persistence\ObjectManager;
use Exception;
use RuntimeException;

/**
 * Load-Test Fixtures: 5 Spieljahre (2021/22 – 2025/26).
 *
 * Pro Team und Saison:
 * - 15 Ligaspiele (samstags)
 * - 2 Pokalspiele (dienstags)
 * - 1 Freundschaftsspiel (mittwochs)
 * Gesamt: 368 Teams × 18 Spiele × 5 Saisons = ~33.120 Spiele
 *
 * Abgeschlossene Saisons: isFinished=true mit Ergebnissen.
 * Aktuelle Saison 2025/26: Spiele vor heute abgeschlossen, danach geplant.
 *
 * Gruppe: load_test
 */
class GameFixtures extends Fixture implements FixtureGroupInterface, DependentFixtureInterface
{
    private const TOTAL_TEAMS = 916;
    private const BATCH_SIZE = 100;

    // Saisonstart (erstes Spielwochenende) – 5 Saisons
    private const SEASON_STARTS = [
        0 => '2021-08-07',  // 2021/22
        1 => '2022-08-06',  // 2022/23
        2 => '2023-08-05',  // 2023/24
        3 => '2024-08-03',  // 2024/25
        4 => '2025-08-02',  // 2025/26 (aktuell)
    ];

    // Saisonende (für isFinished-Bestimmung ganzer Saisons)
    private const SEASON_ENDS = [
        0 => '2022-06-30',
        1 => '2023-06-30',
        2 => '2024-06-30',
        3 => '2025-06-30',
        4 => '2026-06-30',  // noch nicht abgeschlossen
    ];

    public static function getGroups(): array
    {
        return ['load_test'];
    }

    public function getDependencies(): array
    {
        return [
            TeamFixtures::class,
            LocationFixtures::class,
            CalendarEventTypeFixtures::class,
        ];
    }

    public function load(ObjectManager $manager): void
    {
        assert($manager instanceof EntityManagerInterface);

        // Idempotency-Guard: check specifically for fixture games, not all games.
        // Checking all games would skip fixture creation if the user has manually
        // created games before running the fixtures.
        try {
            /** @var Team $firstFixtureTeam */
            $firstFixtureTeam = $this->getReference('lt_team_0', Team::class);
            $existingFixtureCount = (int) $manager->getRepository(Game::class)
                ->createQueryBuilder('g')
                ->select('COUNT(g.id)')
                ->where('g.homeTeam = :team OR g.awayTeam = :team')
                ->setParameter('team', $firstFixtureTeam)
                ->getQuery()
                ->getSingleScalarResult();
            if ($existingFixtureCount > 0) {
                return;
            }
        } catch (Exception) {
            // Reference not available → skip guard, proceed with load
        }

        // GameTypes laden
        $gameTypes = $manager->getRepository(GameType::class)->findAll();
        if (empty($gameTypes)) {
            throw new RuntimeException('Keine GameTypes gefunden. Bitte master-Fixtures zuerst laden.');
        }

        $ligaspielType = null;
        $pokalType = null;
        $freundschaftType = null;
        foreach ($gameTypes as $gt) {
            match ($gt->getName()) {
                'Ligaspiel' => ($ligaspielType = $gt),
                'Pokalspiel' => ($pokalType = $gt),
                'Freundschaftsspiel' => ($freundschaftType = $gt),
                default => null,
            };
        }
        $ligaspielType ??= $gameTypes[0];
        $pokalType ??= $gameTypes[0];
        $freundschaftType ??= $gameTypes[0];

        /** @var CalendarEventType $gameCalendarType */
        $gameCalendarType = $this->getReference('calendar_event_type_spiel', CalendarEventType::class);

        $today = new DateTime();

        $persistCount = 0;

        for ($teamIdx = 0; $teamIdx < self::TOTAL_TEAMS; ++$teamIdx) {
            /** @var Team $homeTeam */
            $homeTeam = $this->getReference('lt_team_' . $teamIdx, Team::class);
            // Heimstätte des Vereins bestimmen (je nach Vereinsgröße)
            if ($teamIdx < 312) {        // 24 große Klubs × 13 Teams
                $clubIdx = intdiv($teamIdx, 13);
            } elseif ($teamIdx < 636) {  // 36 mittlere Klubs × 9 Teams
                $clubIdx = 24 + intdiv($teamIdx - 312, 9);
            } else {                     // 40 kleine Klubs × 7 Teams
                $clubIdx = 60 + intdiv($teamIdx - 636, 7);
            }
            /** @var Location $location */
            $location = $this->getReference('lt_location_' . $clubIdx, Location::class);

            foreach (self::SEASON_STARTS as $seasonIdx => $seasonStartStr) {
                $seasonStart = new DateTime($seasonStartStr);
                $seasonEndStr = self::SEASON_ENDS[$seasonIdx];
                $seasonFullyPast = new DateTime($seasonEndStr) < $today;

                // ── 15 Ligaspiele (samstags, jede Woche) ──────────────────────
                for ($round = 0; $round < 15; ++$round) {
                    $awayTeamIdx = ($teamIdx + $round * 7 + 3) % self::TOTAL_TEAMS;
                    if ($awayTeamIdx === $teamIdx) {
                        $awayTeamIdx = ($awayTeamIdx + 1) % self::TOTAL_TEAMS;
                    }
                    /** @var Team $awayTeam */
                    $awayTeam = $this->getReference('lt_team_' . $awayTeamIdx, Team::class);

                    $gameDate = clone $seasonStart;
                    $gameDate->modify('+' . ($round * 7) . ' days');
                    $gameDate->setTime(15, 0);

                    $isPast = $seasonFullyPast || $gameDate < $today;

                    $game = $this->createGame(
                        $homeTeam,
                        $awayTeam,
                        $ligaspielType,
                        $gameCalendarType,
                        $location,
                        $gameDate,
                        $isPast
                    );
                    $manager->persist($game);
                    ++$persistCount;
                }

                // ── 2 Pokalspiele (dienstags, Herbst+Frühjahr) ────────────────
                foreach ([30, 150] as $daysOffset) {
                    $cupDate = clone $seasonStart;
                    $cupDate->modify('+' . $daysOffset . ' days');
                    $cupDate->modify('next tuesday');
                    $cupDate->setTime(19, 30);

                    $cupAwayIdx = ($teamIdx + 33 + $daysOffset) % self::TOTAL_TEAMS;
                    if ($cupAwayIdx === $teamIdx) {
                        $cupAwayIdx = ($cupAwayIdx + 1) % self::TOTAL_TEAMS;
                    }
                    /** @var Team $cupAway */
                    $cupAway = $this->getReference('lt_team_' . $cupAwayIdx, Team::class);

                    $isPast = $seasonFullyPast || $cupDate < $today;

                    $cupGame = $this->createGame(
                        $homeTeam,
                        $cupAway,
                        $pokalType,
                        $gameCalendarType,
                        $location,
                        $cupDate,
                        $isPast
                    );
                    $manager->persist($cupGame);
                    ++$persistCount;
                }

                // ── 1 Freundschaftsspiel (mittwochs, Frühjahr) ────────────────
                $friendlyDate = clone $seasonStart;
                $friendlyDate->modify('+' . (21 * 7) . ' days');
                $friendlyDate->modify('next wednesday');
                $friendlyDate->setTime(18, 0);

                $friendlyAwayIdx = ($teamIdx + 51) % self::TOTAL_TEAMS;
                if ($friendlyAwayIdx === $teamIdx) {
                    $friendlyAwayIdx = ($friendlyAwayIdx + 1) % self::TOTAL_TEAMS;
                }
                /** @var Team $friendlyAway */
                $friendlyAway = $this->getReference('lt_team_' . $friendlyAwayIdx, Team::class);

                $isPast = $seasonFullyPast || $friendlyDate < $today;

                $friendlyGame = $this->createGame(
                    $homeTeam,
                    $friendlyAway,
                    $freundschaftType,
                    $gameCalendarType,
                    $location,
                    $friendlyDate,
                    $isPast
                );
                $manager->persist($friendlyGame);
                ++$persistCount;

                if (0 === $persistCount % self::BATCH_SIZE) {
                    $manager->flush();
                }
            }
        }

        $manager->flush();
    }

    private function createGame(
        Team $homeTeam,
        Team $awayTeam,
        GameType $gameType,
        CalendarEventType $calendarEventType,
        Location $location,
        DateTime $gameDate,
        bool $isPast
    ): Game {
        $calEvent = new CalendarEvent();
        $calEvent->setTitle($homeTeam->getName() . ' vs. ' . $awayTeam->getName());
        $calEvent->setStartDate(clone $gameDate);
        $endDate = clone $gameDate;
        $endDate->modify('+105 minutes');
        $calEvent->setEndDate($endDate);
        $calEvent->setCalendarEventType($calendarEventType);
        $calEvent->setLocation($location);

        $game = new Game();
        $game->setHomeTeam($homeTeam);
        $game->setAwayTeam($awayTeam);
        $game->setGameType($gameType);
        $game->setLocation($location);
        $game->setCalendarEvent($calEvent);
        $game->setHalfDuration(45);
        $game->setHalftimeBreakDuration(15);

        if ($isPast) {
            $homeScore = random_int(0, 4);
            $awayScore = random_int(0, 3);
            if (random_int(0, 9) < 2) {
                $homeScore += random_int(1, 3);
            }
            $game->setHomeScore($homeScore);
            $game->setAwayScore($awayScore);
            $game->setIsFinished(true);
            $game->setFirstHalfExtraTime(random_int(0, 5));
            $game->setSecondHalfExtraTime(random_int(1, 7));
        } else {
            $game->setIsFinished(false);
        }

        return $game;
    }
}
