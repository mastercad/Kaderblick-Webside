<?php

namespace App\Repository;

use App\Entity\Player;
use App\Entity\Team;
use App\Entity\User;
use Doctrine\Bundle\DoctrineBundle\Repository\ServiceEntityRepository;
use Doctrine\Persistence\ManagerRegistry;
use Symfony\Component\Security\Core\Role\RoleHierarchyInterface;
use Symfony\Component\Security\Core\User\UserInterface;

/**
 * @template-extends ServiceEntityRepository<Player>
 *
 * @implements OptimizedRepositoryInterface<Player>
 */
class PlayerRepository extends ServiceEntityRepository implements OptimizedRepositoryInterface
{
    private RoleHierarchyInterface $roleHierarchy;

    public function __construct(ManagerRegistry $registry, RoleHierarchyInterface $roleHierarchy)
    {
        parent::__construct($registry, Player::class);
        $this->roleHierarchy = $roleHierarchy;
    }

    /**
     * Finde alle Spieler, die aktuell (ohne Enddatum oder Enddatum in der Zukunft) einer der beiden Teams zugeordnet sind.
     *
     * @param Team[] $teams
     *
     * @return Player[]
     */
    public function findActiveByTeams(array $teams): array
    {
        if (empty($teams)) {
            return [];
        }

        $qb = $this->createQueryBuilder('p')
            ->distinct()
            ->innerJoin('p.playerTeamAssignments', 'pta')
            ->andWhere('pta.team IN (:teams)')
            ->andWhere('(pta.endDate IS NULL OR pta.endDate >= CURRENT_DATE())')
            ->setParameter('teams', $teams);

        return $qb->getQuery()->getResult();
    }

    /**
     * @param User $user
     *
     * @return Player[]
     */
    public function fetchFullList(?UserInterface $user = null): array
    {
        $qb = $this->createQueryBuilder('p');

        $reachableRoles = $this->roleHierarchy->getReachableRoleNames($user->getRoles());
        if ($user && !in_array('ROLE_ADMIN', $reachableRoles)) {
            // Über UserRelations die zugänglichen Player ermitteln (unabhängig vom RelationType)
            $playerIds = [];
            foreach ($user->getUserRelations() as $relation) {
                if ($relation->getPlayer()) {
                    $playerIds[] = $relation->getPlayer()->getId();
                }
            }

            if (!empty($playerIds)) {
                $qb->andWhere('p.id IN (:playerIds)')
                   ->setParameter('playerIds', $playerIds);
            } else {
                // Keine Berechtigung für Player
                $qb->andWhere('1 = 0'); // Keine Ergebnisse
            }
        }

        return $qb->getQuery()->getResult();
    }

    /**
     * @return Player[]
     */
    public function fetchOptimizedList(?UserInterface $user = null): array
    {
        $qb = $this->createQueryBuilder('p')
            ->select('p', 'pta', 'pna')
            ->leftJoin('p.playerTeamAssignments', 'pta', 'WITH', 'pta.player = p')
            ->leftJoin('p.playerNationalityAssignments', 'pna', 'WITH', 'pna.player = p')
            ->orderBy('p.lastName', 'ASC')
            ->addOrderBy('p.firstName', 'ASC');

        if ($user && !in_array('ROLE_ADMIN', $user->getRoles(), true)) {
            $teamIds = [];
            if ($user instanceof User) {
                foreach ($user->getUserRelations() as $relation) {
                    if ($relation->getPlayer()) {
                        // Alle Teams, in denen dieser Player spielt
                        foreach ($relation->getPlayer()->getPlayerTeamAssignments() as $pta) {
                            $team = $pta->getTeam();
                            $teamIds[] = $team->getId();
                        }
                    }
                    if ($relation->getCoach()) {
                        // Alle Teams, die dieser Coach trainiert
                        foreach ($relation->getCoach()->getCoachTeamAssignments() as $cta) {
                            $team = $cta->getTeam();
                            $teamIds[] = $team->getId();
                        }
                    }
                }
            }
            $teamIds = array_unique($teamIds);
            if ($teamIds) {
                $qb->join('p.playerTeamAssignments', 'pta_filter')
                   ->andWhere('pta_filter.team IN (:teamIds)')
                   ->setParameter('teamIds', $teamIds);
            } else {
                // User hat keine relevante Relation, keine Spieler anzeigen
                $qb->andWhere('1 = 0');
            }
        }

        return $qb->getQuery()->getResult();
    }

    /**
     * @return array<string, mixed>|null
     */
    public function fetchFullEntry(int $id, ?UserInterface $user = null): ?array
    {
        return $this->createQueryBuilder('p')
            ->select('p', 'pta', 'pna')
            ->leftJoin('p.playerTeamAssignments', 'pta', 'WITH', 'pta.player = p')
            ->leftJoin('p.playerNationalityAssignments', 'pna', 'WITH', 'pna.player = p')
            ->where('p.id = :id')
            ->setParameter('id', $id)
            ->getQuery()
            ->getOneOrNullResult();
    }

    /**
     * @return array<string, mixed>|null
     */
    public function fetchOptimizedEntry(int $id, ?UserInterface $user = null): ?array
    {
        return $this->createQueryBuilder('p')
            ->select('p', 'pta', 'pna')
            ->leftJoin('p.playerTeamAssignments', 'pta', 'WITH', 'pta.player = p')
            ->leftJoin('p.playerNationalityAssignments', 'pna', 'WITH', 'pna.player = p')
            ->where('p.id = :id')
            ->setParameter('id', $id)
            ->getQuery()
            ->getOneOrNullResult();
    }

    /**
     * @param User $user
     *
     * @return array<int, Player>
     */
    public function findVisiblePlayers(?UserInterface $user = null): array
    {
        $qb = $this->createQueryBuilder('p');

        if ($user && !in_array('ROLE_ADMIN', $user->getRoles(), true)) {
            // Über UserRelations die zugänglichen Player ermitteln
            $playerIds = [];
            foreach ($user->getUserRelations() as $relation) {
                if ($relation->getPlayer()) {
                    $playerIds[] = $relation->getPlayer()->getId();
                }
            }

            if (!empty($playerIds)) {
                $qb->andWhere('p.id IN (:playerIds)')
                   ->setParameter('playerIds', $playerIds);
            } else {
                // Keine Berechtigung für Player
                $qb->andWhere('1 = 0'); // Keine Ergebnisse
            }
        }

        return $qb->getQuery()->getResult();
    }

    /**
     * Global full-text search across all players regardless of club.
     * Searches firstName, lastName and their concatenation.
     *
     * @return Player[]
     */
    public function searchGlobal(string $q, int $limit = 20): array
    {
        $term = '%' . addcslashes($q, '%_') . '%';

        return $this->createQueryBuilder('p')
            ->leftJoin('p.playerClubAssignments', 'pca')
            ->leftJoin('pca.club', 'c')
            ->addSelect('pca', 'c')
            ->where(
                'LOWER(CONCAT(p.firstName, \' \', p.lastName)) LIKE LOWER(:term)'
                . ' OR LOWER(p.firstName) LIKE LOWER(:term)'
                . ' OR LOWER(p.lastName) LIKE LOWER(:term)'
            )
            ->setParameter('term', $term)
            ->orderBy('p.lastName', 'ASC')
            ->addOrderBy('p.firstName', 'ASC')
            ->setMaxResults($limit)
            ->getQuery()
            ->getResult();
    }
}
