<?php

namespace App\DataFixtures\LoadTest;

use App\DataFixtures\MasterData\NationalityFixtures;
use App\DataFixtures\MasterData\PlayerTeamAssignmentTypeFixtures;
use App\DataFixtures\MasterData\PositionFixtures;
use App\DataFixtures\MasterData\StrongFootFixtures;
use App\Entity\Club;
use App\Entity\Nationality;
use App\Entity\Player;
use App\Entity\PlayerClubAssignment;
use App\Entity\PlayerNationalityAssignment;
use App\Entity\PlayerTeamAssignment;
use App\Entity\PlayerTeamAssignmentType;
use App\Entity\Position;
use App\Entity\StrongFoot;
use App\Entity\Team;
use DateTime;
use DateTimeImmutable;
use Doctrine\Bundle\FixturesBundle\Fixture;
use Doctrine\Bundle\FixturesBundle\FixtureGroupInterface;
use Doctrine\Common\DataFixtures\DependentFixtureInterface;
use Doctrine\Persistence\ObjectManager;

/**
 * Load-Test Fixtures: ~16488 Spieler (18 pro Team, 916 Teams).
 * Bildet 5 Saisons (2021/22 – 2025/26) mit vollständiger History ab:
 * Transfers, Leihgaben, doppelte Spielberechtigungen, Nationalitätszuweisungen.
 *
 * Szenario Deutschland / reales Jugendfußball-Modell:
 * - Jedes Team hat 18 Spieler (Stammkader)
 * - Saison-Rotation: teamIdx % 3 bestimmt das aktuelle Team-Startdatum
 * - 25 % der Spieler haben eine frühere Team-Zuordnung (Transfer-History)
 * - 5 % der Spieler sind Leihspieler (temporäre Zuordnung)
 * - Nationalitäten: 70 % DE, 5 % TR, 3 % PL, Rest international (25 Länder)
 *
 * Gruppe: load_test
 */
class PlayerFixtures extends Fixture implements FixtureGroupInterface, DependentFixtureInterface
{
    private const TOTAL_TEAMS = 916;
    private const PLAYERS_PER_TEAM = 18;
    private const BATCH_SIZE = 100;

    /** @var array<string, Position> */
    private array $positions = [];

    /** @var array<string, StrongFoot> */
    private array $strongFeet = [];

    /** @var array<string, PlayerTeamAssignmentType> */
    private array $assignmentTypes = [];

    /** @var array<int, Nationality> pre-built weighted wheel (100 entries, index % 100) */
    private array $nationalityWheel = [];

    public static function getGroups(): array
    {
        return ['load_test'];
    }

    public function getDependencies(): array
    {
        return [
            TeamFixtures::class,
            ClubFixtures::class,
            StrongFootFixtures::class,
            PositionFixtures::class,
            PlayerTeamAssignmentTypeFixtures::class,
            NationalityFixtures::class,
        ];
    }

