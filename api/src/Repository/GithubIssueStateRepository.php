<?php

namespace App\Repository;

use App\Entity\GithubIssueState;
use Doctrine\Bundle\DoctrineBundle\Repository\ServiceEntityRepository;
use Doctrine\Persistence\ManagerRegistry;

/**
 * @extends ServiceEntityRepository<GithubIssueState>
 */
class GithubIssueStateRepository extends ServiceEntityRepository
{
    public function __construct(ManagerRegistry $registry)
    {
        parent::__construct($registry, GithubIssueState::class);
    }

    /**
     * Returns all tracked states indexed by issue number for fast lookup.
     *
     * @return array<int, GithubIssueState>
     */
    public function findAllKeyedByNumber(): array
    {
        $result = [];
        foreach ($this->findAll() as $state) {
            $result[$state->getIssueNumber()] = $state;
        }

        return $result;
    }
}
