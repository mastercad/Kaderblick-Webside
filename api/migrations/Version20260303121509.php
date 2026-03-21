<?php

declare(strict_types=1);

namespace DoctrineMigrations;

use Doctrine\DBAL\Schema\Schema;
use Doctrine\Migrations\AbstractMigration;

/**
 * Auto-generated Migration: Please modify to your needs!
 */
final class Version20260303121509 extends AbstractMigration
{
    public function getDescription(): string
    {
        return '';
    }

    public function up(Schema $schema): void
    {
        // this up() migration is auto-generated, please modify it to your needs
        $this->abortIf(
            !$this->connection->getDatabasePlatform() instanceof \Doctrine\DBAL\Platforms\MariaDb1010Platform,
            "Migration can only be executed safely on '\Doctrine\DBAL\Platforms\MariaDb1010Platform'."
        );

        $this->addSql(<<<'SQL'
            ALTER TABLE calendar_events
              ADD cancelled TINYINT(1) DEFAULT 0 NOT NULL,
              ADD cancel_reason LONGTEXT DEFAULT NULL,
              ADD cancelled_by_id INT DEFAULT NULL
        SQL);
        $this->addSql(<<<'SQL'
            ALTER TABLE
              calendar_events
            ADD
              CONSTRAINT fk_calendar_events_users_cancelled_by_id FOREIGN KEY (cancelled_by_id) REFERENCES users (id) ON DELETE
            SET
              NULL
        SQL);
        $this->addSql(<<<'SQL'
            CREATE INDEX idx_calendar_events_cancelled_by_id ON calendar_events (cancelled_by_id)
        SQL);
    }

    public function down(Schema $schema): void
    {
        // this down() migration is auto-generated, please modify it to your needs
        $this->abortIf(
            !$this->connection->getDatabasePlatform() instanceof \Doctrine\DBAL\Platforms\MariaDb1010Platform,
            "Migration can only be executed safely on '\Doctrine\DBAL\Platforms\MariaDb1010Platform'."
        );

        $this->addSql(<<<'SQL'
            ALTER TABLE calendar_events DROP FOREIGN KEY fk_calendar_events_users_cancelled_by_id
        SQL);
        $this->addSql(<<<'SQL'
            DROP INDEX idx_calendar_events_cancelled_by_id ON calendar_events
        SQL);
        $this->addSql(<<<'SQL'
            ALTER TABLE calendar_events
              DROP cancelled,
              DROP cancel_reason,
              DROP cancelled_by_id
        SQL);
    }

    public function isTransactional(): bool
    {
        return false;
    }
}
