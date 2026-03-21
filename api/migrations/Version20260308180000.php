<?php

declare(strict_types=1);

namespace DoctrineMigrations;

use Doctrine\DBAL\Schema\Schema;
use Doctrine\Migrations\AbstractMigration;

final class Version20260308180000 extends AbstractMigration
{
    public function getDescription(): string
    {
        return 'Create system_settings table and seed default values';
    }

    public function up(Schema $schema): void
    {
        $this->addSql(<<<'SQL'
            CREATE TABLE system_settings (
                id INT AUTO_INCREMENT NOT NULL,
                setting_key VARCHAR(100) NOT NULL,
                value LONGTEXT NOT NULL,
                updated_at DATETIME NOT NULL COMMENT '(DC2Type:datetime_immutable)' DEFAULT CURRENT_TIMESTAMP,
                UNIQUE INDEX uniq_system_settings_key (setting_key),
                PRIMARY KEY(id)
            ) DEFAULT CHARACTER SET utf8mb4 COLLATE `utf8mb4_unicode_ci` ENGINE = InnoDB
        SQL);

        // Seed the default value: dialog is enabled by default
        $this->addSql(<<<'SQL'
            INSERT INTO system_settings (setting_key, value, updated_at)
            VALUES ('registration_context_enabled', 'true', NOW())
        SQL);
    }

    public function down(Schema $schema): void
    {
        $this->addSql('DROP TABLE system_settings');
    }

    public function isTransactional(): bool
    {
        return false;
    }
}
