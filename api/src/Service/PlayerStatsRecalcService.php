<?php

namespace App\Service;

use App\Entity\Game;
use App\Entity\Player;
use App\Entity\PlayerGameStats;
use App\Repository\PlayerRepository;
use Doctrine\ORM\EntityManagerInterface;

/**
 * Berechnet die Spielminuten aller am Spiel beteiligten Spieler
 * aus matchPlan (Startelf) + Substitutions (Ein-/Auswechslungen) und
 * persistiert das Ergebnis in player_game_stats.
 *
 * Diese Klasse ist idempotent: sie löscht immer zuerst alle bestehenden
 * Einträge für das Spiel und schreibt sie neu – damit ist ein mehrfacher
 * Aufruf (z.B. durch den Messenger-Worker) immer sicher.
 */
class PlayerStatsRecalcService
{
    public function __construct(
        private EntityManagerInterface $em,
        private PlayerRepository $playerRepository,
    ) {
    }

    /**
     * Berechnet und persistiert player_game_stats für ein Spiel.
     * Kann direkt aufgerufen werden (z.B. CSV-Import) oder vom Messenger-Handler.
     *
     * Bedingung: Das Game-Objekt muss vollständig geladen sein (matchPlan + substitutions).
     */
    public function recalcForGame(Game $game): void
    {
        // 1. Alle bisherigen Stats für dieses Spiel löschen (atomar, per DQL)
        $this->em->createQuery(
            'DELETE FROM App\Entity\PlayerGameStats pgs WHERE pgs.game = :game'
        )
            ->setParameter('game', $game)
            ->execute();

        // 2. Gesamtspieldauer ermitteln
        $totalMinutes = $game->getHalfDuration() * 2
            + ($game->getFirstHalfExtraTime() ?? 0)
            + ($game->getSecondHalfExtraTime() ?? 0);

        // Fallback: Wenn keine Halbzeit-Infos vorhanden sind
        if (0 === $totalMinutes) {
            $totalMinutes = 90;
        }

        // 3. Teilnahme-Map aufbauen: playerId => ['from' => int, 'to' => int]
        /** @var array<int, array{from: int, to: int}> $participants */
        $participants = [];

        // 3a. Startelf aus matchPlan extrahieren
        $matchPlan = $game->getMatchPlan();
        if (is_array($matchPlan) && !empty($matchPlan['phases'])) {
            foreach ($matchPlan['phases'] as $phase) {
                if (($phase['sourceType'] ?? '') === 'start') {
                    foreach ($phase['players'] as $mp) {
                        if (!empty($mp['isRealPlayer']) && !empty($mp['playerId'])) {
                            $participants[(int) $mp['playerId']] = [
                                'from' => 0,
                                'to' => $totalMinutes,
                            ];
                        }
                    }
                    break; // nur die erste 'start'-Phase
                }
            }
        }

        // 3b. Auswechslungen verarbeiten (chronologisch sortiert)
        $substitutions = $game->getSubstitutions()->toArray();
        usort($substitutions, fn ($a, $b) => $a->getMinute() <=> $b->getMinute());

        foreach ($substitutions as $sub) {
            $outId = $sub->getPlayerOut()->getId();
            $inId = $sub->getPlayerIn()->getId();
            $minute = $sub->getMinute();

            // Ausgewechselter Spieler: Austrittsminute setzen
            if (isset($participants[$outId])) {
                $participants[$outId]['to'] = $minute;
            } else {
                // Spieler war nicht in der Startelf (z.B. matchPlan fehlt), aber wurde ausgewechselt
                // → Er muss von Minute 0 an gespielt haben
                $participants[$outId] = ['from' => 0, 'to' => $minute];
            }

            // Eingewechselter Spieler: Eintrittsminute setzen
            $participants[$inId] = ['from' => $minute, 'to' => $totalMinutes];
        }

        if (empty($participants)) {
            // Keine Daten vorhanden – nichts zu persistieren
            return;
        }

        // 4. Alle relevanten Player in einem Query laden (kein N+1)
        $playerIds = array_keys($participants);
        /** @var Player[] $players */
        $players = $this->playerRepository->findBy(['id' => $playerIds]);
        $playerMap = [];
        foreach ($players as $player) {
            $playerMap[$player->getId()] = $player;
        }

        // 5. PlayerGameStats-Einträge anlegen
        foreach ($participants as $playerId => $interval) {
            $minutesPlayed = max(0, $interval['to'] - $interval['from']);
            if (0 === $minutesPlayed) {
                continue;
            }

            if (!isset($playerMap[$playerId])) {
                continue; // Spieler existiert nicht (mehr)
            }

            $stats = new PlayerGameStats($game, $playerMap[$playerId]);
            $stats->setMinutesPlayed($minutesPlayed);
            $this->em->persist($stats);
        }

        $this->em->flush();
    }
}
