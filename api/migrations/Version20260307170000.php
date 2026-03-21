<?php

declare(strict_types=1);

namespace DoctrineMigrations;

use Doctrine\DBAL\Schema\Schema;
use Doctrine\Migrations\AbstractMigration;

final class Version20260307170000 extends AbstractMigration
{
    public function getDescription(): string
    {
        return 'Add training series metadata fields to calendar_events';
    }

    public function up(Schema $schema): void
    {
        $this->abortIf(
            !$this->connection->getDatabasePlatform() instanceof \Doctrine\DBAL\Platforms\MariaDb1010Platform,
            "Migration can only be executed safely on 'Doctrine\DBAL\Platforms\MariaDb1010Platform'."
        );

        $this->addSql(<<<'SQL'
            ALTER TABLE calendar_events
                ADD training_weekdays JSON DEFAULT NULL,
                ADD training_series_end_date VARCHAR(10) DEFAULT NULL,
                ADD training_series_id VARCHAR(36) DEFAULT NULL
        SQL);
    }

    public function down(Schema $schema): void
    {
        $this->abortIf(
            !$this->connection->getDatabasePlatform() instanceof \Doctrine\DBAL\Platforms\MariaDb1010Platform,
            "Migration can only be executed safely on 'Doctrine\DBAL\Platforms\MariaDb1010Platform'."
        );

        $this->addSql(<<<'SQL'
            ALTER TABLE calendar_events
                DROP COLUMN training_weekdays,
                DROP COLUMN training_series_end_date,
                DROP COLUMN training_series_id
        SQL);
    }
}
