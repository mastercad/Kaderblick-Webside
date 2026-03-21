<?php

namespace App\DataFixtures\LoadTest;

use App\DataFixtures\MasterData\CalendarEventTypeFixtures;
use App\Entity\CalendarEvent;
use App\Entity\CalendarEventPermission;
use App\Entity\CalendarEventType;
use App\Entity\Club;
use App\Entity\Location;
use App\Enum\CalendarEventPermissionType;
use DateTime;
use Doctrine\Bundle\FixturesBundle\Fixture;
use Doctrine\Bundle\FixturesBundle\FixtureGroupInterface;
use Doctrine\Common\DataFixtures\DependentFixtureInterface;
use Doctrine\ORM\EntityManagerInterface;
use Doctrine\Persistence\ObjectManager;

/**
 * Load-Test Fixtures: Vereinskalender mit realistischen Events pro Verein.
 *
 * Pro Verein und Saison (3 Saisons: 2023/24, 2024/25, 2025/26):
 * - 10 Vereinstreffen (z.B. Vorstandssitzung, Mitgliederversammlung)
 * - 3 Vereinsevents (Abschlussfeier, Sommerfest, Weihnachtsfeier, Jahreshauptversammlung)
 * - 2 Turniere über ein Wochenende (Freizeitturnier / Hallenmasters / Jugendturnier)
 *
 * Sichtbarkeit:
 * - Vereinstreffen: CLUB (nur Vereinsmitglieder)
 * - Turniere: PUBLIC (öffentlich)
 * - Events (Feiern etc.): CLUB
 *
 * Gruppe: load_test
 */
class ClubEventFixtures extends Fixture implements FixtureGroupInterface, DependentFixtureInterface
{
    private const TOTAL_CLUBS = 100;
    private const BATCH_SIZE = 200;

    public static function getGroups(): array
    {
        return ['load_test'];
    }

    public function getDependencies(): array
    {
        return [
            ClubFixtures::class,
            LocationFixtures::class,
            CalendarEventTypeFixtures::class,
        ];
    }

