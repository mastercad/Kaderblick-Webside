<?php

namespace App\Event;

use App\Entity\GameEvent;
use App\Entity\User;

/**
 * Fired when an existing GameEvent is modified (e.g. timestamp shifted).
 *
 * The XpRegistrationService applies a configurable cooldown per
 * (user, 'game_event_updated', GameEvent::id) to prevent "left-right spam".
 */
final class GameEventUpdatedEvent
{
    public function __construct(
        private User $user,
        private GameEvent $gameEvent,
    ) {
    }

    public function getUser(): User
    {
        return $this->user;
    }

    public function getGameEvent(): GameEvent
    {
        return $this->gameEvent;
    }
}
