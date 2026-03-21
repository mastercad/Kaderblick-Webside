<?php

namespace App\Entity;

use App\Repository\SurveyRepository;
use DateTimeInterface;
use Doctrine\Common\Collections\ArrayCollection;
use Doctrine\Common\Collections\Collection;
use Doctrine\ORM\Mapping as ORM;

#[ORM\Entity(repositoryClass: SurveyRepository::class)]
class Survey
{
    #[ORM\Id]
    #[ORM\GeneratedValue]
    #[ORM\Column(type: 'integer')]
    /** @phpstan-ignore-next-line Property is set by Doctrine and never written in code */
    private ?int $id = null;

    #[ORM\Column(type: 'string', length: 255)]
    private string $title;

    #[ORM\Column(type: 'text', nullable: true)]
    private ?string $description = null;

    /** @var Collection<int, SurveyQuestion> */
    #[ORM\OneToMany(targetEntity: SurveyQuestion::class, mappedBy: 'survey', cascade: ['persist', 'remove'])]
    private Collection $questions;

    #[ORM\Column(type: 'datetime', nullable: true)]
    private ?DateTimeInterface $dueDate = null;

    /** @var Collection<int, Team> */
    #[ORM\ManyToMany(targetEntity: Team::class)]
    private Collection $teams;

    /** @var Collection<int, Club> */
    #[ORM\ManyToMany(targetEntity: Club::class)]
    private Collection $clubs;

    #[ORM\Column(type: 'boolean', options: ['default' => false])]
    private bool $platform = false;

    /** @var list<string> */
    #[ORM\Column(type: 'json', options: ['default' => '[]'])]
    private array $remindersSent = [];

    #[ORM\Column(type: 'boolean', options: ['default' => false])]
    private bool $initialNotificationSent = false;

    public function __construct()
    {
        $this->questions = new ArrayCollection();
        $this->teams = new ArrayCollection();
        $this->clubs = new ArrayCollection();
    }

    public function getId(): ?int
    {
        return $this->id;
    }

    public function getTitle(): ?string
    {
        return $this->title;
    }

    public function setTitle(string $title): self
    {
        $this->title = $title;

        return $this;
    }

    public function getDescription(): ?string
    {
        return $this->description;
    }

    public function setDescription(?string $description): self
    {
        $this->description = $description;

        return $this;
    }

    public function getDueDate(): ?DateTimeInterface
    {
        return $this->dueDate;
    }

    public function setDueDate(?DateTimeInterface $dueDate): self
    {
        $this->dueDate = $dueDate;

        return $this;
    }

    /**
     * @return Collection<int, Team>
     */
    public function getTeams(): Collection
    {
        return $this->teams;
    }

    public function addTeam(Team $team): self
    {
        if (!$this->teams->contains($team)) {
            $this->teams[] = $team;
        }

        return $this;
    }

    public function removeTeam(Team $team): self
    {
        $this->teams->removeElement($team);

        return $this;
    }

    /**
     * @return Collection<int, Club>
     */
    public function getClubs(): Collection
    {
        return $this->clubs;
    }

    public function addClub(Club $club): self
    {
        if (!$this->clubs->contains($club)) {
            $this->clubs[] = $club;
        }

        return $this;
    }

    public function removeClub(Club $club): self
    {
        $this->clubs->removeElement($club);

        return $this;
    }

    public function isPlatform(): bool
    {
        return $this->platform;
    }

    public function setPlatform(bool $platform): self
    {
        $this->platform = $platform;

        return $this;
    }

    /**
     * @return Collection<int, SurveyQuestion>
     */
    public function getQuestions(): Collection
    {
        return $this->questions;
    }

    public function addQuestion(SurveyQuestion $question): self
    {
        if (!$this->questions->contains($question)) {
            $this->questions[] = $question;
            $question->setSurvey($this);
        }

        return $this;
    }

    public function removeQuestion(SurveyQuestion $question): self
    {
        if ($this->questions->removeElement($question)) {
            if ($question->getSurvey() === $this) {
                $question->setSurvey(null);
            }
        }

        return $this;
    }

    /**
     * @return list<string>
     */
    public function getRemindersSent(): array
    {
        return $this->remindersSent;
    }

    /**
     * @param list<string> $remindersSent
     */
    public function setRemindersSent(array $remindersSent): self
    {
        $this->remindersSent = $remindersSent;

        return $this;
    }

    public function addReminderSent(string $reminderKey): self
    {
        if (!in_array($reminderKey, $this->remindersSent, true)) {
            $this->remindersSent[] = $reminderKey;
        }

        return $this;
    }

    public function hasReminderBeenSent(string $reminderKey): bool
    {
        return in_array($reminderKey, $this->remindersSent, true);
    }

    public function isInitialNotificationSent(): bool
    {
        return $this->initialNotificationSent;
    }

    public function setInitialNotificationSent(bool $initialNotificationSent): self
    {
        $this->initialNotificationSent = $initialNotificationSent;

        return $this;
    }
}
