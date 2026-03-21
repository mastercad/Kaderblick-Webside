<?php

namespace App\Entity;

use App\Repository\GithubIssueStateRepository;
use Doctrine\ORM\Mapping as ORM;

/**
 * Persists per-issue read/resolve state for GitHub issues that are not
 * linked to a platform feedback entry – so they can participate in the
 * Neu / In Bearbeitung / Erledigt workflow.
 */
#[ORM\Entity(repositoryClass: GithubIssueStateRepository::class)]
#[ORM\Table(name: 'github_issue_state')]
class GithubIssueState
{
    /** GitHub issue number – used directly as primary key, no auto-increment. */
    #[ORM\Id]
    #[ORM\Column(type: 'integer')]
    private int $issueNumber;

    #[ORM\Column(type: 'boolean')]
    private bool $isRead = false;

    #[ORM\Column(type: 'text', nullable: true)]
    private ?string $adminNote = null;

    public function getIssueNumber(): int
    {
        return $this->issueNumber;
    }

    public function setIssueNumber(int $issueNumber): void
    {
        $this->issueNumber = $issueNumber;
    }

    public function isRead(): bool
    {
        return $this->isRead;
    }

    public function setIsRead(bool $isRead): void
    {
        $this->isRead = $isRead;
    }

    public function getAdminNote(): ?string
    {
        return $this->adminNote;
    }

    public function setAdminNote(?string $adminNote): void
    {
        $this->adminNote = $adminNote;
    }
}
