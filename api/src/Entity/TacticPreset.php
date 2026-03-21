<?php

namespace App\Entity;

use App\Repository\TacticPresetRepository;
use DateTimeImmutable;
use DateTimeInterface;
use Doctrine\ORM\Mapping as ORM;

/**
 * A tactical preset / template that coaches can browse and load.
 *
 * Visibility rules:
 *   - isSystem = true  → visible to every authenticated user
 *   - club is set      → visible to all coaches/members of that club
 *   - createdBy is set → visible only to its creator (personal preset)
 */
#[ORM\Entity(repositoryClass: TacticPresetRepository::class)]
#[ORM\Table(name: 'tactic_presets')]
#[ORM\Index(name: 'idx_tactic_presets_is_system', columns: ['is_system'])]
#[ORM\Index(name: 'idx_tactic_presets_club_id', columns: ['club_id'])]
#[ORM\Index(name: 'idx_tactic_presets_created_by', columns: ['created_by'])]
class TacticPreset
{
    // -----------------------------------------------------------------
    // Allowed category values (kept as class constants for easy extension)
    // -----------------------------------------------------------------
    public const CATEGORY_PRESSING = 'Pressing';
    public const CATEGORY_ATTACK = 'Angriff';
    public const CATEGORY_STANDARDS = 'Standards';
    public const CATEGORY_BUILD_UP = 'Spielaufbau';
    public const CATEGORY_DEFENSIVE = 'Defensive';

    public const CATEGORIES = [
        self::CATEGORY_PRESSING,
        self::CATEGORY_ATTACK,
        self::CATEGORY_STANDARDS,
        self::CATEGORY_BUILD_UP,
        self::CATEGORY_DEFENSIVE,
    ];

    // -----------------------------------------------------------------
    // Fields
    // -----------------------------------------------------------------

    #[ORM\Id]
    #[ORM\GeneratedValue]
    #[ORM\Column(type: 'integer')]
    /** @phpstan-ignore-next-line Property is set by Doctrine and never written in code */
    private ?int $id = null;

    #[ORM\Column(type: 'string', length: 100)]
    private string $title;

    #[ORM\Column(type: 'string', length: 50)]
    private string $category;

    #[ORM\Column(type: 'text')]
    private string $description;

    /** When true this record is a built-in system preset visible to everyone. */
    #[ORM\Column(name: 'is_system', type: 'boolean')]
    private bool $isSystem = false;

    /**
     * JSON blob that stores the full TacticEntry shape (players, arrows,
     * zones, draws …) as defined in the frontend types.
     *
     * @var array<string, mixed>
     */
    #[ORM\Column(type: 'json')]
    private array $data = [];

    /** Optional: preset belongs to a specific club (team sharing). */
    #[ORM\ManyToOne(targetEntity: Club::class)]
    #[ORM\JoinColumn(name: 'club_id', nullable: true, onDelete: 'CASCADE')]
    private ?Club $club = null;

    /** Optional: the user who created this preset (personal / team preset). */
    #[ORM\ManyToOne(targetEntity: User::class)]
    #[ORM\JoinColumn(name: 'created_by', nullable: true, onDelete: 'SET NULL')]
    private ?User $createdBy = null;

    #[ORM\Column(name: 'created_at', type: 'datetime_immutable')]
    private DateTimeImmutable $createdAt;

    // -----------------------------------------------------------------
    // Constructor
    // -----------------------------------------------------------------

    public function __construct()
    {
        $this->createdAt = new DateTimeImmutable();
    }

    // -----------------------------------------------------------------
    // Accessors
    // -----------------------------------------------------------------

    public function getId(): ?int
    {
        return $this->id;
    }

    public function getTitle(): string
    {
        return $this->title;
    }

    public function setTitle(string $title): self
    {
        $this->title = $title;

        return $this;
    }

    public function getCategory(): string
    {
        return $this->category;
    }

    public function setCategory(string $category): self
    {
        $this->category = $category;

        return $this;
    }

    public function getDescription(): string
    {
        return $this->description;
    }

    public function setDescription(string $description): self
    {
        $this->description = $description;

        return $this;
    }

    public function isSystem(): bool
    {
        return $this->isSystem;
    }

    public function setIsSystem(bool $isSystem): self
    {
        $this->isSystem = $isSystem;

        return $this;
    }

    /** @return array<string, mixed> */
    public function getData(): array
    {
        return $this->data;
    }

    /** @param array<string, mixed> $data */
    public function setData(array $data): self
    {
        $this->data = $data;

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

    public function getCreatedBy(): ?User
    {
        return $this->createdBy;
    }

    public function setCreatedBy(?User $createdBy): self
    {
        $this->createdBy = $createdBy;

        return $this;
    }

    public function getCreatedAt(): DateTimeImmutable
    {
        return $this->createdAt;
    }

    // -----------------------------------------------------------------
    // Serialisation helper used by the API controller
    // -----------------------------------------------------------------

    /**
     * @param User|null $requestingUser the authenticated user, used to decide
     *                                  whether the preset may be deleted
     *
     * @return array<string, mixed>
     */
    public function toArray(?User $requestingUser = null): array
    {
        $canDelete = false;

        if (null !== $requestingUser && !$this->isSystem) {
            $canDelete = null !== $this->createdBy
                && $this->createdBy->getId() === $requestingUser->getId();
        }

        return [
            'id' => $this->id,
            'title' => $this->title,
            'category' => $this->category,
            'description' => $this->description,
            'isSystem' => $this->isSystem,
            'clubId' => $this->club?->getId(),
            'createdBy' => null !== $this->createdBy
                ? ($this->createdBy->getFirstName() . ' ' . $this->createdBy->getLastName())
                : null,
            'canDelete' => $canDelete,
            'data' => $this->data,
            'createdAt' => $this->createdAt->format(DateTimeInterface::ATOM),
        ];
    }
}
