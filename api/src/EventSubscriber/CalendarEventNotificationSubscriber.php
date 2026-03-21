<?php

namespace App\EventSubscriber;

use App\Event\CalendarEventCreatedEvent;
use App\Service\NotificationService;
use App\Service\TeamMembershipService;
use Exception;
use Psr\Log\LoggerInterface;
use Symfony\Component\EventDispatcher\EventSubscriberInterface;

/**
 * Sends push notifications to relevant users when a CalendarEvent is created.
 *
 * Recipients are resolved via TeamMembershipService::resolveEventRecipients(),
 * which respects team/club/user permissions, game teams, task assignments, etc.
 */
class CalendarEventNotificationSubscriber implements EventSubscriberInterface
{
    public function __construct(
        private readonly NotificationService $notificationService,
        private readonly TeamMembershipService $teamMembershipService,
        private readonly LoggerInterface $logger,
    ) {
    }

    public static function getSubscribedEvents(): array
    {
        return [
            CalendarEventCreatedEvent::class => 'onCalendarEventCreated',
        ];
    }

    public function onCalendarEventCreated(CalendarEventCreatedEvent $event): void
    {
        $calendarEvent = $event->getCalendarEvent();
        $creator = $event->getUser();

        // Don't notify for events that have already been removed (e.g. task template events)
        if (!$calendarEvent->getId()) {
            return;
        }

        try {
            $recipients = $this->teamMembershipService->resolveEventRecipients($calendarEvent, $creator);

            if (0 === count($recipients)) {
                return;
            }

            $eventTitle = $calendarEvent->getTitle();
            $startDate = $calendarEvent->getStartDate()?->format('d.m.Y H:i') ?? '';
            $location = $calendarEvent->getLocation();

            $notificationTitle = 'Neues Event: ' . $eventTitle;
            $lines = [];
            if ('' !== $startDate) {
                $lines[] = '📅 ' . $startDate;
            }
            if ($location) {
                $lines[] = '📍 ' . $location->getName();
            }
            $lines[] = 'Das Event "' . $eventTitle . '" wurde erstellt.';
            $notificationMessage = implode("\n", $lines);

            $this->notificationService->createNotificationForUsers(
                $recipients,
                'event_created',
                $notificationTitle,
                $notificationMessage,
                [
                    'eventId' => $calendarEvent->getId(),
                    'eventTitle' => $eventTitle,
                    'createdBy' => $creator->getFullName(),
                    'url' => '/calendar?eventId=' . $calendarEvent->getId(),
                ]
            );
        } catch (Exception $e) {
            $this->logger->error('Failed to send event-created notifications: ' . $e->getMessage(), [
                'eventId' => $calendarEvent->getId(),
                'creatorId' => $creator->getId(),
            ]);
        }
    }
}
