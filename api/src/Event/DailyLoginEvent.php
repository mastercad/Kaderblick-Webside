<?php

namespace App\Event;

use App\Entity\User;

/**
 * Fired once per day on successful JWT authentication.
 * Carries the user so the XpEventSubscriber can award daily-login XP.
 */
final class DailyLoginEvent
{
    public function __construct(private User $user)
    {
    }

    public function getUser(): User
    {
        return $this->user;
    }
}
