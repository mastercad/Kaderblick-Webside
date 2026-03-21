<?php

namespace App\Entity;

use App\Repository\FeedbackRepository;
use DateTime;
use Doctrine\Common\Collections\ArrayCollection;
use Doctrine\Common\Collections\Collection;
use Doctrine\ORM\Mapping as ORM;

#[ORM\Entity(repositoryClass: FeedbackRepository::class)]
#[ORM\Table(name: 'feedback')]
#[ORM\Index(name: 'idx_feedback_user_id', columns: ['user_id'])]
class Feedback
{
    #[ORM\Id]
    #[ORM\GeneratedValue]
    #[ORM\Column]
    /** @phpstan-ignore-next-line Property is set by Doctrine and never written in code */
    private ?int $id = null;

    #[ORM\ManyToOne(targetEntity: User::class)]
    #[ORM\JoinColumn(
        name: 'user_id',
        referencedColumnName: 'id',
        nullable: false,
        onDelete: 'CASCADE'
    )]
    private User $user;

    #[ORM\Column(length: 20)]
    private string $type;

    #[ORM\Column(type: 'text')]
    private string $message;

    #[ORM\Column(length: 255)]
    private string $url;

    #[ORM\Column(length: 255, nullable: true)]
    private ?string $userAgent = null;

    #[ORM\Column(type: 'datetime')]
    private DateTime $createdAt;

    #[ORM\Column(type: 'boolean')]
    private bool $isRead = false;

    #[ORM\Column(type: 'boolean')]
    private bool $resolved = false;

    #[ORM\Column(type: 'text', nullable: true)]
    private ?string $adminNote = null;

    #[ORM\Column(type: 'string', length: 255, nullable: true)]
    private ?string $screenshotPath = null;

    #[ORM\Column(type: 'integer', nullable: true)]
    private ?int $githubIssueNumber = null;

    #[ORM\Column(type: 'string', length: 512, nullable: true)]
    private ?string $githubIssueUrl = null;

    /** @var Collection<int, FeedbackComment> */
    #[ORM\OneToMany(targetEntity: FeedbackComment::class, mappedBy: 'feedback', cascade: ['persist', 'remove'], orphanRemoval: true)]
    #[ORM\OrderBy(['createdAt' => 'ASC'])]
    private Collection $comments;

    public function __construct()
    {
        $this->createdAt = new DateTime();
        $this->comments = new ArrayCollection();
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

    public function getType(): string
    {
        return $this->type;
    }

    public function setType(string $type): self
    {
        $this->type = $type;

        return $this;
    }

    public function getMessage(): string
    {
        return $this->message;
    }

    public function setMessage(string $message): self
    {
        $this->message = $message;

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

    public function getUserAgent(): ?string
    {
        return $this->userAgent;
    }

    public function setUserAgent(?string $userAgent): self
    {
        $this->userAgent = $userAgent;

        return $this;
    }

    public function getCreatedAt(): DateTime
    {
        return $this->createdAt;
    }

    public function isRead(): bool
    {
        return $this->isRead;
    }

    public function setIsRead(bool $isRead): self
    {
        $this->isRead = $isRead;

        return $this;
    }

    public function isResolved(): bool
    {
        return $this->resolved;
    }

    public function setResolved(bool $resolved): self
    {
        $this->resolved = $resolved;

        return $this;
    }

    public function getAdminNote(): ?string
    {
        return $this->adminNote;
    }

    public function setAdminNote(?string $adminNote): self
    {
        $this->adminNote = $adminNote;

        return $this;
    }

    public function getScreenshotPath(): ?string
    {
        return $this->screenshotPath;
    }

    public function setScreenshotPath(?string $screenshotPath): self
    {
        $this->screenshotPath = $screenshotPath;

        return $this;
    }

    public function getGithubIssueNumber(): ?int
    {
        return $this->githubIssueNumber;
    }

    public function setGithubIssueNumber(?int $githubIssueNumber): self
    {
        $this->githubIssueNumber = $githubIssueNumber;

        return $this;
    }

    public function getGithubIssueUrl(): ?string
    {
        return $this->githubIssueUrl;
    }

    public function setGithubIssueUrl(?string $githubIssueUrl): self
    {
        $this->githubIssueUrl = $githubIssueUrl;

        return $this;
    }

    /** @return Collection<int, FeedbackComment> */
    public function getComments(): Collection
    {
        return $this->comments;
    }

    public function addComment(FeedbackComment $comment): self
    {
        if (!$this->comments->contains($comment)) {
            $this->comments->add($comment);
            $comment->setFeedback($this);
        }

        return $this;
    }

    /** Whether any user-written comment hasn't been read by the admin yet */
    public function hasUnreadUserReplies(): bool
    {
        foreach ($this->comments as $comment) {
            if (!$comment->isAdminMessage() && !$comment->isReadByRecipient()) {
                return true;
            }
        }

        return false;
    }
}
