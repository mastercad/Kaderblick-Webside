<?php

declare(strict_types=1);

namespace DoctrineMigrations;

use Doctrine\DBAL\Schema\Schema;
use Doctrine\Migrations\AbstractMigration;

final class Version20260307100000 extends AbstractMigration
{
    public function getDescription(): string
    {
        return 'Add github_issue_number and github_issue_url to feedback table for GitHub integration';
    }

    public function up(Schema $schema): void
    {
        $this->addSql(<<<'SQL'
            ALTER TABLE feedback
                ADD github_issue_number INT DEFAULT NULL,
                ADD github_issue_url VARCHAR(512) DEFAULT NULL
        SQL);
    }

    public function down(Schema $schema): void
    {
        $this->addSql(<<<'SQL'
            ALTER TABLE feedback DROP github_issue_number, DROP github_issue_url
        SQL);
    }
}
