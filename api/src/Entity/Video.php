<?php

namespace App\Entity;

use App\Repository\VideoRepository;
use DateTimeImmutable;
use Doctrine\Common\Collections\ArrayCollection;
use Doctrine\Common\Collections\Collection;
use Doctrine\ORM\Mapping as ORM;
use Symfony\Bridge\Doctrine\Validator\Constraints\UniqueEntity;

#[ORM\Table(name: 'videos')]
#[ORM\Index(name: 'idx_videos_game_id', columns: ['game_id'])]
#[ORM\Index(name: 'idx_videos_created_from', columns: ['created_from_id'])]
#[ORM\Index(name: 'idx_videos_updated_from', columns: ['updated_from_id'])]
#[ORM\UniqueConstraint(name: 'uniq_game_sort', columns: ['game_id', 'sort'])]
#[UniqueEntity(fields: ['game', 'sort'], message: 'Es darf pro Spiel nur ein Video mit diesem Sort-Wert geben.')]
#[ORM\Entity(repositoryClass: VideoRepository::class)]
class Video
{
    #[ORM\Id]
    #[ORM\GeneratedValue]
    #[ORM\Column]
    private ?int $id = null;

    #[ORM\Column(length: 255)]
    private ?string $name = null;

    #[ORM\Column(length: 255, nullable: true)]
    private ?string $filePath = null;

    #[ORM\Column(length: 255, nullable: true)]
    private ?string $url = null;

    #[ORM\Column(nullable: true)]
    private ?int $gameStart = null;

    #[ORM\Column]
    private ?DateTimeImmutable $createdAt = null;

    #[ORM\ManyToOne(inversedBy: 'videosCreatedFrom')]
    #[ORM\JoinColumn(nullable: false)]
    private ?User $createdFrom = null;

    #[ORM\Column]
    private ?DateTimeImmutable $updatedAt = null;

    #[ORM\ManyToOne(inversedBy: 'videos')]
    #[ORM\JoinColumn(nullable: false)]
    private ?Game $game = null;

    #[ORM\ManyToOne(inversedBy: 'videosUpdatedFrom')]
    #[ORM\JoinColumn(nullable: true)]
    private ?User $updatedFrom = null;

    #[ORM\Column(length: 255, nullable: true)]
    private ?string $youtubeId = null;

    #[ORM\Column(nullable: true)]
    private ?int $sort = null;

    #[ORM\ManyToOne(inversedBy: 'videos')]
    #[ORM\JoinColumn(nullable: false)]
    private ?VideoType $videoType = null;

    #[ORM\ManyToOne(inversedBy: 'videos')]
    private ?Camera $camera = null;

    #[ORM\Column]
    private ?int $length = null;

    /**
     * @var Collection<int, VideoSegment>
     */
    #[ORM\OneToMany(mappedBy: 'video', targetEntity: VideoSegment::class, orphanRemoval: true)]
    private Collection $videoSegments;

    public function __construct()
    {
        $this->videoSegments = new ArrayCollection();
    }

    public function getId(): ?int
    {
        return $this->id;
    }

    public function setId(int $id): static
    {
        $this->id = $id;

        return $this;
    }

    public function getName(): ?string
    {
        return $this->name;
    }

    public function setName(string $name): static
    {
        $this->name = $name;

        return $this;
    }

    public function getFilePath(): ?string
    {
        return $this->filePath;
    }

    public function setFilePath(string $filePath): static
    {
        $this->filePath = $filePath;

        return $this;
    }

    public function getUrl(): ?string
    {
        return $this->url;
    }

    public function setUrl(string $url): static
    {
        $this->url = $url;

        return $this;
    }

    public function getGameStart(): ?int
    {
        return $this->gameStart;
    }

    public function setGameStart(?int $gameStart): static
    {
        $this->gameStart = $gameStart;

        return $this;
    }

    public function getCreatedAt(): ?DateTimeImmutable
    {
        return $this->createdAt;
    }

    public function setCreatedAt(DateTimeImmutable $createdAt): static
    {
        $this->createdAt = $createdAt;

        return $this;
    }

    public function getCreatedFrom(): ?User
    {
        return $this->createdFrom;
    }

    public function setCreatedFrom(?User $createdFrom): static
    {
        $this->createdFrom = $createdFrom;

        return $this;
    }

    public function getUpdatedAt(): ?DateTimeImmutable
    {
        return $this->updatedAt;
    }

    public function setUpdatedAt(DateTimeImmutable $updatedAt): static
    {
        $this->updatedAt = $updatedAt;

        return $this;
    }

    public function getGame(): ?Game
    {
        return $this->game;
    }

    public function setGame(?Game $game): static
    {
        $this->game = $game;

        return $this;
    }

    public function getUpdatedFrom(): ?User
    {
        return $this->updatedFrom;
    }

    public function setUpdatedFrom(?User $updatedFrom): static
    {
        $this->updatedFrom = $updatedFrom;

        return $this;
    }

    public function getYoutubeId(): ?string
    {
        return $this->youtubeId;
    }

    public function setYoutubeId(?string $youtubeId): static
    {
        $this->youtubeId = $youtubeId;

        return $this;
    }

    public function getSort(): ?int
    {
        return $this->sort;
    }

    public function setSort(?int $sort): static
    {
        $this->sort = $sort;

        return $this;
    }

    public function getVideoType(): ?VideoType
    {
        return $this->videoType;
    }

    public function setVideoType(?VideoType $videoType): static
    {
        $this->videoType = $videoType;

        return $this;
    }

    public function getCamera(): ?Camera
    {
        return $this->camera;
    }

    public function setCamera(?Camera $camera): static
    {
        $this->camera = $camera;

        return $this;
    }

    public function getLength(): ?int
    {
        return $this->length;
    }

    public function setLength(int $length): static
    {
        $this->length = $length;

        return $this;
    }

    /**
     * @return Collection<int, VideoSegment>
     */
    public function getVideoSegments(): Collection
    {
        return $this->videoSegments;
    }

    public function addVideoSegment(VideoSegment $videoSegment): static
    {
        if (!$this->videoSegments->contains($videoSegment)) {
            $this->videoSegments->add($videoSegment);
            $videoSegment->setVideo($this);
        }

        return $this;
    }

    public function removeVideoSegment(VideoSegment $videoSegment): static
    {
        if ($this->videoSegments->removeElement($videoSegment)) {
            // set the owning side to null (unless already changed)
            if ($videoSegment->getVideo() === $this) {
                $videoSegment->setVideo(null);
            }
        }

        return $this;
    }
}