    public function load(ObjectManager $manager): void
    {
        $this->loadMasterData();

        $firstNames = [
            'Lukas', 'Max', 'Felix', 'Jonas', 'Leon', 'Erik', 'Niklas', 'Tim', 'Tobias', 'Sebastian',
            'David', 'Jan', 'Stefan', 'Michael', 'Andreas', 'Christian', 'Florian', 'Kevin', 'Patrick', 'Thomas',
            'Finn', 'Noah', 'Elias', 'Ben', 'Luca', 'Paul', 'Moritz', 'Jannik', 'Marcel', 'Dominic',
            'Oliver', 'Mathias', 'Robert', 'Peter', 'Jens', 'Carsten', 'Markus', 'Philippe', 'Marco', 'Lars',
            'Mohamed', 'Karim', 'Aleksandar', 'Lucas', 'Rafael', 'Diego', 'Ivan', 'Alexei', 'Tomáš', 'Zlatan',
        ];
        $lastNames = [
            'Müller', 'Schmidt', 'Schneider', 'Fischer', 'Weber', 'Meyer', 'Wagner', 'Becker', 'Schulz', 'Hoffmann',
            'Koch', 'Richter', 'Klein', 'Wolf', 'Schröder', 'Neumann', 'Schwarz', 'Braun', 'Krüger', 'Werner',
            'Hartmann', 'Lange', 'Schmitt', 'König', 'Bauer', 'Zimmermann', 'Kramer', 'Huber', 'Friedrich', 'Maier',
            'Novak', 'Horvat', 'Özkan', 'Silva', 'Santos', 'Pereira', 'Fernandez', 'Garcia', 'Rossi', 'Müller',
            'Frank', 'Walter', 'Lehmann', 'Günter', 'Peters', 'Berger', 'Sommer', 'Jung', 'Brandt', 'Vogel',
        ];

        // Position-Zuweisung nach Trikotnummer innerhalb eines Teams
        $positionMap = [
            0 => 'tw', 1 => 'iv', 2 => 'iv', 3 => 'rv', 4 => 'lv',
            5 => 'dm', 6 => 'zm', 7 => 'zm', 8 => 'rm', 9 => 'lm',
            10 => 'om', 11 => 'ra', 12 => 'la', 13 => 'st', 14 => 'st',
            15 => 'tw', 16 => 'iv', 17 => 'zm',
        ];

        $globalIdx = 0;
        $persistCount = 0;

        for ($teamIdx = 0; $teamIdx < self::TOTAL_TEAMS; ++$teamIdx) {
            /** @var Team $currentTeam */
            $currentTeam = $this->getReference('lt_team_' . $teamIdx, Team::class);
            $clubs = $currentTeam->getClubs()->toArray();
            $ageGroup = $currentTeam->getAgeGroup();

            // Bestimme Startdatum der aktuellen Zuordnung (Saison-Rotation)
            $currentStartDates = [
                0 => '2023-07-01',
                1 => '2024-07-01',
                2 => '2025-07-01',
            ];
            $currentStartDate = $currentStartDates[$teamIdx % 3];

            for ($localIdx = 0; $localIdx < self::PLAYERS_PER_TEAM; ++$localIdx) {
                $firstName = $firstNames[($globalIdx + $localIdx) % count($firstNames)];
                $lastName = $lastNames[($globalIdx * 3 + $localIdx * 7) % count($lastNames)];
                $email = 'lt.player.' . $globalIdx . '@loadtest-players.de';

                $existing = $manager->getRepository(Player::class)->findOneBy(['email' => $email]);
                if ($existing) {
                    if ($globalIdx < 400) {
                        $this->addReference('lt_player_' . $globalIdx, $existing);
                    }
                    ++$globalIdx;
                    continue;
                }

                $player = new Player();
                $player->setFirstName($firstName);
                $player->setLastName($lastName);
                $player->setEmail($email);

                $posKey = $positionMap[$localIdx];
                /** @var Position $position */
                $position = $this->positions[$posKey];
                $player->setMainPosition($position);

                $footKeys = ['left', 'right', 'right', 'right', 'both'];
                /** @var StrongFoot $strongFoot */
                $strongFoot = $this->strongFeet[$footKeys[$globalIdx % 5]];
                $player->setStrongFoot($strongFoot);

                // Geburtsdatum: exakt altersgerecht zur aktuellen Saison (Bezug 01.01.2026)
                $birthdate = $this->generateBirthdate($ageGroup->getCode());
                $player->setBirthdate($birthdate);

                $manager->persist($player);

                // Nationalitätszuweisung (von Geburt an)
                $natAssignment = new PlayerNationalityAssignment();
                $natAssignment->setPlayer($player);
                $natAssignment->setNationality($this->nationalityWheel[$globalIdx % count($this->nationalityWheel)]);
                $natAssignment->setStartDate(DateTimeImmutable::createFromMutable($birthdate));
                $natAssignment->setActive(true);
                $manager->persist($natAssignment);

                // Club-Zuordnung: Jeder Spieler gehört zu genau einem Verein.
                // Bei Spielgemeinschaften stellt der Gründerverein (clubs[0]) die Mehrheit
                // (~65%), die Partner-Vereine teilen sich den Rest – realistisch für SGs,
                // bei denen ein Verein der treibende ist und mehr Spieler einbringt.
                $clubCount = count($clubs);
                if (1 === $clubCount) {
                    $primaryClub = $clubs[0];
                } else {
                    $primaryThreshold = (int) ceil(self::PLAYERS_PER_TEAM * 0.65); // ~12 von 18
                    if ($localIdx < $primaryThreshold) {
                        $primaryClub = $clubs[0];
                    } else {
                        $otherClubs = array_slice($clubs, 1);
                        $primaryClub = $otherClubs[($localIdx - $primaryThreshold) % count($otherClubs)];
                    }
                }

                // Club-Zuordnung (aktuell, ohne Enddatum)
                $clubAssignment = new PlayerClubAssignment();
                $clubAssignment->setPlayer($player);
                $clubAssignment->setClub($primaryClub);
                $clubAssignment->setStartDate(new DateTimeImmutable($currentStartDate));
                $manager->persist($clubAssignment);

                // Aktuelle Team-Zuordnung
                $assignmentType = $this->getAssignmentTypeByIndex($localIdx);
                $currentTeamAssignment = new PlayerTeamAssignment();
                $currentTeamAssignment->setPlayer($player);
                $currentTeamAssignment->setTeam($currentTeam);
                $currentTeamAssignment->setPlayerTeamAssignmentType($assignmentType);
                $currentTeamAssignment->setShirtNumber($localIdx + 1);
                $currentTeamAssignment->setStartDate(new DateTimeImmutable($currentStartDate));
                // Spieler ohne Enddatum = aktuell aktiv
                $manager->persist($currentTeamAssignment);

                // Frühere Team-Zuordnung für 25% der Spieler (zeigt 3-Jahres-History)
                if (0 !== $teamIdx % 3 && 0 === $localIdx % 4) {
                    $prevTeamIdx = ($teamIdx + 13) % self::TOTAL_TEAMS;
                    /** @var Team $prevTeam */
                    $prevTeam = $this->getReference('lt_team_' . $prevTeamIdx, Team::class);

                    $prevEndDate = (1 === $teamIdx % 3) ? '2024-06-30' : '2025-06-30';
                    $prevStartDate = (1 === $teamIdx % 3) ? '2022-07-01' : '2023-07-01';

                    $pastAssignment = new PlayerTeamAssignment();
                    $pastAssignment->setPlayer($player);
                    $pastAssignment->setTeam($prevTeam);
                    $pastAssignment->setPlayerTeamAssignmentType($this->assignmentTypes['vertragsspieler']);
                    $pastAssignment->setStartDate(new DateTimeImmutable($prevStartDate));
                    $pastAssignment->setEndDate(new DateTimeImmutable($prevEndDate));
                    $manager->persist($pastAssignment);

                    // Frühere Club-Zuordnung (falls anderer Klub)
                    $prevClubs = $prevTeam->getClubs()->toArray();
                    if (!empty($prevClubs) && $prevClubs[0]->getId() !== $primaryClub->getId()) {
                        $prevClubAssignment = new PlayerClubAssignment();
                        $prevClubAssignment->setPlayer($player);
                        $prevClubAssignment->setClub($prevClubs[0]);
                        $prevClubAssignment->setStartDate(new DateTimeImmutable($prevStartDate));
                        $prevClubAssignment->setEndDate(new DateTimeImmutable($prevEndDate));
                        $manager->persist($prevClubAssignment);
                    }
                }

                // Leihgabe: 5% der Spieler (localIdx % 15 == 0)
                if (0 === $localIdx % 15 && $globalIdx > 20) {
                    $loanTeamIdx = ($teamIdx + 7) % self::TOTAL_TEAMS;
                    /** @var Team $loanTeam */
                    $loanTeam = $this->getReference('lt_team_' . $loanTeamIdx, Team::class);

                    $loanStartDate = '2024-01-15';
                    // Einige Leihen sind noch aktiv, andere beendet
                    $loanEndDate = (0 === $teamIdx % 2) ? '2024-06-30' : null;

                    $loanAssignment = new PlayerTeamAssignment();
                    $loanAssignment->setPlayer($player);
                    $loanAssignment->setTeam($loanTeam);
                    $loanAssignment->setPlayerTeamAssignmentType($this->assignmentTypes['leihgabe']);
                    $loanAssignment->setStartDate(new DateTimeImmutable($loanStartDate));
                    if (null !== $loanEndDate) {
                        $loanAssignment->setEndDate(new DateTimeImmutable($loanEndDate));
                    }
                    $manager->persist($loanAssignment);
                }

                // Spieler mit Doppelter Spielberechtigung (Jugend-/Seniorenkombi)
                if (0 === $localIdx % 20 && $globalIdx > 50 && 'A_JUNIOREN' === $ageGroup->getCode()) {
                    $seniorTeamIdx = ($teamIdx + 1) % self::TOTAL_TEAMS;
                    /** @var Team $seniorTeam */
                    $seniorTeam = $this->getReference('lt_team_' . $seniorTeamIdx, Team::class);

                    $doppelAssignment = new PlayerTeamAssignment();
                    $doppelAssignment->setPlayer($player);
                    $doppelAssignment->setTeam($seniorTeam);
                    $doppelAssignment->setPlayerTeamAssignmentType($this->assignmentTypes['doppelte_spielberechtigung']);
                    $doppelAssignment->setStartDate(new DateTimeImmutable('2025-07-01'));
                    $manager->persist($doppelAssignment);
                }

                if ($globalIdx < 400) {
                    $this->addReference('lt_player_' . $globalIdx, $player);
                }

                ++$globalIdx;
                ++$persistCount;

                if (0 === $persistCount % self::BATCH_SIZE) {
                    $manager->flush();
                }
            }
        }

        $manager->flush();
    }

