<?php

namespace App\Repository;

use App\Entity\News;
use App\Entity\User;
use Doctrine\Bundle\DoctrineBundle\Repository\ServiceEntityRepository;
use Doctrine\Persistence\ManagerRegistry;

/**
 * @template-extends ServiceEntityRepository<News>
 */
class NewsRepository extends ServiceEntityRepository implements NewsRepositoryInterface
{
    public function __construct(ManagerRegistry $registry)
    {
        parent::__construct($registry, News::class);
    }

    /**
     * @return News[]
     */
    public function findLatest(int $limit = 5): array
    {
        return $this->createQueryBuilder('n')
            ->orderBy('n.createdAt', 'DESC')
            ->setMaxResults($limit)
            ->getQuery()
            ->getResult();
    }

    /**
     * @return News[]
     */
    public function findForUser(?User $user, ?int $limit = 5): array
    {
        $qb = $this->createQueryBuilder('n');
        $qb->where('n.visibility = :platform')
            ->setParameter('platform', 'platform');

        $teamIds = [];
        $clubIds = [];
        foreach ($user->getUserRelations() as $relation) {
            if ($relation->getPlayer()) {
                foreach ($relation->getPlayer()->getPlayerTeamAssignments() as $pta) {
                    $team = $pta->getTeam();
                    $teamIds[] = $team->getId();
                    // Auch die Vereine der Teams hinzufügen
                    foreach ($team->getClubs() as $club) {
                        $clubIds[] = $club->getId();
                    }
                }
                foreach ($relation->getPlayer()->getPlayerClubAssignments() as $pca) {
                    $club = $pca->getClub();
                    $clubIds[] = $club->getId();
                }
            }
            if ($relation->getCoach()) {
                foreach ($relation->getCoach()->getCoachTeamAssignments() as $cta) {
                    $team = $cta->getTeam();
                    $teamIds[] = $team->getId();
                    // Auch die Vereine der Teams hinzufügen
                    foreach ($team->getClubs() as $club) {
                        $clubIds[] = $club->getId();
                    }
                }
                foreach ($relation->getCoach()->getCoachClubAssignments() as $cca) {
                    $club = $cca->getClub();
                    if ($club) {
                        $clubIds[] = $club->getId();
                    }
                }
            }
        }
        $teamIds = array_unique($teamIds);
        $clubIds = array_unique($clubIds);

        if ($clubIds) {
            $qb->orWhere('n.visibility = :club AND n.club IN (:clubs)')
                ->setParameter('club', 'club')
                ->setParameter('clubs', $clubIds);
        }
        if ($teamIds) {
            $qb->orWhere('n.visibility = :team AND n.team IN (:teams)')
                ->setParameter('team', 'team')
                ->setParameter('teams', $teamIds);
        }

        $qb->orderBy('n.createdAt', 'DESC');

        if (null !== $limit) {
            $qb->setMaxResults($limit);
        }

        return $qb->getQuery()->getResult();
    }

    /**
     * @return News[]
     */
    public function findPublicPlatformNews(int $limit = 20): array
    {
        return $this->createQueryBuilder('n')
            ->where('n.visibility = :platform')
            ->setParameter('platform', 'platform')
            ->orderBy('n.createdAt', 'DESC')
            ->setMaxResults($limit)
            ->getQuery()
            ->getResult();
    }
}
