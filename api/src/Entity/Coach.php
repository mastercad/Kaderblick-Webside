<?php

namespace App\Entity;

use App\Repository\CoachRepository;
use DateTimeImmutable;
use DateTimeInterface;
use Doctrine\Common\Collections\ArrayCollection;
use Doctrine\Common\Collections\Collection;
use Doctrine\ORM\Mapping as ORM;
use Symfony\Component\Serializer\Attribute\Context;
use Symfony\Component\Serializer\Attribute\Groups;
use Symfony\Component\Validator\Constraints as Assert;

#[ORM\Entity(repositoryClass: CoachRepository::class)]
#[ORM\Table(name: 'coaches')]
class Coach
{
    #[ORM\Id]
    #[ORM\GeneratedValue]
    #[ORM\Column]
    #[Groups(['coach:read', 'coach:write', 'team:read', 'coach_team_assignment:read', 'coach_club_assignment:read', 'club:read'])]
    /** @phpstan-ignore-next-line Property is set by Doctrine and never written in code */
    private ?int $id = null;

    #[ORM\Column(length: 100)]
    #[Groups(['coach:read', 'coach:write', 'team:read', 'coach_team_assignment:read', 'coach_club_assignment:read', 'club:read'])]
    private string $firstName;

    #[ORM\Column(length: 100)]
    #[Groups(['coach:read', 'coach:write', 'team:read', 'coach_team_assignment:read', 'coach_club_assignment:read', 'club:read'])]
    private string $lastName;

    #[Groups(['coach:read', 'coach:write'])]
    #[Context(normalizationContext: ['datetime_format' => 'd.m.Y'])]
    #[ORM\Column(type: 'date', nullable: true)]
    private ?DateTimeInterface $birthdate = null;

    #[Groups(['coach:read', 'coach:write'])]
    #[ORM\Column(type: 'string', length: 255, nullable: true)]
    #[Assert\Email(message: 'Die E-Mail-Adresse {{ value }} ist nicht gültig.')]
    private ?string $email = null;

    /** @var Collection<int, CoachTeamAssignment> */
    #[Groups(['coach:read'])]
    #[ORM\OneToMany(targetEntity: CoachTeamAssignment::class, mappedBy: 'coach', cascade: ['persist'])]
    private Collection $coachTeamAssignments;

    /** @var Collection<int, CoachClubAssignment> */
    #[Groups(['coach:read'])]
    #[ORM\OneToMany(targetEntity: CoachClubAssignment::class, mappedBy: 'coach', cascade: ['persist'])]
    private Collection $coachClubAssignments;

    /** @var Collection<int, CoachNationalityAssignment> */
    #[Groups(['coach:read'])]
    #[ORM\OneToMany(targetEntity: CoachNationalityAssignment::class, mappedBy: 'coach')]
    private Collection $coachNationalityAssignments;

    /** @var Collection<int, CoachLicenseAssignment> */
    #[Groups(['coach:read'])]
    #[ORM\OneToMany(targetEntity: CoachLicenseAssignment::class, mappedBy: 'coach')]
    private Collection $coachLicenseAssignments;

    /** @var Collection<int, UserRelation> */
    #[Groups(['player:read'])]
    #[ORM\OneToMany(targetEntity: UserRelation::class, mappedBy: 'coach')]
    private Collection $userRelations;

    public function __construct()
    {
        $this->coachTeamAssignments = new ArrayCollection();
        $this->coachClubAssignments = new ArrayCollection();
        $this->coachNationalityAssignments = new ArrayCollection();
        $this->coachLicenseAssignments = new ArrayCollection();
        $this->userRelations = new ArrayCollection();
    }

    public function getId(): ?int
    {
        return $this->id;
    }

    public function getFirstName(): string
    {
        return $this->firstName;
    }

    public function setFirstName(string $firstName): self
    {
        $this->firstName = $firstName;

        return $this;
    }

    public function getLastName(): string
    {
        return $this->lastName;
    }

    public function setLastName(string $lastName): self
    {
        $this->lastName = $lastName;

        return $this;
    }

    public function getBirthdate(): ?DateTimeInterface
    {
        return $this->birthdate;
    }

    public function setBirthdate(?DateTimeInterface $birthdate): self
    {
        $this->birthdate = $birthdate;

        return $this;
    }

    public function getEmail(): ?string
    {
        return $this->email;
    }

    public function setEmail(?string $email): self
    {
        $this->email = $email;

        return $this;
    }

    /** @return Collection<int, CoachTeamAssignment> */
    public function getCoachTeamAssignments(): Collection
    {
        return $this->coachTeamAssignments;
    }

