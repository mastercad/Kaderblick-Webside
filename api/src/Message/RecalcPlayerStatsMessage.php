<?php

namespace App\Message;

/**
 * Löst die asynchrone Neuberechnung der player_game_stats für ein Spiel aus.
 *
 * Wird vom PlayerStatsRecalcListener nach Änderungen an matchPlan,
 * Halbzeitdauer oder Substitutions dispatched und vom
 * RecalcPlayerStatsHandler verarbeitet.
 */
final readonly class RecalcPlayerStatsMessage
{
    public function __construct(
        public int $gameId,
    ) {
    }
}
