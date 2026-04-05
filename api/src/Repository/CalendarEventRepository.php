<?php

namespace App\Repository;

use App\Entity\CalendarEvent;
use App\Entity\CalendarEventType;
use App\Entity\Game;
use App\Entity\Location;
use DateTime;
use DateTimeImmutable;
use Doctrine\Bundle\DoctrineBundle\Repository\ServiceEntityRepository;
use Doctrine\Persistence\ManagerRegistry;
use Symfony\Component\Security\Core\User\UserInterface;

/**
 * @template-extends ServiceEntityRepository<CalendarEvent>
 *
 * @implements OptimizedRepositoryInterface<CalendarEvent>
 */
class CalendarEventRepository extends ServiceEntityRepository implements OptimizedRepositoryInterface
{
    public function __construct(ManagerRegistry $registry)
    {
        parent::__construct($registry, CalendarEvent::class);
    }

    /**
     * @return CalendarEvent[]
     */
    public function findUpcoming(int $limit = 5, int $withinDays = 7): array
    {
        $until = (new DateTime())->modify("+{$withinDays} days");

        return $this->createQueryBuilder('ce')
            ->select('ce', 'cet', 'l', 'g', 'ht', 'at', 'gt')
            ->leftJoin('ce.calendarEventType', 'cet')
            ->leftJoin('ce.location', 'l')
            ->leftJoin('ce.game', 'g')
            ->leftJoin('g.homeTeam', 'ht')
            ->leftJoin('g.awayTeam', 'at')
            ->leftJoin('g.gameType', 'gt')
            ->where('ce.startDate >= :now')
            ->andWhere('ce.startDate <= :until')
            ->setParameter('now', new DateTime())
            ->setParameter('until', $until)
            ->orderBy('ce.startDate', 'ASC')
            ->setMaxResults($limit)
            ->getQuery()
            ->getResult();
    }

    /**
     * @return CalendarEvent[]
     */
    public function findAllEventsBetween(DateTimeImmutable $start, DateTimeImmutable $end): array
    {
        return $this->createQueryBuilder('ce')
            ->select('ce', 'cet', 'l', 'g', 'ht', 'at', 'gt', 'wd')
            ->leftJoin('ce.calendarEventType', 'cet')
            ->leftJoin('ce.location', 'l')
            ->leftJoin('ce.game', 'g')
            ->leftJoin('g.homeTeam', 'ht')
            ->leftJoin('g.awayTeam', 'at')
            ->leftJoin('g.gameType', 'gt')
            ->leftJoin('ce.weatherData', 'wd')
            ->where('ce.startDate BETWEEN :start AND :end')
            ->setParameter('start', $start)
            ->setParameter('end', $end)
            ->orderBy('ce.startDate', 'ASC')
            ->getQuery()
            ->getResult();
    }

    /**
     * @return CalendarEvent[]
     */
    public function findBetweenDates(DateTime $start, DateTime $end): array
    {
        return $this->createQueryBuilder('ce')
            ->leftJoin(Game::class, 'g', 'WITH', 'g.calendarEvent = ce')
            ->where('ce.startDate BETWEEN :start AND :end')
            ->setParameter('start', $start)
            ->setParameter('end', $end)
            ->orderBy('ce.startDate', 'ASC')
            ->getQuery()
            ->getResult();
    }

    /**
     * @return CalendarEvent[]
     */
    public function fetchFullList(?UserInterface $user = null): array
    {
        return $this->createQueryBuilder('ce')
            ->select('ce', 'cet', 'l', 'g')
            ->leftJoin(Game::class, 'g', 'WITH', 'g.calendarEvent IS NOT NULL AND g.calendarEvent = ce')
            ->leftJoin(Location::class, 'l', 'WITH', 'ce.location = l AND g.location = l')
            ->leftJoin(CalendarEventType::class, 'cet', 'WITH', 'ce.calendarEventType = cet')
            ->getQuery()
            ->getResult();
    }

    /**
     * @return CalendarEvent[]
     */
    public function fetchOptimizedList(?UserInterface $user = null): array
    {
        return $this->createQueryBuilder('ce')
            ->select('ce', 'cet', 'l', 'g')
            ->leftJoin(Game::class, 'g', 'WITH', 'g.calendarEvent = ce')
            ->leftJoin(Location::class, 'l', 'WITH', 'ce.location = l')
            ->leftJoin(CalendarEventType::class, 'cet', 'WITH', 'ce.calendarEventType = cet')
            ->getQuery()
            ->getResult();
    }

    /**
     * @return array<string, mixed>|null
     */
    public function fetchFullEntry(int $id, ?UserInterface $user = null): ?array
    {
        return $this->createQueryBuilder('ce')
            ->select('ce', 'cet', 'l', 'g')
            ->leftJoin(Game::class, 'g', 'WITH', 'g.calendarEvent = ce')
            ->leftJoin(Location::class, 'l', 'WITH', 'ce.location = l')
            ->leftJoin(CalendarEventType::class, 'cet', 'WITH', 'ce.calendarEventType = cet')
            ->where('t.id = :id')
            ->setParameter('id', $id)
            ->getQuery()
            ->getResult();
    }

    /**
     * @return array<string, mixed>|null
     */
    public function fetchOptimizedEntry(int $id, ?UserInterface $user = null): ?array
    {
        return $this->createQueryBuilder('ce')
            ->select('ce', 'cet', 'l', 'g')
            ->leftJoin(Game::class, 'g', 'WITH', 'g.calendarEvent = ce')
            ->leftJoin(Location::class, 'l', 'WITH', 'ce.location = l')
            ->leftJoin(CalendarEventType::class, 'cet', 'WITH', 'ce.calendarEventType = cet')
            ->where('t.id = :id')
            ->setParameter('id', $id)
            ->getQuery()
            ->getResult();
    }
}
