<?php

namespace App\Repository;

use App\Entity\SurveyOption;
use App\Entity\User;
use Doctrine\Bundle\DoctrineBundle\Repository\ServiceEntityRepository;
use Doctrine\Persistence\ManagerRegistry;

/**
 * @template-extends ServiceEntityRepository<SurveyOption>
 */
class SurveyOptionRepository extends ServiceEntityRepository
{
    public function __construct(ManagerRegistry $registry)
    {
        parent::__construct($registry, SurveyOption::class);
    }

    /**
     * Liefert System-Optionen (createdBy IS NULL) + eigene Optionen des Benutzers.
     * Wird beim Erstellen/Bearbeiten einer Umfrage verwendet.
     *
     * @return SurveyOption[]
     */
    public function findAvailableForUser(User $user): array
    {
        return $this->createQueryBuilder('o')
            ->where('o.createdBy IS NULL')
            ->orWhere('o.createdBy = :user')
            ->setParameter('user', $user)
            ->orderBy('o.optionText', 'ASC')
            ->getQuery()
            ->getResult();
    }

    /**
     * Liefert nur die vom Benutzer erstellten Optionen.
     *
     * @return SurveyOption[]
     */
    public function findByUser(User $user): array
    {
        return $this->findBy(['createdBy' => $user], ['optionText' => 'ASC']);
    }
}
