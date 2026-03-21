<?php

namespace App\Entity;

use App\Repository\FeedbackCommentRepository;
use DateTime;
use Doctrine\ORM\Mapping as ORM;

#[ORM\Entity(repositoryClass: FeedbackCommentRepository::class)]
#[ORM\Table(name: 'feedback_comment')]
#[ORM\Index(name: 'idx_feedback_comment_feedback_id', columns: ['feedback_id'])]
class FeedbackComment
{
    #[ORM\Id]
    #[ORM\GeneratedValue]
    #[ORM\Column]
    /** @phpstan-ignore-next-line Property is set by Doctrine and never written in code */
    private ?int $id = null;

    #[ORM\ManyToOne(targetEntity: Feedback::class, inversedBy: 'comments')]
    #[ORM\JoinColumn(name: 'feedback_id', referencedColumnName: 'id', nullable: false, onDelete: 'CASCADE')]
    private Feedback $feedback;

    #[ORM\ManyToOne(targetEntity: User::class)]
    #[ORM\JoinColumn(name: 'author_id', referencedColumnName: 'id', nullable: true, onDelete: 'SET NULL')]
    private ?User $author = null;

    #[ORM\Column(type: 'text')]
    private string $content;

    /** true = written by admin, false = written by user */
    #[ORM\Column(type: 'boolean')]
    private bool $isAdminMessage = false;

    /**
     * Has the recipient (non-author party) read this comment?
     * - For admin messages: has the user read it?
     * - For user messages: has the admin read it?
     */
    #[ORM\Column(type: 'boolean')]
    private bool $isReadByRecipient = false;

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

    public function getFeedback(): Feedback
    {
        return $this->feedback;
    }

    public function setFeedback(Feedback $feedback): self
    {
        $this->feedback = $feedback;

        return $this;
    }

    public function getAuthor(): ?User
    {
        return $this->author;
    }

    public function setAuthor(?User $author): self
    {
        $this->author = $author;

        return $this;
    }

    public function getContent(): string
    {
        return $this->content;
    }

    public function setContent(string $content): self
    {
        $this->content = $content;

        return $this;
    }

    public function isAdminMessage(): bool
    {
        return $this->isAdminMessage;
    }

    public function setIsAdminMessage(bool $isAdminMessage): self
    {
        $this->isAdminMessage = $isAdminMessage;

        return $this;
    }

    public function isReadByRecipient(): bool
    {
        return $this->isReadByRecipient;
    }

    public function setIsReadByRecipient(bool $isReadByRecipient): self
    {
        $this->isReadByRecipient = $isReadByRecipient;

        return $this;
    }

    public function getCreatedAt(): DateTime
    {
        return $this->createdAt;
    }
}
