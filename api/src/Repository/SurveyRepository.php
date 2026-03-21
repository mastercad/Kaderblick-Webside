<?php

namespace App\Repository;

use App\Entity\Survey;
use DateTimeImmutable;
use Doctrine\Bundle\DoctrineBundle\Repository\ServiceEntityRepository;
use Doctrine\Persistence\ManagerRegistry;

/**
 * @template-extends ServiceEntityRepository<Survey>
 */
class SurveyRepository extends ServiceEntityRepository
{
    public function __construct(ManagerRegistry $registry)
    {
        parent::__construct($registry, Survey::class);
    }

    /**
     * Find active surveys with a due date in the future that may need reminders.
     *
     * @return Survey[]
     */
    public function findSurveysNeedingReminders(): array
    {
        return $this->createQueryBuilder('s')
            ->where('s.dueDate IS NOT NULL')
            ->andWhere('s.dueDate > :now')
            ->setParameter('now', new DateTimeImmutable())
            ->getQuery()
            ->getResult();
    }
}