    private function loadMasterData(): void
    {
        $positionCodes = ['tw', 'iv', 'rv', 'lv', 'dm', 'zm', 'om', 'rm', 'lm', 'ra', 'la', 'st'];
        foreach ($positionCodes as $code) {
            $this->positions[$code] = $this->getReference('position_' . $code, Position::class);
        }

        foreach (['left', 'right', 'both'] as $code) {
            $this->strongFeet[$code] = $this->getReference('strong_foot_' . $code, StrongFoot::class);
        }

        $typeKeys = [
            'vertragsspieler', 'leihgabe', 'gastspieler', 'testspieler',
            'jugendspieler', 'doppelte_spielberechtigung', 'kooperationsspieler',
        ];
        foreach ($typeKeys as $key) {
            $this->assignmentTypes[$key] = $this->getReference(
                'player_team_assignment_type_' . $key,
                PlayerTeamAssignmentType::class
            );
        }

        // Gewichtetes Nationalitäten-Rad (100 Einträge, index % 100 ergibt reale DE-Verteilung)
        // DE 70%, TR 5%, PL 3%, HR/RS/BA/IT je 2%, Rest je 1%
        $weights = [
            'de' => 70, 'tr' => 5, 'pl' => 3,
            'hr' => 2, 'rs' => 2, 'ba' => 2, 'it' => 2,
            'es' => 1, 'fr' => 1, 'gr' => 1, 'pt' => 1,
            'nl' => 1, 'ua' => 1, 'ro' => 1, 'at' => 1,
            'br' => 1, 'ng' => 1, 'gh' => 1, 'ma' => 1, 'xk' => 1,
        ];
        foreach ($weights as $iso => $count) {
            /** @var Nationality $nationality */
            $nationality = $this->getReference('nationality_' . $iso, Nationality::class);
            for ($i = 0; $i < $count; ++$i) {
                $this->nationalityWheel[] = $nationality;
            }
        }
    }

