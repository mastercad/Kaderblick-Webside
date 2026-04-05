<?php

namespace App\Repository;

use App\Entity\CalendarEvent;
use App\Entity\MatchdayView;
use App\Entity\User;
use DateTimeImmutable;
use Doctrine\Bundle\DoctrineBundle\Repository\ServiceEntityRepository;
use Doctrine\Persistence\ManagerRegistry;

/**
 * @extends ServiceEntityRepository<MatchdayView>
 */
class MatchdayViewRepository extends ServiceEntityRepository
{
    public function __construct(ManagerRegistry $registry)
    {
        parent::__construct($registry, MatchdayView::class);
    }

    public function findByUserAndEvent(User $user, CalendarEvent $event): ?MatchdayView
    {
        return $this->findOneBy(['user' => $user, 'calendarEvent' => $event]);
    }

    /**
     * Upserts a MatchdayView record for the given user/event and returns the viewedAt timestamp
     * of the PREVIOUS view (or null when viewed for the first time).
     */
    public function markViewed(User $user, CalendarEvent $event): ?DateTimeImmutable
    {
        $existing = $this->findByUserAndEvent($user, $event);
        $previousViewedAt = $existing?->getViewedAt();
        $now = new DateTimeImmutable();

        if (null === $existing) {
            $existing = (new MatchdayView())
                ->setUser($user)
                ->setCalendarEvent($event)
                ->setViewedAt($now);
            $this->getEntityManager()->persist($existing);
        } else {
            $existing->setViewedAt($now);
        }

        $this->getEntityManager()->flush();

        return $previousViewedAt;
    }
}
