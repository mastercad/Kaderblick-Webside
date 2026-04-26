<?php

namespace App\Repository;

use App\Entity\Coach;
use App\Entity\Player;
use App\Entity\User;
use App\Entity\Watchlist;
use Doctrine\Bundle\DoctrineBundle\Repository\ServiceEntityRepository;
use Doctrine\Persistence\ManagerRegistry;

/**
 * @extends ServiceEntityRepository<Watchlist>
 */
class WatchlistRepository extends ServiceEntityRepository
{
    public function __construct(ManagerRegistry $registry)
    {
        parent::__construct($registry, Watchlist::class);
    }

    /**
     * Returns all watchlist entries for the given user, newest first.
     *
     * @return Watchlist[]
     */
    public function findForUser(User $user): array
    {
        return $this->createQueryBuilder('w')
            ->andWhere('w.watcher = :user')
            ->setParameter('user', $user)
            ->orderBy('w.createdAt', 'DESC')
            ->getQuery()
            ->getResult();
    }

    public function findByWatcherAndPlayer(User $watcher, Player $player): ?Watchlist
    {
        return $this->createQueryBuilder('w')
            ->andWhere('w.watcher = :watcher')
            ->andWhere('w.watchedPlayer = :player')
            ->setParameter('watcher', $watcher)
            ->setParameter('player', $player)
            ->setMaxResults(1)
            ->getQuery()
            ->getOneOrNullResult();
    }

    public function findByWatcherAndCoach(User $watcher, Coach $coach): ?Watchlist
    {
        return $this->createQueryBuilder('w')
            ->andWhere('w.watcher = :watcher')
            ->andWhere('w.watchedCoach = :coach')
            ->setParameter('watcher', $watcher)
            ->setParameter('coach', $coach)
            ->setMaxResults(1)
            ->getQuery()
            ->getOneOrNullResult();
    }

    /**
     * Returns the User entities of all watchers of a given player (for sending notifications).
     *
     * @return User[]
     */
    public function findWatcherUsersForPlayer(Player $player): array
    {
        $entries = $this->createQueryBuilder('w')
            ->andWhere('w.watchedPlayer = :player')
            ->setParameter('player', $player)
            ->getQuery()
            ->getResult();

        return array_map(fn (Watchlist $w) => $w->getWatcher(), $entries);
    }

    /**
     * Returns the User entities of all watchers of a given coach (for sending notifications).
     *
     * @return User[]
     */
    public function findWatcherUsersForCoach(Coach $coach): array
    {
        $entries = $this->createQueryBuilder('w')
            ->andWhere('w.watchedCoach = :coach')
            ->setParameter('coach', $coach)
            ->getQuery()
            ->getResult();

        return array_map(fn (Watchlist $w) => $w->getWatcher(), $entries);
    }
}