    private function getAssignmentTypeByIndex(int $localIdx): PlayerTeamAssignmentType
    {
        return match (true) {
            $localIdx < 12 => $this->assignmentTypes['vertragsspieler'],
            $localIdx < 14 => $this->assignmentTypes['gastspieler'],
            $localIdx < 16 => $this->assignmentTypes['testspieler'],
            $localIdx < 17 => $this->assignmentTypes['jugendspieler'],
            default => $this->assignmentTypes['kooperationsspieler'],
        };
    }

    private function generateBirthdate(string $ageGroupCode): DateTime
    {
        // Exakte Geburtsjahre je Altersgruppe, Bezugsdatum 01.01.2026.
        // Altersberechnung: Alter am 01.01.2026 = 2026 - Geburtsjahr.
        // Die Ranges sind non-overlapping, damit ein Spieler eindeutig
        // seiner Altersgruppe zugeordnet werden kann.
        //
        // AgeGroup minAge/maxAge → Geburtsjahrgang:
        //   SENIOREN   (≥19)      → ≤2006  → Testdaten: 1970-2006
        //   A_JUNIOREN (17-18)    → 2007-2008
        //   B_JUNIOREN (15-16)    → 2009-2010
        //   C_JUNIOREN (13-14)    → 2011-2012
        //   D_JUNIOREN (11-12)    → 2013-2014
        //   E_JUNIOREN (9-10)     → 2015-2016
        //   F_JUNIOREN (7-8)      → 2017-2018
        //   G_JUNIOREN (0-6)      → 2019-2025
        $ranges = [
            'SENIOREN' => [1970, 2006],
            'A_JUNIOREN' => [2007, 2008],
            'B_JUNIOREN' => [2009, 2010],
            'C_JUNIOREN' => [2011, 2012],
            'D_JUNIOREN' => [2013, 2014],
            'E_JUNIOREN' => [2015, 2016],
            'F_JUNIOREN' => [2017, 2018],
            'G_JUNIOREN' => [2019, 2025],
        ];

        [$minYear, $maxYear] = $ranges[$ageGroupCode] ?? [1980, 2005];
        $year = rand($minYear, $maxYear);
        $month = rand(1, 12);
        $day = rand(1, 28);

        return new DateTime(
            $year . '-'
            . str_pad((string) $month, 2, '0', STR_PAD_LEFT) . '-'
            . str_pad((string) $day, 2, '0', STR_PAD_LEFT)
        );
    }
}
