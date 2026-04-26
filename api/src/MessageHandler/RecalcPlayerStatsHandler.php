<?php

namespace App\MessageHandler;

use App\Message\RecalcPlayerStatsMessage;
use App\Repository\GameRepository;
use App\Service\PlayerStatsRecalcService;
use Symfony\Component\Messenger\Attribute\AsMessageHandler;

#[AsMessageHandler]
final class RecalcPlayerStatsHandler
{
    public function __construct(
        private GameRepository $gameRepository,
        private PlayerStatsRecalcService $recalcService,
    ) {
    }

    public function __invoke(RecalcPlayerStatsMessage $message): void
    {
        $game = $this->gameRepository->find($message->gameId);

        if (null === $game) {
            // Spiel wurde zwischenzeitlich gelöscht – nichts zu tun
            return;
        }

        $this->recalcService->recalcForGame($game);
    }
}
