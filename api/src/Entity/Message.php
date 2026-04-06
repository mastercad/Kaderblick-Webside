<?php

namespace App\Entity;

use DateTime;
use Doctrine\Common\Collections\ArrayCollection;
use Doctrine\Common\Collections\Collection;
use Doctrine\ORM\Mapping as ORM;

#[ORM\Entity]
#[ORM\Table(name: 'messages')]
#[ORM\Index(name: 'idx_messages_sender_id', columns: ['sender_id'])]
class Message
{
    #[ORM\Id]
    #[ORM\GeneratedValue]
    #[ORM\Column(type: 'integer')]
    /** @phpstan-ignore-next-line Property is set by Doctrine and never written in code */
    private ?int $id = null;

    #[ORM\ManyToOne(targetEntity: User::class)]
    #[ORM\JoinColumn(
        name: 'sender_id',
        referencedColumnName: 'id',
        nullable: false,
        onDelete: 'CASCADE'
    )]
    private User $sender;

    /** @var Collection<int, User> */
    #[ORM\ManyToMany(targetEntity: User::class)]
    #[ORM\JoinTable(
        name: 'message_recipients',
        joinColumns: [
            new ORM\JoinColumn(
                name: 'message_id',
                referencedColumnName: 'id',
                onDelete: 'CASCADE'
            )
        ],
        inverseJoinColumns: [
            new ORM\JoinColumn(
                name: 'user_id',
                referencedColumnName: 'id',
                onDelete: 'CASCADE'
            )
        ]
    )]
    private Collection $recipients;

    #[ORM\Column(length: 255)]
    private string $subject;

    #[ORM\Column(type: 'text')]
    private string $content;

    #[ORM\Column(type: 'datetime')]
    private DateTime $sentAt;

    /** @var array<int, int> User IDs that have read the message */
    #[ORM\Column(type: 'json')]
    private array $readBy = [];

    /**
     * Original team targets used when composing this message.
     * JSON: array<array{teamId: int|string, role: string}>.
     *
     * @var array<array{teamId: int|string, role: string}>|null
     */
    #[ORM\Column(type: 'json', nullable: true)]
    private ?array $teamTargets = null;

    /**
     * Original club targets used when composing this message.
     * JSON: array<array{clubId: int|string, role: string}>.
     *
     * @var array<array{clubId: int|string, role: string}>|null
     */
    #[ORM\Column(type: 'json', nullable: true)]
    private ?array $clubTargets = null;

    /** Original message-group target (nullable; SET NULL when group is deleted). */
    #[ORM\ManyToOne(targetEntity: MessageGroup::class)]
    #[ORM\JoinColumn(name: 'group_id', nullable: true, onDelete: 'SET NULL')]
    private ?MessageGroup $group = null;

    /**
     * IDs of users who were addressed individually (not via team/club/group).
     *
     * @var array<int>|null
     */
    #[ORM\Column(type: 'json', nullable: true)]
    private ?array $directRecipientIds = null;

    /** The message this is a reply to (null for root messages). */
    #[ORM\ManyToOne(targetEntity: Message::class)]
    #[ORM\JoinColumn(name: 'parent_id', referencedColumnName: 'id', nullable: true, onDelete: 'SET NULL')]
    private ?Message $parent = null;

    /**
     * Points to the root message of this conversation thread.
     * Null for root messages themselves.
     */
    #[ORM\ManyToOne(targetEntity: Message::class)]
    #[ORM\JoinColumn(name: 'thread_id', referencedColumnName: 'id', nullable: true, onDelete: 'SET NULL')]
    private ?Message $thread = null;

    public function __construct()
    {
        $this->recipients = new ArrayCollection();
        $this->sentAt = new DateTime();
    }

    // Getter and setter methods...
    public function getId(): ?int
    {
        return $this->id;
    }

    public function getSender(): User
    {
        return $this->sender;
    }

    public function setSender(User $sender): self
    {
        $this->sender = $sender;

        return $this;
    }

    /** @return Collection<int, User> */
    public function getRecipients(): Collection
    {
        return $this->recipients;
    }

    public function addRecipient(User $recipient): self
    {
        if (!$this->recipients->contains($recipient)) {
            $this->recipients->add($recipient);
        }

        return $this;
    }

    public function removeRecipient(User $recipient): self
    {
        $this->recipients->removeElement($recipient);

        return $this;
    }

    public function getSubject(): string
    {
        return $this->subject;
    }

    public function setSubject(string $subject): self
    {
        $this->subject = $subject;

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

    public function getSentAt(): DateTime
    {
        return $this->sentAt;
    }

    public function markAsRead(User $user): self
    {
        if (!in_array($user->getId(), $this->readBy)) {
            $this->readBy[] = $user->getId();
        }

        return $this;
    }

    public function markAsUnread(User $user): self
    {
        $this->readBy = array_values(
            array_filter($this->readBy, fn (int $id) => $id !== $user->getId())
        );

        return $this;
    }

    public function isReadBy(User $user): bool
    {
        return in_array($user->getId(), $this->readBy);
    }

    /**
     * Returns a plain-text preview (first 160 characters, no newlines).
     */
    public function getSnippet(): string
    {
        $plain = preg_replace('/\s+/', ' ', $this->content) ?? $this->content;

        return mb_strlen($plain) > 160 ? mb_substr($plain, 0, 157) . '…' : $plain;
    }

    /** @return array<array{teamId: int|string, role: string}>|null */
    public function getTeamTargets(): ?array
    {
        return $this->teamTargets;
    }

    /** @param array<array{teamId: int|string, role: string}>|null $teamTargets */
    public function setTeamTargets(?array $teamTargets): self
    {
        $this->teamTargets = $teamTargets;

        return $this;
    }

    /** @return array<array{clubId: int|string, role: string}>|null */
    public function getClubTargets(): ?array
    {
        return $this->clubTargets;
    }

    /** @param array<array{clubId: int|string, role: string}>|null $clubTargets */
    public function setClubTargets(?array $clubTargets): self
    {
        $this->clubTargets = $clubTargets;

        return $this;
    }

    public function getGroup(): ?MessageGroup
    {
        return $this->group;
    }

    public function setGroup(?MessageGroup $group): self
    {
        $this->group = $group;

        return $this;
    }

    /** @return array<int>|null */
    public function getDirectRecipientIds(): ?array
    {
        return $this->directRecipientIds;
    }

    /** @param array<int>|null $directRecipientIds */
    public function setDirectRecipientIds(?array $directRecipientIds): self
    {
        $this->directRecipientIds = $directRecipientIds;

        return $this;
    }

    public function getParent(): ?Message
    {
        return $this->parent;
    }

    public function setParent(?Message $parent): self
    {
        $this->parent = $parent;

        return $this;
    }

    public function getThread(): ?Message
    {
        return $this->thread;
    }

    public function setThread(?Message $thread): self
    {
        $this->thread = $thread;

        return $this;
    }
}
