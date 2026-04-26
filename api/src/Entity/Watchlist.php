<?php

namespace App\Entity;

use App\Repository\WatchlistRepository;
use DateTimeImmutable;
use Doctrine\ORM\Mapping as ORM;

/**
 * Represents a user watching a player or coach.
 * Exactly one of $watchedPlayer / $watchedCoach must be set.
 */
#[ORM\Entity(repositoryClass: WatchlistRepository::class)]
#[ORM\Table(name: 'watchlist')]
#[ORM\UniqueConstraint(name: 'uniq_watchlist_watcher_player', columns: ['watcher_id', 'watched_player_id'])]
#[ORM\UniqueConstraint(name: 'uniq_watchlist_watcher_coach', columns: ['watcher_id', 'watched_coach_id'])]
#[ORM\Index(name: 'idx_watchlist_watched_player', columns: ['watched_player_id'])]
#[ORM\Index(name: 'idx_watchlist_watched_coach', columns: ['watched_coach_id'])]
class Watchlist
{
    #[ORM\Id]
    #[ORM\GeneratedValue]
    #[ORM\Column(type: 'integer')]
    /** @phpstan-ignore-next-line Property is set by Doctrine and never written in code */
    private ?int $id = null;

    #[ORM\ManyToOne(targetEntity: User::class)]
    #[ORM\JoinColumn(name: 'watcher_id', referencedColumnName: 'id', nullable: false, onDelete: 'CASCADE')]
    private User $watcher;

    #[ORM\ManyToOne(targetEntity: Player::class)]
    #[ORM\JoinColumn(name: 'watched_player_id', referencedColumnName: 'id', nullable: true, onDelete: 'CASCADE')]
    private ?Player $watchedPlayer = null;

    #[ORM\ManyToOne(targetEntity: Coach::class)]
    #[ORM\JoinColumn(name: 'watched_coach_id', referencedColumnName: 'id', nullable: true, onDelete: 'CASCADE')]
    private ?Coach $watchedCoach = null;

    #[ORM\Column(name: 'is_anonymous', type: 'boolean', options: ['default' => true])]
    private bool $isAnonymous = true;

    #[ORM\Column(name: 'created_at', type: 'datetime_immutable')]
    private DateTimeImmutable $createdAt;

    public function __construct()
    {
        $this->createdAt = new DateTimeImmutable();
    }

    public function getId(): ?int
    {
        return $this->id;
    }

    public function getWatcher(): User
    {
        return $this->watcher;
    }

    public function setWatcher(User $watcher): static
    {
        $this->watcher = $watcher;

        return $this;
    }

    public function getWatchedPlayer(): ?Player
    {
        return $this->watchedPlayer;
    }

    public function setWatchedPlayer(?Player $player): static
    {
        $this->watchedPlayer = $player;

        return $this;
    }

    public function getWatchedCoach(): ?Coach
    {
        return $this->watchedCoach;
    }

    public function setWatchedCoach(?Coach $coach): static
    {
        $this->watchedCoach = $coach;

        return $this;
    }

    public function isAnonymous(): bool
    {
        return $this->isAnonymous;
    }

    public function setIsAnonymous(bool $isAnonymous): static
    {
        $this->isAnonymous = $isAnonymous;

        return $this;
    }

    public function getCreatedAt(): DateTimeImmutable
    {
        return $this->createdAt;
    }
}
