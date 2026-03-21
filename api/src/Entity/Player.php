<?php

namespace App\Entity;

use App\Repository\PlayerRepository;
use DateTime;
use DateTimeInterface;
use Doctrine\Common\Collections\ArrayCollection;
use Doctrine\Common\Collections\Collection;
use Doctrine\ORM\Mapping as ORM;
use Symfony\Component\Serializer\Attribute\Context;
use Symfony\Component\Serializer\Attribute\Groups;
use Symfony\Component\Validator\Constraints as Assert;

#[ORM\Entity(repositoryClass: PlayerRepository::class)]
#[ORM\Table(name: 'players')]
#[ORM\Index(name: 'idx_players_strong_foot_id', columns: ['strong_foot_id'])]
#[ORM\Index(name: 'idx_players_main_position_id', columns: ['main_position_id'])]
class Player
{
    #[ORM\Id]
    #[ORM\GeneratedValue]
    #[ORM\Column(type: 'integer')]
    #[Groups(['player:read', 'player:write', 'team:read', 'player_team_assignment:read', 'player_club_assignment:read', 'club:read', 'game_event:read'])]
    /** @phpstan-ignore-next-line Property is set by Doctrine and never written in code */
    private ?int $id = null;

    #[Groups(['player:read', 'player:write', 'team:read', 'player_team_assignment:read', 'player_club_assignment:read', 'club:read', 'game_event:read'])]
    #[ORM\Column(type: 'string', length: 100)]
    #[Assert\NotBlank(message: 'Der Vorname darf nicht leer sein.')]
    #[Assert\Length(
        min: 2,
        max: 100,
        minMessage: 'Der Vorname muss mindestens {{ limit }} Zeichen lang sein.',
        maxMessage: 'Der Vorname darf nicht länger als {{ limit }} Zeichen sein.'
    )]
    private string $firstName;

    #[Groups(['player:read', 'player:write', 'team:read', 'player_team_assignment:read', 'player_club_assignment:read', 'club:read', 'game_event:read'])]
    #[ORM\Column(type: 'string', length: 100)]
    #[Assert\NotBlank(message: 'Der Nachname darf nicht leer sein.')]
    #[Assert\Length(
        min: 2,
        max: 100,
        minMessage: 'Der Nachname muss mindestens {{ limit }} Zeichen lang sein.',
        maxMessage: 'Der Nachname darf nicht länger als {{ limit }} Zeichen sein.'
    )]
    private string $lastName;

    #[Groups(['player:read', 'player:write'])]
    #[Context(normalizationContext: ['datetime_format' => 'd.m.Y'])]
    #[ORM\Column(type: 'date', nullable: true)]
    private ?DateTimeInterface $birthdate = null;

    #[ORM\Column(type: 'integer', nullable: true)]
    #[Assert\Range(
        min: 50,
        max: 250,
        notInRangeMessage: 'Die Größe muss zwischen {{ min }} und {{ max }} cm liegen.'
    )]
    private ?int $height = null; // in cm

    #[Groups(['player:read', 'player:write'])]
    #[ORM\Column(type: 'integer', nullable: true)]
    #[Assert\Range(
        min: 20,
        max: 150,
        notInRangeMessage: 'Das Gewicht muss zwischen {{ min }} und {{ max }} kg liegen.'
    )]
    private ?int $weight = null; // in kg

    #[Groups(['player:read', 'player:write'])]
    #[ORM\ManyToOne(targetEntity: StrongFoot::class, inversedBy: 'players')]
    #[ORM\JoinColumn(
        name: 'strong_foot_id',
        referencedColumnName: 'id',
        nullable: true,
        onDelete: 'SET NULL'
    )]
    private ?StrongFoot $strongFoot = null;

    #[Groups(['player:read', 'player:write'])]
    #[ORM\ManyToOne(targetEntity: Position::class)]
    #[ORM\JoinColumn(
        name: 'main_position_id',
        referencedColumnName: 'id',
        nullable: false,
        onDelete: 'CASCADE'
    )]
    private Position $mainPosition;

    /** @var Collection<int, Position> */
    #[Groups(['player:read', 'player:write'])]
    #[ORM\ManyToMany(targetEntity: Position::class)]
    #[ORM\JoinTable(
        name: 'player_alternative_positions',
        joinColumns: [
            new ORM\JoinColumn(
                name: 'player_id',
                referencedColumnName: 'id',
                onDelete: 'CASCADE'
            )
        ],
        inverseJoinColumns: [
            new ORM\JoinColumn(
                name: 'position_id',
                referencedColumnName: 'id',
                onDelete: 'CASCADE'
            )
        ]
    )]
    private Collection $alternativePositions;

    /** @var Collection<int, GameEvent> */
    #[Groups(['player:read'])]
    #[ORM\OneToMany(targetEntity: GameEvent::class, mappedBy: 'player')]
    private Collection $gameEvents;

    /** @var Collection<int, PlayerTeamAssignment> */
    #[Groups(['player:read'])]
    #[ORM\OneToMany(targetEntity: PlayerTeamAssignment::class, mappedBy: 'player', cascade: ['persist'])]
    private Collection $playerTeamAssignments;

    /** @var Collection<int, PlayerClubAssignment> */
    #[Groups(['player:read'])]
    #[ORM\OneToMany(targetEntity: PlayerClubAssignment::class, mappedBy: 'player', cascade: ['persist'])]
    private Collection $playerClubAssignments;

    /** @var Collection<int, PlayerNationalityAssignment> */
    #[Groups(['player:read'])]
    #[ORM\OneToMany(targetEntity: PlayerNationalityAssignment::class, mappedBy: 'player')]
    private Collection $playerNationalityAssignments;

    /** @var Collection<int, UserRelation> */
    #[Groups(['player:read'])]
    #[ORM\OneToMany(targetEntity: UserRelation::class, mappedBy: 'player')]
    private Collection $userRelations;

    #[Groups(['player:read', 'player:write'])]
    #[ORM\Column(type: 'string', length: 255, nullable: true)]
    #[Assert\Email(message: 'Die E-Mail-Adresse {{ value }} ist nicht gültig.')]
    private ?string $email = null;
    #[ORM\Column(type: 'string', nullable: true, unique: true, name: 'fussball_de_id')]
    private ?string $fussballDeId = null;

    #[ORM\Column(type: 'string', length: 255, nullable: true, name: 'fussball_de_url')]
    private ?string $fussballDeUrl = null;

    /**
     * @var Collection<int, PlayerTitle>
     */
    #[ORM\OneToMany(mappedBy: 'player', targetEntity: PlayerTitle::class, cascade: ['persist', 'remove'])]
    private Collection $playerTitles;

    public function __construct()
    {
        $this->userRelations = new ArrayCollection();
        $this->gameEvents = new ArrayCollection();
        $this->alternativePositions = new ArrayCollection();
        $this->playerTeamAssignments = new ArrayCollection();
        $this->playerClubAssignments = new ArrayCollection();
        $this->playerNationalityAssignments = new ArrayCollection();
        $this->playerTitles = new ArrayCollection();
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

    public function getFullName(): string
    {
        return $this->firstName . ' ' . $this->lastName;
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

    /** @return Collection<int, PlayerTeamAssignment> */
    public function getPlayerTeamAssignments(): Collection
    {
        return $this->playerTeamAssignments;
    }

    public function addPlayerTeamAssignment(PlayerTeamAssignment $assignment): self
    {
        if (!$this->playerTeamAssignments->contains($assignment)) {
            $this->playerTeamAssignments->add($assignment);
            $assignment->setPlayer($this);
        }

        return $this;
    }

    public function removePlayerTeamAssignment(PlayerTeamAssignment $playerTeamAssignment): self
    {
        if ($this->playerTeamAssignments->removeElement($playerTeamAssignment)) {
            if ($playerTeamAssignment->getPlayer() === $this) {
                $playerTeamAssignment->setPlayer(null);
            }
        }

        return $this;
    }

    /** @return Collection<int, PlayerClubAssignment> */
    public function getPlayerClubAssignments(): Collection
    {
        return $this->playerClubAssignments;
    }

    public function addPlayerClubAssignment(PlayerClubAssignment $playerClubAssignment): self
    {
        if (!$this->playerClubAssignments->contains($playerClubAssignment)) {
            $this->playerClubAssignments->add($playerClubAssignment);
            $playerClubAssignment->setPlayer($this);
        }

        return $this;
    }

    public function removePlayerClubAssignment(PlayerClubAssignment $playerClubAssignment): self
    {
        if ($this->playerClubAssignments->removeElement($playerClubAssignment)) {
            if ($playerClubAssignment->getPlayer() === $this) {
                $playerClubAssignment->setPlayer(null);
            }
        }

        return $this;
    }

    /** @return Collection<int, PlayerNationalityAssignment> */
    public function getPlayerNationalityAssignments(): Collection
    {
        return $this->playerNationalityAssignments;
    }

    public function addPlayerNationalityAssignment(PlayerNationalityAssignment $playerNationalityAssignment): self
    {
        if (!$this->playerNationalityAssignments->contains($playerNationalityAssignment)) {
            $this->playerNationalityAssignments->add($playerNationalityAssignment);
            $playerNationalityAssignment->setPlayer($this);
        }

        return $this;
    }

    public function removePlayerNationalityAssignment(PlayerNationalityAssignment $playerNationalityAssignment): self
    {
        if ($this->playerNationalityAssignments->removeElement($playerNationalityAssignment)) {
            if ($playerNationalityAssignment->getPlayer() === $this) {
                $playerNationalityAssignment->setPlayer(null);
            }
        }

        return $this;
    }

    public function getStrongFoot(): ?StrongFoot
    {
        return $this->strongFoot;
    }

    public function setStrongFoot(?StrongFoot $strongFoot): self
    {
        $this->strongFoot = $strongFoot;

        return $this;
    }

    public function getMainPosition(): Position
    {
        return $this->mainPosition;
    }

    public function setMainPosition(Position $position): self
    {
        $this->mainPosition = $position;

        return $this;
    }

    /**
     * @param Collection<int, Position> $positions
     */
    public function setAlternativePositions(Collection $positions): self
    {
        $this->alternativePositions = $positions;

        return $this;
    }

    /** @return Collection<int, Position> */
    public function getAlternativePositions(): Collection
    {
        return $this->alternativePositions;
    }

    public function addAlternativePosition(Position $position): self
    {
        if (!$this->alternativePositions->contains($position)) {
            $this->alternativePositions->add($position);
        }

        return $this;
    }

    public function removeAlternativePosition(Position $position): self
    {
        $this->alternativePositions->removeElement($position);

        return $this;
    }

    public function getHeight(): ?int
    {
        return $this->height;
    }

    public function setHeight(?int $height): self
    {
        $this->height = $height;

        return $this;
    }

    public function getWeight(): ?int
    {
        return $this->weight;
    }

    public function setWeight(?int $weight): self
    {
        $this->weight = $weight;

        return $this;
    }

    /** @return Collection<int, GameEvent> */
    public function getGameEvents(): Collection
    {
        return $this->gameEvents;
    }

    public function addGameEvent(GameEvent $gameEvent): self
    {
        if (!$this->gameEvents->contains($gameEvent)) {
            $this->gameEvents->add($gameEvent);
            $gameEvent->setPlayer($this);
        }

        return $this;
    }

    public function removeGameEvent(GameEvent $gameEvent): self
    {
        if ($this->gameEvents->removeElement($gameEvent)) {
            if ($gameEvent->getPlayer() === $this) {
                $gameEvent->setPlayer(null);
            }
        }

        return $this;
    }

    /** @return array<int, GameEvent> */
    public function getEventsByType(string $eventTypeCode): array
    {
        return $this->gameEvents
            ->filter(function (GameEvent $event) use ($eventTypeCode) {
                return $event->getGameEventType()->getCode() === $eventTypeCode;
            })
            ->toArray();
    }

    /** @return array<int, GameEvent> */
    public function getYellowCards(): array
    {
        return $this->getEventsByType('yellow_card');
    }

    /** @return array<int, GameEvent> */
    public function getRedCards(): array
    {
        return $this->getEventsByType('red_card');
    }

    /** @return array<int, GameEvent> */
    public function getGoals(): array
    {
        return $this->getEventsByType('goal');
    }

    /** @return array<int, Nationality> */
    public function getCurrentNationalities(): array
    {
        $now = new DateTime();
        $nationalities = [];

        foreach ($this->playerNationalityAssignments as $assignment) {
            if (
                $assignment->isActive()
                && $assignment->getStartDate() <= $now
                && (null === $assignment->getEndDate() || $assignment->getEndDate() >= $now)
            ) {
                $nationalities[] = $assignment->getNationality();
            }
        }

        return $nationalities;
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

    public function getFussballDeId(): ?string
    {
        return $this->fussballDeId;
    }

    public function setFussballDeId(?string $fussballDeId): self
    {
        $this->fussballDeId = $fussballDeId;

        return $this;
    }

    public function getFussballDeUrl(): ?string
    {
        return $this->fussballDeUrl;
    }

    public function setFussballDeUrl(?string $fussballDeUrl): self
    {
        $this->fussballDeUrl = $fussballDeUrl;

        return $this;
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
            $userRelation->setPlayer($this);
        }

        return $this;
    }

    public function removeUserRelation(UserRelation $userRelation): self
    {
        if ($this->userRelations->removeElement($userRelation)) {
            // Set the owning side to null (unless already changed)
            if ($userRelation->getPlayer() === $this) {
                $userRelation->setPlayer(null);
            }
        }

        return $this;
    }

    /**
     * @return Collection<int, PlayerTitle>
     */
    public function getPlayerTitles(): Collection
    {
        return $this->playerTitles;
    }

    public function addPlayerTitle(PlayerTitle $playerTitle): static
    {
        if (!$this->playerTitles->contains($playerTitle)) {
            $this->playerTitles->add($playerTitle);
            $playerTitle->setPlayer($this);
        }

        return $this;
    }

    public function removePlayerTitle(PlayerTitle $playerTitle): static
    {
        if ($this->playerTitles->removeElement($playerTitle)) {
            // set the owning side to null (unless already changed)
            if ($playerTitle->getPlayer() === $this) {
                $playerTitle->setPlayer(null);
            }
        }

        return $this;
    }

    public function __toString()
    {
        return $this->firstName . ' ' . $this->lastName;
    }
}
