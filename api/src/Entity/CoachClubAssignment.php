<?php

namespace App\Entity;

use App\Repository\CoachClubAssignmentRepository;
use DateTimeInterface;
use Doctrine\ORM\Mapping as ORM;
use Symfony\Component\Serializer\Attribute\Context;
use Symfony\Component\Serializer\Attribute\Groups;

#[ORM\Entity(repositoryClass: CoachClubAssignmentRepository::class)]
#[ORM\Table(name: 'coach_club_assignments')]
#[ORM\Index(name: 'idx_coach_club_assignment_coach_id', columns: ['coach_id'])]
#[ORM\Index(name: 'idx_coach_club_assignment_club_id', columns: ['club_id'])]
class CoachClubAssignment
{
    #[ORM\Id]
    #[ORM\GeneratedValue]
    #[ORM\Column(type: 'integer')]
    #[Groups(['coach_club_assignment:read', 'coach_club_assignment:write', 'club:read', 'coach:read'])]
    /** @phpstan-ignore-next-line Property is set by Doctrine and never written in code */
    private ?int $id = null;

    #[Groups(['coach_club_assignment:read', 'coach_club_assignment:write', 'club:read'])]
    #[ORM\ManyToOne(targetEntity: Coach::class, inversedBy: 'coachClubAssignments')]
    #[ORM\JoinColumn(name: 'coach_id', referencedColumnName: 'id', nullable: false)]
    private ?Coach $coach = null;

    #[ORM\ManyToOne(targetEntity: Club::class, inversedBy: 'coachClubAssignments')]
    #[Groups(['coach_club_assignment:read', 'coach_club_assignment:write', 'coach:read'])]
    #[ORM\JoinColumn(name: 'club_id', referencedColumnName: 'id', nullable: false)]
    private ?Club $club = null;

    #[ORM\Column(type: 'date', nullable: true)]
    #[Groups(['coach_club_assignment:read', 'coach_club_assignment:write', 'club:read'])]
    #[Context(normalizationContext: ['datetime_format' => 'd.m.Y'])]
    private DateTimeInterface $startDate;

    #[Groups(['coach_club_assignment:read', 'coach_club_assignment:write'])]
    #[Context(normalizationContext: ['datetime_format' => 'd.m.Y'])]
    #[ORM\Column(type: 'date', nullable: true)]
    private ?DateTimeInterface $endDate = null;

    #[Groups(['coach_club_assignment:read', 'coach_club_assignment:write'])]
    #[ORM\Column(type: 'boolean', options: ['default' => true])]
    private bool $active = true;

    public function getId(): ?int
    {
        return $this->id;
    }

    public function getCoach(): ?Coach
    {
        return $this->coach;
    }

    public function setCoach(?Coach $coach): self
    {
        $this->coach = $coach;

        return $this;
    }

    public function getClub(): ?Club
    {
        return $this->club;
    }

    public function setClub(?Club $club): self
    {
        $this->club = $club;

        return $this;
    }

    public function getStartDate(): ?DateTimeInterface
    {
        return $this->startDate;
    }

    public function setStartDate(DateTimeInterface $startDate): self
    {
        $this->startDate = $startDate;

        return $this;
    }

    public function getEndDate(): ?DateTimeInterface
    {
        return $this->endDate;
    }

    public function setEndDate(?DateTimeInterface $endDate): self
    {
        $this->endDate = $endDate;

        return $this;
    }

    public function isActive(): bool
    {
        return $this->active;
    }

    public function setActive(bool $active): self
    {
        $this->active = $active;

        return $this;
    }

    public function __toString(): string
    {
        $end = $this->endDate ? ' bis ' . $this->endDate->format('d.m.Y') : '';

        return sprintf(
            '%s bei %s (seit %s%s)',
            $this->coach ? $this->coach->getFullName() : 'Unbekannter Spieler',
            $this->club ? $this->club->getName() : 'Unbekanntes Verein',
            $this->startDate->format('d.m.Y'),
            $end
        );
    }
}