    public function addCoachTeamAssignment(CoachTeamAssignment $assignment): self
    {
        if (!$this->coachTeamAssignments->contains($assignment)) {
            $this->coachTeamAssignments->add($assignment);
            $assignment->setCoach($this);
        }

        return $this;
    }

    public function removeCoachTeamAssignment(CoachTeamAssignment $coachTeamAssignment): self
    {
        if ($this->coachTeamAssignments->removeElement($coachTeamAssignment)) {
            if ($coachTeamAssignment->getCoach() === $this) {
                $coachTeamAssignment->setCoach(null);
            }
        }

        return $this;
    }

    /** @return Collection<int, CoachClubAssignment> */
    public function getCoachClubAssignments(): Collection
    {
        return $this->coachClubAssignments;
    }

    public function addCoachClubAssignment(CoachClubAssignment $coachClubAssignment): self
    {
        if (!$this->coachClubAssignments->contains($coachClubAssignment)) {
            $this->coachClubAssignments->add($coachClubAssignment);
            $coachClubAssignment->setCoach($this);
        }

        return $this;
    }

    public function removeCoachClubAssignment(CoachClubAssignment $coachClubAssignment): self
    {
        if ($this->coachClubAssignments->removeElement($coachClubAssignment)) {
            if ($coachClubAssignment->getCoach() === $this) {
                $coachClubAssignment->setCoach(null);
            }
        }

        return $this;
    }

    /** @return Collection<int, CoachNationalityAssignment> */
    public function getCoachNationalityAssignments(): Collection
    {
        return $this->coachNationalityAssignments;
    }

    public function addCoachNationalityAssignment(CoachNationalityAssignment $coachNationalityAssignment): self
    {
        if (!$this->coachNationalityAssignments->contains($coachNationalityAssignment)) {
            $this->coachNationalityAssignments->add($coachNationalityAssignment);
            $coachNationalityAssignment->setCoach($this);
        }

        return $this;
    }

    public function removeCoachNationalityAssignment(CoachNationalityAssignment $coachNationalityAssignment): self
    {
        if ($this->coachNationalityAssignments->removeElement($coachNationalityAssignment)) {
            if ($coachNationalityAssignment->getCoach() === $this) {
                $coachNationalityAssignment->setCoach(null);
            }
        }

        return $this;
    }

    /** @return Collection<int, CoachLicenseAssignment> */
    public function getCoachLicenseAssignments(): Collection
    {
        return $this->coachLicenseAssignments->filter(function (CoachLicenseAssignment $coachLicenseAssignment) {
            return $coachLicenseAssignment->getCoach()?->getId() === $this->getId();
        });
    }

    public function addCoachLicenseAssignment(CoachLicenseAssignment $coachLicenseAssignment): self
    {
        if (!$this->coachLicenseAssignments->contains($coachLicenseAssignment)) {
            $this->coachLicenseAssignments->add($coachLicenseAssignment);
            $coachLicenseAssignment->setCoach($this);
        }

        return $this;
    }

    public function removeCoachLicenseAssignment(CoachLicenseAssignment $coachLicenseAssignment): self
    {
        if ($this->coachLicenseAssignments->removeElement($coachLicenseAssignment)) {
            if ($coachLicenseAssignment->getCoach() === $this) {
                $coachLicenseAssignment->setCoach(null);
            }
        }

        return $this;
    }

    /** @return Collection<int, CoachLicenseAssignment> */
    public function getActiveCoachLicenseAssignments(): Collection
    {
        $today = new DateTimeImmutable();

        return $this->coachLicenseAssignments->filter(function (CoachLicenseAssignment $assignment) use ($today) {
            return
                $assignment->getCoach()?->getId() === $this->getId()
                && $assignment->getStartDate() <= $today
                && (null === $assignment->getEndDate() || $assignment->getEndDate() >= $today);
        });
    }

    /**
     * @return Collection<int, UserRelation>
     */
    public function getUserRelations(): Collection
    {
        return $this->userRelations;
    }

    /**
     * @param Collection<int, UserRelation> $userRelations
     */
    public function setUserRelations(Collection $userRelations): self
    {
        $this->userRelations = $userRelations;

        return $this;
    }

    public function addUserRelation(UserRelation $userRelation): self
    {
        if (!$this->userRelations->contains($userRelation)) {
            $this->userRelations->add($userRelation);
            $userRelation->setCoach($this);
        }

        return $this;
    }

    public function removeUserRelation(UserRelation $userRelation): self
    {
        if ($this->userRelations->removeElement($userRelation)) {
            // Set the owning side to null (unless already changed)
            if ($userRelation->getCoach() === $this) {
                $userRelation->setCoach(null);
            }
        }

        return $this;
    }

    public function getFullName(): string
    {
        return $this->firstName . ' ' . $this->lastName;
    }

    public function __toString(): string
    {
        return $this->getFullName();
    }
}
