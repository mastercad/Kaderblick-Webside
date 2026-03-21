<?php

namespace App\Repository;

use App\Entity\ExternalCalendar;
use App\Entity\User;
use DateTime;
use Doctrine\Bundle\DoctrineBundle\Repository\ServiceEntityRepository;
use Doctrine\Persistence\ManagerRegistry;

/**
 * @extends ServiceEntityRepository<ExternalCalendar>
 */
class ExternalCalendarRepository extends ServiceEntityRepository
{
    public function __construct(ManagerRegistry $registry)
    {
        parent::__construct($registry, ExternalCalendar::class);
    }

    /** @return ExternalCalendar[] */
    public function findByUser(User $user): array
    {
        return $this->findBy(['user' => $user], ['createdAt' => 'DESC']);
    }

    /** @return ExternalCalendar[] Alle aktiven Kalender, die neu geladen werden müssen (älter als $minutes Minuten) */
    public function findStaleCalendars(int $minutes = 60): array
    {
        $threshold = new DateTime("-{$minutes} minutes");

        return $this->createQueryBuilder('ec')
            ->where('ec.isEnabled = true')
            ->andWhere('ec.lastFetchedAt IS NULL OR ec.lastFetchedAt < :threshold')
            ->setParameter('threshold', $threshold)
            ->getQuery()
            ->getResult();
    }
}
