<?php

namespace App\Event;

use App\Entity\CalendarEvent;
use App\Entity\User;

/**
 * Fired when a user creates a new CalendarEvent.
 */
final class CalendarEventCreatedEvent
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
