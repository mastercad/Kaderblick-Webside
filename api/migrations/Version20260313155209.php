<?php

declare(strict_types=1);

namespace DoctrineMigrations;

use Doctrine\DBAL\Schema\Schema;
use Doctrine\Migrations\AbstractMigration;

/**
 * Auto-generated Migration: Please modify to your needs!
 */
final class Version20260313155209 extends AbstractMigration
{
    public function getDescription(): string
    {
        return '';
    }

    public function up(Schema $schema): void
    {
        // this up() migration is auto-generated, please modify it to your needs
        $this->addSql(<<<'SQL'
            CREATE TABLE external_calendars (id INT AUTO_INCREMENT NOT NULL, user_id INT NOT NULL, name VARCHAR(255) NOT NULL, color VARCHAR(7) DEFAULT '#2196f3' NOT NULL, url LONGTEXT NOT NULL, cached_content LONGTEXT DEFAULT NULL, last_fetched_at DATETIME DEFAULT NULL, is_enabled TINYINT(1) DEFAULT 1 NOT NULL, created_at DATETIME NOT NULL, INDEX IDX_A0842D1BA76ED395 (user_id), PRIMARY KEY(id)) DEFAULT CHARACTER SET utf8mb4 COLLATE `utf8mb4_unicode_ci` ENGINE = InnoDB
        SQL);
        $this->addSql(<<<'SQL'
            ALTER TABLE external_calendars ADD CONSTRAINT FK_A0842D1BA76ED395 FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
        SQL);
        $this->addSql(<<<'SQL'
            ALTER TABLE game_types CHANGE half_duration half_duration INT UNSIGNED DEFAULT NULL
        SQL);
        $this->addSql(<<<'SQL'
            ALTER TABLE games CHANGE half_duration half_duration SMALLINT DEFAULT 45 NOT NULL, CHANGE first_half_extra_time first_half_extra_time SMALLINT DEFAULT NULL, CHANGE second_half_extra_time second_half_extra_time SMALLINT DEFAULT NULL, CHANGE halftime_break_duration halftime_break_duration SMALLINT DEFAULT 15 NOT NULL
        SQL);
        $this->addSql(<<<'SQL'
            ALTER TABLE games RENAME INDEX idx_games_cup_id TO IDX_FF232B31FCAF0F56
        SQL);
        $this->addSql(<<<'SQL'
            ALTER TABLE users ADD calendar_token VARCHAR(64) DEFAULT NULL, ADD calendar_token_created_at DATETIME DEFAULT NULL
        SQL);
        $this->addSql(<<<'SQL'
            CREATE UNIQUE INDEX UNIQ_1483A5E93363A255 ON users (calendar_token)
        SQL);
        $this->addSql(<<<'SQL'
            ALTER TABLE users RENAME INDEX idx_users_api_token TO UNIQ_1483A5E97BA2F5EB
        SQL);
        $this->addSql(<<<'SQL'
            ALTER TABLE xp_rules CHANGE category category VARCHAR(20) NOT NULL
        SQL);
    }

    public function down(Schema $schema): void
    {
        // this down() migration is auto-generated, please modify it to your needs
        $this->addSql(<<<'SQL'
            ALTER TABLE external_calendars DROP FOREIGN KEY FK_A0842D1BA76ED395
        SQL);
        $this->addSql(<<<'SQL'
            DROP TABLE external_calendars
        SQL);
        $this->addSql(<<<'SQL'
            ALTER TABLE game_types CHANGE half_duration half_duration INT UNSIGNED DEFAULT NULL COMMENT 'Duration of one half in minutes'
        SQL);
        $this->addSql(<<<'SQL'
            DROP INDEX UNIQ_1483A5E93363A255 ON users
        SQL);
        $this->addSql(<<<'SQL'
            ALTER TABLE users DROP calendar_token, DROP calendar_token_created_at
        SQL);
        $this->addSql(<<<'SQL'
            ALTER TABLE users RENAME INDEX uniq_1483a5e97ba2f5eb TO idx_users_api_token
        SQL);
        $this->addSql(<<<'SQL'
            ALTER TABLE xp_rules CHANGE category category VARCHAR(20) DEFAULT 'platform' NOT NULL
        SQL);
        $this->addSql(<<<'SQL'
            ALTER TABLE games CHANGE half_duration half_duration SMALLINT DEFAULT 45 NOT NULL COMMENT 'Reguläre Halbzeitdauer in Minuten', CHANGE first_half_extra_time first_half_extra_time SMALLINT DEFAULT NULL COMMENT 'Nachspielzeit 1. Halbzeit in Minuten', CHANGE second_half_extra_time second_half_extra_time SMALLINT DEFAULT NULL COMMENT 'Nachspielzeit 2. Halbzeit in Minuten', CHANGE halftime_break_duration halftime_break_duration SMALLINT DEFAULT 15 NOT NULL COMMENT 'Halbzeitpausendauer in Minuten'
        SQL);
        $this->addSql(<<<'SQL'
            ALTER TABLE games RENAME INDEX idx_ff232b31fcaf0f56 TO idx_games_cup_id
        SQL);
    }

    public function isTransactional(): bool
    {
        return false;
    }
}
