<?php

namespace App\Entity;

use App\Repository\XpRuleRepository;
use DateTimeImmutable;
use Doctrine\ORM\Mapping as ORM;

#[ORM\Entity(repositoryClass: XpRuleRepository::class)]
#[ORM\Table(name: 'xp_rules')]
#[ORM\UniqueConstraint(name: 'uniq_xp_rules_action_type', columns: ['action_type'])]
class XpRule
{
    public const CATEGORY_SPORT = 'sport';
    public const CATEGORY_PLATFORM = 'platform';
    public const CATEGORY_SOCIAL = 'social';
    public const CATEGORY_GAME_EVENT = 'game_event';

    /**
     * cooldownMinutes semantics:
     *  0  = deduplicate per (user, actionType, actionId) – once ever per unique event
     * >0  = re-award every N minutes per (user, actionType, actionId)
     * -1  = no dedup; rely solely on daily/monthly limits
     */
    public const COOLDOWN_DEDUP = 0;
    public const COOLDOWN_NO_DEDUP = -1;

    #[ORM\Id]
    #[ORM\GeneratedValue]
    #[ORM\Column(type: 'integer')]
    /** @phpstan-ignore-next-line Property is set by Doctrine and never written in code */
    private ?int $id = null;

    #[ORM\Column(type: 'string', length: 50, unique: true)]
    private string $actionType;

    #[ORM\Column(type: 'string', length: 100)]
    private string $label;

    /** sport | platform | social | game_event */
    #[ORM\Column(type: 'string', length: 20)]
    private string $category = self::CATEGORY_PLATFORM;

    #[ORM\Column(type: 'string', length: 255, nullable: true)]
    private ?string $description = null;

    #[ORM\Column(type: 'integer')]
    private int $xpValue;

    /** Rule can be disabled without deleting it */
    #[ORM\Column(type: 'boolean', options: ['default' => true])]
    private bool $enabled = true;

    /** System rules cannot be deleted via API */
    #[ORM\Column(type: 'boolean', options: ['default' => false])]
    private bool $isSystem = false;

    #[ORM\Column(type: 'integer', options: ['default' => 0])]
    private int $cooldownMinutes = 0;

    #[ORM\Column(type: 'integer', nullable: true)]
    private ?int $dailyLimit = null;

    #[ORM\Column(type: 'integer', nullable: true)]
    private ?int $monthlyLimit = null;

    #[ORM\Column(type: 'datetime_immutable')]
    private DateTimeImmutable $createdAt;

    #[ORM\Column(type: 'datetime_immutable')]
    private DateTimeImmutable $updatedAt;

    public function getId(): ?int
    {
        return $this->id;
    }

    public function getActionType(): string
    {
        return $this->actionType;
    }

    public function setActionType(string $actionType): self
    {
        $this->actionType = $actionType;

        return $this;
    }

    public function getLabel(): string
    {
        return $this->label;
    }

    public function setLabel(string $label): self
    {
        $this->label = $label;

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

    public function getDescription(): ?string
    {
        return $this->description;
    }

    public function setDescription(?string $description): self
    {
        $this->description = $description;

        return $this;
    }

    public function getXpValue(): int
    {
        return $this->xpValue;
    }

    public function setXpValue(int $xpValue): self
    {
        $this->xpValue = $xpValue;

        return $this;
    }

    public function isEnabled(): bool
    {
        return $this->enabled;
    }

    public function setEnabled(bool $enabled): self
    {
        $this->enabled = $enabled;

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

    public function getCooldownMinutes(): int
    {
        return $this->cooldownMinutes;
    }

    public function setCooldownMinutes(int $cooldownMinutes): self
    {
        $this->cooldownMinutes = $cooldownMinutes;

        return $this;
    }

    public function getDailyLimit(): ?int
    {
        return $this->dailyLimit;
    }

    public function setDailyLimit(?int $dailyLimit): self
    {
        $this->dailyLimit = $dailyLimit;

        return $this;
    }

    public function getMonthlyLimit(): ?int
    {
        return $this->monthlyLimit;
    }

    public function setMonthlyLimit(?int $monthlyLimit): self
    {
        $this->monthlyLimit = $monthlyLimit;

        return $this;
    }

    public function getCreatedAt(): DateTimeImmutable
    {
        return $this->createdAt;
    }

    public function setCreatedAt(DateTimeImmutable $createdAt): self
    {
        $this->createdAt = $createdAt;

        return $this;
    }

    public function getUpdatedAt(): DateTimeImmutable
    {
        return $this->updatedAt;
    }

    public function setUpdatedAt(DateTimeImmutable $updatedAt): self
    {
        $this->updatedAt = $updatedAt;

        return $this;
    }
}
