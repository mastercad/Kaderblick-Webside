<?php

namespace App\Entity;

use App\Repository\ExternalCalendarRepository;
use DateTime;
use Doctrine\ORM\Mapping as ORM;

#[ORM\Entity(repositoryClass: ExternalCalendarRepository::class)]
#[ORM\Table(name: 'external_calendars')]
class ExternalCalendar
{
    #[ORM\Id]
    #[ORM\GeneratedValue]
    #[ORM\Column(type: 'integer')]
    /** @phpstan-ignore-next-line */
    private ?int $id = null;

    #[ORM\ManyToOne(targetEntity: User::class, inversedBy: 'externalCalendars')]
    #[ORM\JoinColumn(nullable: false, onDelete: 'CASCADE')]
    private User $user;

    /** Anzeigename des Kalenders */
    #[ORM\Column(length: 255)]
    private string $name;

    /** Farbe als Hex-Code z.B. #e91e63 */
    #[ORM\Column(length: 7, options: ['default' => '#2196f3'])]
    private string $color = '#2196f3';

    /** iCal-URL (https:// oder webcal://) */
    #[ORM\Column(type: 'text')]
    private string $url;

    /** Gecachter iCal-Inhalt */
    #[ORM\Column(type: 'text', nullable: true)]
    private ?string $cachedContent = null;

    #[ORM\Column(type: 'datetime', nullable: true)]
    private ?DateTime $lastFetchedAt = null;

    #[ORM\Column(type: 'boolean', options: ['default' => true])]
    private bool $isEnabled = true;

    #[ORM\Column(type: 'datetime')]
    private DateTime $createdAt;

    public function __construct()
    {
        $this->createdAt = new DateTime();
    }

    public function getId(): ?int
    {
        return $this->id;
    }

    public function getUser(): User
    {
        return $this->user;
    }

    public function setUser(User $user): self
    {
        $this->user = $user;

        return $this;
    }

    public function getName(): string
    {
        return $this->name;
    }

    public function setName(string $name): self
    {
        $this->name = $name;

        return $this;
    }

    public function getColor(): string
    {
        return $this->color;
    }

    public function setColor(string $color): self
    {
        $this->color = $color;

        return $this;
    }

    public function getUrl(): string
    {
        return $this->url;
    }

    public function setUrl(string $url): self
    {
        $this->url = $url;

        return $this;
    }

    public function getCachedContent(): ?string
    {
        return $this->cachedContent;
    }

    public function setCachedContent(?string $cachedContent): self
    {
        $this->cachedContent = $cachedContent;

        return $this;
    }

    public function getLastFetchedAt(): ?DateTime
    {
        return $this->lastFetchedAt;
    }

    public function setLastFetchedAt(?DateTime $lastFetchedAt): self
    {
        $this->lastFetchedAt = $lastFetchedAt;

        return $this;
    }

    public function isEnabled(): bool
    {
        return $this->isEnabled;
    }

    public function setIsEnabled(bool $isEnabled): self
    {
        $this->isEnabled = $isEnabled;

        return $this;
    }

    public function getCreatedAt(): DateTime
    {
        return $this->createdAt;
    }

    /**
     * @return array<string, mixed>
     */
    public function toArray(): array
    {
        return [
            'id' => $this->id,
            'name' => $this->name,
            'color' => $this->color,
            'url' => $this->url,
            'isEnabled' => $this->isEnabled,
            'lastFetchedAt' => $this->lastFetchedAt?->format('c'),
            'createdAt' => $this->createdAt->format('c'),
        ];
    }
}
