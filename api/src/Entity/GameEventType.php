<?php

namespace App\Entity;

use App\Repository\GameEventTypeRepository;
use Doctrine\Common\Collections\ArrayCollection;
use Doctrine\Common\Collections\Collection;
use Doctrine\ORM\Mapping as ORM;
use Symfony\Component\Serializer\Attribute\Groups;

#[ORM\Entity(repositoryClass: GameEventTypeRepository::class)]
#[ORM\Table(name: 'game_event_types')]
#[ORM\UniqueConstraint(name: 'uniq_game_event_types_name', columns: ['name'])]
class GameEventType
{
    #[ORM\Id]
    #[ORM\GeneratedValue]
    #[ORM\Column(type: 'integer')]
    #[Groups(['game_event_type:read', 'game_event:read', 'game:read', 'calendar_event:read'])]
    /** @phpstan-ignore-next-line Property is set by Doctrine and never written in code */
    private int $id;

    #[ORM\Column(length: 50, unique: true)]
    #[Groups(['game_event_type:read', 'game_event_type:write', 'game_event:read', 'game:read', 'calendar_event:read'])]
    private string $name; // z.B. "Gelbe Karte", "Tor", "Einwechslung"

    #[ORM\Column(length: 50, unique: true)]
    #[Groups(['game_event_type:read', 'game_event_type:write', 'game_event:read'])]
    private string $code; // z.B. "yellow_card", "goal", "sub_in" (wichtig für Verarbeitung)

    #[ORM\Column(length: 10, nullable: true)]
    #[Groups(['game_event_type:read', 'game_event_type:write', 'game_event:read'])]
    private ?string $color = null; // z.B. für UI: "#ffcc00"

    #[ORM\Column(length: 100, nullable: true)]
    #[Groups(['game_event_type:read', 'game_event_type:write', 'game_event:read'])]
    private ?string $icon = null; // Optional: FontAwesome/Icon-Name oder URL

    #[ORM\Column(type: 'boolean')]
    private bool $isSystem = false; // true = systemgeschützt

    /** @var Collection<int, GameEvent> */
    #[Groups(['game_event_type:read'])]
    #[ORM\OneToMany(targetEntity: GameEvent::class, mappedBy: 'gameEventType')]
    private Collection $gameEvents;

    public function __construct()
    {
        $this->gameEvents = new ArrayCollection();
    }

    public function __toString(): string
    {
        return $this->name;
    }

    public function getId(): int
    {
        return $this->id;
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

    public function getCode(): string
    {
        return $this->code;
    }

    public function setCode(string $code): self
    {
        $this->code = $code;

        return $this;
    }

    public function getColor(): ?string
    {
        return $this->color;
    }

    public function setColor(?string $color): self
    {
        $this->color = $color;

        return $this;
    }

    public function getIcon(): ?string
    {
        return $this->icon;
    }

    public function setIcon(?string $icon): self
    {
        $this->icon = $icon;

        return $this;
    }

    public function isSystem(): bool
    {
        return $this->isSystem;
    }

    public function setSystem(bool $isSystem): self
    {
        $this->isSystem = $isSystem;

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
            $this->gameEvents[] = $gameEvent;
            $gameEvent->setGameEventType($this);
        }

        return $this;
    }

    public function removeGameEvent(GameEvent $gameEvent): self
    {
        if ($this->gameEvents->removeElement($gameEvent)) {
            if ($gameEvent->getGameEventType() === $this) {
                $gameEvent->setGameEventType(null);
            }
        }

        return $this;
    }
}
