<?php

namespace App\Event;

use App\Entity\CalendarEvent;
use App\Entity\User;

/**
 * Fired after confirmation that a user participated in a match.
 */
final class MatchAttendedEvent
{
    public function __construct(
        private User $user,
        private CalendarEvent $calendarEvent,
    ) {
    }

    public function getUser(): User
    {
        return $this->user;
    }

    public function getCalendarEvent(): CalendarEvent
    {
        return $this->calendarEvent;
    }
}
