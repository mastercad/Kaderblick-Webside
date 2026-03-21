<?php

declare(strict_types=1);

namespace DoctrineMigrations;

use Doctrine\DBAL\Schema\Schema;
use Doctrine\Migrations\AbstractMigration;

final class Version20260307120000 extends AbstractMigration
{
    public function getDescription(): string
    {
        return 'Add github_issue_state table to track per-issue read/resolve state for GitHub issues integrated in the feedback workflow';
    }

    public function up(Schema $schema): void
    {
        $this->addSql(<<<'SQL'
            CREATE TABLE github_issue_state (
                issue_number INT NOT NULL,
                is_read TINYINT(1) NOT NULL DEFAULT 0,
                admin_note LONGTEXT DEFAULT NULL,
                PRIMARY KEY(issue_number)
            ) DEFAULT CHARACTER SET utf8mb4 COLLATE `utf8mb4_unicode_ci` ENGINE = InnoDB
        SQL);
    }

    public function down(Schema $schema): void
    {
        $this->addSql('DROP TABLE github_issue_state');
    }
}
