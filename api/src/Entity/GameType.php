<?php

namespace App\Entity;

use App\Repository\GameTypeRepository;
use Doctrine\Common\Collections\ArrayCollection;
use Doctrine\Common\Collections\Collection;
use Doctrine\ORM\Mapping as ORM;
use Symfony\Component\Serializer\Attribute\Groups;

#[ORM\Entity(repositoryClass: GameTypeRepository::class)]
#[ORM\Table(name: 'game_types')]
#[ORM\UniqueConstraint(name: 'uniq_game_type_name', columns: ['name'])]
class GameType
{
    #[Groups(['game_type:read', 'game_type:write', 'game:read', 'calendar_event:read'])]
    #[ORM\Id]
    #[ORM\GeneratedValue]
    #[ORM\Column]
    /** @phpstan-ignore-next-line Property is set by Doctrine and never written in code */
    private ?int $id = null;

    #[Groups(['game_type:read', 'game_type:write', 'game:read', 'calendar_event:read'])]
    #[ORM\Column(length: 100, unique: true)]
    private string $name;

    #[Groups(['game_type:read', 'game_type:write'])]
    #[ORM\Column(type: 'text', nullable: true)]
    private ?string $description = null;

    /**
     * Dauer einer Halbzeit in Minuten (z.B. 20, 30, 45).
     * Null = nicht konfiguriert, Frontend fällt auf 45 zurück.
     */
    #[Groups(['game_type:read', 'game_type:write', 'game:read', 'calendar_event:read'])]
    #[ORM\Column(type: 'integer', nullable: true, options: ['unsigned' => true])]
    private ?int $halfDuration = null;

    /** @var Collection<int, Game> */
    #[Groups(['game_type:read', 'game_type:write'])]
    #[ORM\OneToMany(mappedBy: 'gameType', targetEntity: Game::class)]
    private Collection $games;

    public function __construct()
    {
        $this->games = new ArrayCollection();
    }

    public function getId(): ?int
    {
        return $this->id;
    }

    public function setName(string $name): self
    {
        $this->name = $name;

        return $this;
    }

    public function getName(): ?string
    {
        return $this->name;
    }

    public function setDescription(?string $description): self
    {
        $this->description = $description;

        return $this;
    }

    public function getDescription(): ?string
    {
        return $this->description;
    }

    public function getHalfDuration(): ?int
    {
        return $this->halfDuration;
    }

    public function setHalfDuration(?int $halfDuration): self
    {
        $this->halfDuration = $halfDuration;

        return $this;
    }

    /** @return Collection<int, Game> */
    public function getGames(): Collection
    {
        return $this->games;
    }

    public function addGame(Game $game): self
    {
        if (!$this->games->contains($game)) {
            $this->games[] = $game;
            $game->setGameType($this);
        }

        return $this;
    }

    public function removeGame(Game $game): self
    {
        if ($this->games->removeElement($game)) {
            // set the owning side to null (unless already changed)
            if ($game->getGameType() === $this) {
                $game->setGameType(null);
            }
        }

        return $this;
    }

    public function __toString(): string
    {
        return $this->name;
    }
}
