<?php

declare(strict_types=1);

namespace DoctrineMigrations;

use Doctrine\DBAL\Schema\Schema;
use Doctrine\Migrations\AbstractMigration;

final class Version20260309120000 extends AbstractMigration
{
    public function getDescription(): string
    {
        return 'Add api_token and api_token_created_at columns to users table';
    }

    public function up(Schema $schema): void
    {
        $this->addSql('ALTER TABLE users ADD api_token VARCHAR(64) DEFAULT NULL, ADD api_token_created_at DATETIME DEFAULT NULL');
        $this->addSql('CREATE UNIQUE INDEX idx_users_api_token ON users (api_token)');
    }

    public function down(Schema $schema): void
    {
        $this->addSql('DROP INDEX idx_users_api_token ON users');
        $this->addSql('ALTER TABLE users DROP api_token, DROP api_token_created_at');
    }
}
