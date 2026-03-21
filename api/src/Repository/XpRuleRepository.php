<?php

namespace App\Repository;

use App\Entity\XpRule;
use Doctrine\Bundle\DoctrineBundle\Repository\ServiceEntityRepository;
use Doctrine\Persistence\ManagerRegistry;

/**
 * @extends ServiceEntityRepository<XpRule>
 */
class XpRuleRepository extends ServiceEntityRepository
{
    public function __construct(ManagerRegistry $registry)
    {
        parent::__construct($registry, XpRule::class);
    }

    public function findByActionType(string $actionType): ?XpRule
    {
        return $this->findOneBy(['actionType' => $actionType]);
    }

    public function findEnabledByActionType(string $actionType): ?XpRule
    {
        return $this->findOneBy(['actionType' => $actionType, 'enabled' => true]);
    }

    /**
     * Return all rules ordered by category, then label.
     *
     * @return XpRule[]
     */
    public function findAllOrdered(): array
    {
        return $this->createQueryBuilder('r')
            ->orderBy('r.category', 'ASC')
            ->addOrderBy('r.label', 'ASC')
            ->getQuery()
            ->getResult();
    }

    /**
     * Return rules keyed by actionType for fast lookup.
     *
     * @return array<string, XpRule>
     */
    public function findAllIndexedByActionType(): array
    {
        /** @var XpRule[] $rules */
        $rules = $this->findAll();
        $map = [];
        foreach ($rules as $rule) {
            $map[$rule->getActionType()] = $rule;
        }

        return $map;
    }
}
