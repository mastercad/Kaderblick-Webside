<?php

declare(strict_types=1);

namespace DoctrineMigrations;

use Doctrine\DBAL\Schema\Schema;
use Doctrine\Migrations\AbstractMigration;

final class Version20260307150000 extends AbstractMigration
{
    public function getDescription(): string
    {
        return 'Add notification_preferences JSON column to users table';
    }

    public function up(Schema $schema): void
    {
        $this->addSql(<<<'SQL'
            ALTER TABLE users ADD notification_preferences JSON NULL COMMENT 'Per-category push notification preferences'
        SQL);
    }

    public function down(Schema $schema): void
    {
        $this->addSql('ALTER TABLE users DROP notification_preferences');
    }
}
