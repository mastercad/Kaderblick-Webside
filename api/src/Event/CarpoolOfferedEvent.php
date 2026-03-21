<?php

namespace App\Event;

use App\Entity\TeamRide;
use App\Entity\User;

/**
 * Fired when a user offers a carpool / team ride.
 */
final class CarpoolOfferedEvent
{
    public function __construct(
        private User $user,
        private TeamRide $teamRide,
    ) {
    }

    public function getUser(): User
    {
        return $this->user;
    }

    public function getTeamRide(): TeamRide
    {
        return $this->teamRide;
    }
}