    public function load(ObjectManager $manager): void
    {
        assert($manager instanceof EntityManagerInterface);

        /** @var CalendarEventType $vereinstreffenType */
        $vereinstreffenType = $this->getReference('calendar_event_type_vereinstreffen', CalendarEventType::class);
        /** @var CalendarEventType $eventType */
        $eventType = $this->getReference('calendar_event_type_event', CalendarEventType::class);
        /** @var CalendarEventType $turnierType */
        $turnierType = $this->getReference('calendar_event_type_turnier', CalendarEventType::class);

        $vereinstreffenTypeId = $vereinstreffenType->getId();

        // Idempotency-Guard: prüfen ob bereits Vereinstreffen-Events existieren
        $existingCount = (int) $manager->createQuery(
            'SELECT COUNT(e.id) FROM App\Entity\CalendarEvent e WHERE e.calendarEventType = :typeId'
        )->setParameter('typeId', $vereinstreffenTypeId)->getSingleScalarResult();
        if ($existingCount > 0) {
            return;
        }

        $eventTypeId = $eventType->getId();
        $turnierTypeId = $turnierType->getId();

        // Vorstand/Vereins-Meetings: reale Themen zyklisch
        $meetingTitles = [
            'Vorstandssitzung',
            'Trainerbesprechung',
            'Sportwart-Meeting',
            'Kassenwart-Sitzung',
            'Jugendbesprechung',
            'Vorstandssitzung',
            'Spielbetriebsausschuss',
            'Vereinsausschuss',
            'Schiedsrichterbesprechung',
            'Vorstandssitzung',
        ];

        // Vereinsevents pro Saison (variiert nach Saison-Index)
        $seasonEvents = [
            0 => [ // 2023/24
                ['title' => 'Saisonabschlussfeier 2023/24',      'month' => 6,  'day' => 15, 'hour' => 18, 'duration' => 240],
                ['title' => 'Sommerfest',                          'month' => 7,  'day' => 8,  'hour' => 14, 'duration' => 360],
                ['title' => 'Weihnachtsfeier',                     'month' => 12, 'day' => 14, 'hour' => 19, 'duration' => 180],
            ],
            1 => [ // 2024/25
                ['title' => 'Saisonabschlussfeier 2024/25',      'month' => 6,  'day' => 21, 'hour' => 18, 'duration' => 240],
                ['title' => 'Jahreshauptversammlung',              'month' => 11, 'day' => 18, 'hour' => 19, 'duration' => 120],
                ['title' => 'Weihnachtsfeier',                     'month' => 12, 'day' => 13, 'hour' => 19, 'duration' => 180],
            ],
            2 => [ // 2025/26
                ['title' => 'Neujahrsempfang',                    'month' => 1,  'day' => 10, 'hour' => 17, 'duration' => 120],
                ['title' => 'Frühjahrsauftakt-Meeting',           'month' => 3,  'day' => 8,  'hour' => 18, 'duration' => 90],
                ['title' => 'Saisonabschlussfeier 2025/26',      'month' => 6,  'day' => 20, 'hour' => 18, 'duration' => 240],
            ],
        ];

        // Turniere pro Saison
        $seasonTournaments = [
            0 => [ // 2023/24
                ['title' => 'Hallenmasters Winter 2024',          'year' => 2024, 'month' => 1,  'day' => 13, 'hour' => 9,  'duration' => 480],
                ['title' => 'Freundschaftsturnier Sommer 2024',   'year' => 2024, 'month' => 7,  'day' => 6,  'hour' => 10, 'duration' => 600],
            ],
            1 => [ // 2024/25
                ['title' => 'Hallenmasters Winter 2025',          'year' => 2025, 'month' => 1,  'day' => 11, 'hour' => 9,  'duration' => 480],
                ['title' => 'Jugendturnier Sommer 2025',          'year' => 2025, 'month' => 7,  'day' => 5,  'hour' => 10, 'duration' => 600],
            ],
            2 => [ // 2025/26
                ['title' => 'Hallenmasters Winter 2026',          'year' => 2026, 'month' => 1,  'day' => 10, 'hour' => 9,  'duration' => 480],
                ['title' => 'Frühjahrsturnier 2026',              'year' => 2026, 'month' => 4,  'day' => 4,  'hour' => 10, 'duration' => 600],
            ],
        ];

        // Saisonstart-Jahre für Vereinstreffen (Monate Aug-Mai = 10 Monate)
        $seasonStartYears = [2023, 2024, 2025];
        // Vereinstreffen jeweils im Monat-Offset: Aug(0), Sep(1), Okt(2), Nov(3), Dez(4),
        // Jan(5), Feb(6), Mär(7), Apr(8), Mai(9)
        $meetingMonthOffsets = [
            ['month' => 8,  'year_offset' => 0, 'day' => 3,  'hour' => 19],
            ['month' => 9,  'year_offset' => 0, 'day' => 7,  'hour' => 19],
            ['month' => 10, 'year_offset' => 0, 'day' => 5,  'hour' => 19],
            ['month' => 11, 'year_offset' => 0, 'day' => 4,  'hour' => 19],
            ['month' => 12, 'year_offset' => 0, 'day' => 7,  'hour' => 19],
            ['month' => 1,  'year_offset' => 1, 'day' => 11, 'hour' => 19],
            ['month' => 2,  'year_offset' => 1, 'day' => 8,  'hour' => 19],
            ['month' => 3,  'year_offset' => 1, 'day' => 8,  'hour' => 19],
            ['month' => 4,  'year_offset' => 1, 'day' => 5,  'hour' => 19],
            ['month' => 5,  'year_offset' => 1, 'day' => 3,  'hour' => 19],
        ];

        $persistCount = 0;

        // Vorab IDs aller Vereine und Locations sammeln (für Proxy-Nutzung nach clear())
        $clubMeta = [];
        for ($clubIdx = 0; $clubIdx < self::TOTAL_CLUBS; ++$clubIdx) {
            /** @var Club $club */
            $club = $this->getReference('lt_club_' . $clubIdx, Club::class);
            /** @var Location $location */
            $location = $this->getReference('lt_location_' . ($clubIdx % 60), Location::class);
            $clubMeta[] = [
                'clubId' => $club->getId(),
                'locationId' => $location->getId(),
                'name' => $club->getName(),
            ];
        }

        foreach ($clubMeta as $clubIdx => $meta) {
            $clubId = $meta['clubId'];
            $locationId = $meta['locationId'];
            $clubName = $meta['name'];

            /** @var Club $clubProxy */
            $clubProxy = $manager->getReference(Club::class, $clubId);
            /** @var Location $locationProxy */
            $locationProxy = $manager->getReference(Location::class, $locationId);

            for ($seasonIdx = 0; $seasonIdx < 3; ++$seasonIdx) {
                $startYear = $seasonStartYears[$seasonIdx];

                // ── 10 Vereinstreffen ────────────────────────────────────────
                foreach ($meetingMonthOffsets as $meetingIdx => $mo) {
                    $year = $startYear + $mo['year_offset'];
                    // Kleinen Versatz pro Verein (1-3 Tage), damit nicht alle am gleichen Tag
                    $dayOffset = ($clubIdx % 3);
                    $day = $mo['day'] + $dayOffset;

                    $start = new DateTime(sprintf('%04d-%02d-%02d %02d:00:00', $year, $mo['month'], $day, $mo['hour']));
                    $end = clone $start;
                    $end->modify('+90 minutes');

                    $title = $meetingTitles[$meetingIdx] . ' – ' . $clubName;

                    // Vereinshauptversammlung einmal jährlich im November als öffentliches Event
                    $isJHV = (11 === $mo['month'] && 3 === $meetingIdx);

                    $event = $this->createEvent(
                        $manager,
                        $title,
                        $isJHV ? 'Alle Mitglieder sind herzlich eingeladen!' : null,
                        $start,
                        $end,
                        $manager->getReference(CalendarEventType::class, $vereinstreffenTypeId),
                        $locationProxy
                    );

                    $perm = new CalendarEventPermission();
                    $perm->setPermissionType($isJHV ? CalendarEventPermissionType::PUBLIC : CalendarEventPermissionType::CLUB);
                    $perm->setClub($clubProxy);
                    $event->addPermission($perm);

                    $manager->persist($event);
                    ++$persistCount;
                }

                // ── Vereinsevents (Feiern etc.) ──────────────────────────────
                foreach ($seasonEvents[$seasonIdx] as $evDef) {
                    $evYear = ($evDef['month'] >= 8) ? $startYear : ($startYear + 1);
                    $start = new DateTime(sprintf(
                        '%04d-%02d-%02d %02d:00:00',
                        $evYear,
                        $evDef['month'],
                        $evDef['day'],
                        $evDef['hour']
                    ));
                    $end = clone $start;
                    $end->modify('+' . $evDef['duration'] . ' minutes');

                    $event = $this->createEvent(
                        $manager,
                        $evDef['title'] . ' – ' . $clubName,
                        null,
                        $start,
                        $end,
                        $manager->getReference(CalendarEventType::class, $eventTypeId),
                        $locationProxy
                    );

                    $perm = new CalendarEventPermission();
                    $perm->setPermissionType(CalendarEventPermissionType::CLUB);
                    $perm->setClub($clubProxy);
                    $event->addPermission($perm);

                    $manager->persist($event);
                    ++$persistCount;
                }

                // ── Turniere ─────────────────────────────────────────────────
                foreach ($seasonTournaments[$seasonIdx] as $trDef) {
                    // Kleinen Versatz pro Verein (0-6 Tage versetzt) damit sie nicht alle
                    // am selben Wochenende stattfinden – realistisch für regionale Turniere
                    $dayOffset = ($clubIdx % 7);
                    $start = new DateTime(sprintf(
                        '%04d-%02d-%02d %02d:00:00',
                        $trDef['year'],
                        $trDef['month'],
                        $trDef['day'] + $dayOffset,
                        $trDef['hour']
                    ));
                    $end = clone $start;
                    $end->modify('+' . $trDef['duration'] . ' minutes');

                    $event = $this->createEvent(
                        $manager,
                        $trDef['title'] . ' (' . $clubName . ')',
                        null,
                        $start,
                        $end,
                        $manager->getReference(CalendarEventType::class, $turnierTypeId),
                        $locationProxy
                    );

                    // Turniere sind öffentlich
                    $perm = new CalendarEventPermission();
                    $perm->setPermissionType(CalendarEventPermissionType::PUBLIC);
                    $event->addPermission($perm);

                    $manager->persist($event);
                    ++$persistCount;
                }

                if (0 === $persistCount % self::BATCH_SIZE) {
                    $manager->flush();
                    $manager->clear();
                    $clubProxy = $manager->getReference(Club::class, $clubId);
                    $locationProxy = $manager->getReference(Location::class, $locationId);
                }
            }
        }

        $manager->flush();
    }

    private function createEvent(
        ObjectManager $manager,
        string $title,
        ?string $description,
        DateTime $start,
        DateTime $end,
        CalendarEventType $type,
        Location $location
    ): CalendarEvent {
        $event = new CalendarEvent();
        $event->setTitle($title);
        if (null !== $description) {
            $event->setDescription($description);
        }
        $event->setStartDate($start);
        $event->setEndDate($end);
        $event->setCalendarEventType($type);
        $event->setLocation($location);

        return $event;
    }
}
