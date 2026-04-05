<?php

namespace App\Entity;

use App\Repository\MatchdayViewRepository;
use DateTimeImmutable;
use Doctrine\DBAL\Types\Types;
use Doctrine\ORM\Mapping as ORM;

#[ORM\Entity(repositoryClass: MatchdayViewRepository::class)]
#[ORM\Table(name: 'matchday_views')]
#[ORM\UniqueConstraint(name: 'uniq_matchday_view_user_event', columns: ['user_id', 'calendar_event_id'])]
#[ORM\Index(name: 'idx_matchday_view_user', columns: ['user_id'])]
#[ORM\Index(name: 'idx_matchday_view_event', columns: ['calendar_event_id'])]
class MatchdayView
{
    #[ORM\Id]
    #[ORM\GeneratedValue]
    #[ORM\Column]
    /** @phpstan-ignore-next-line Property is set by Doctrine and never written in code */
    private ?int $id = null;

    #[ORM\ManyToOne]
    #[ORM\JoinColumn(name: 'user_id', referencedColumnName: 'id', nullable: false, onDelete: 'CASCADE')]
    private ?User $user = null;

    #[ORM\ManyToOne]
    #[ORM\JoinColumn(name: 'calendar_event_id', referencedColumnName: 'id', nullable: false, onDelete: 'CASCADE')]
    private ?CalendarEvent $calendarEvent = null;

    #[ORM\Column(type: Types::DATETIME_IMMUTABLE)]
    private ?DateTimeImmutable $viewedAt = null;

    public function getId(): ?int
    {
        return $this->id;
    }

    public function getUser(): ?User
    {
        return $this->user;
    }

    public function setUser(?User $user): self
    {
        $this->user = $user;

        return $this;
    }

    public function getCalendarEvent(): ?CalendarEvent
    {
        return $this->calendarEvent;
    }

    public function setCalendarEvent(?CalendarEvent $calendarEvent): self
    {
        $this->calendarEvent = $calendarEvent;

        return $this;
    }

    public function getViewedAt(): ?DateTimeImmutable
    {
        return $this->viewedAt;
    }

    public function setViewedAt(DateTimeImmutable $viewedAt): self
    {
        $this->viewedAt = $viewedAt;

        return $this;
    }
}
