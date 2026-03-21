<?php

declare(strict_types=1);

namespace DoctrineMigrations;

use Doctrine\DBAL\Schema\Schema;
use Doctrine\Migrations\AbstractMigration;

final class Version20260312120000 extends AbstractMigration
{
    public function getDescription(): string
    {
        return 'Add half-time duration and extra-time fields to games table';
    }

    public function up(Schema $schema): void
    {
        $this->abortIf(
            !$this->connection->getDatabasePlatform() instanceof \Doctrine\DBAL\Platforms\MariaDb1010Platform,
            'Migration can only be executed safely on MariaDB 10.10.'
        );

        // Reguläre Halbzeitdauer (z.B. 45 bei Erwachsenen, 30/35 bei Jugend)
        $this->addSql("ALTER TABLE games ADD half_duration SMALLINT NOT NULL DEFAULT 45 COMMENT 'Reguläre Halbzeitdauer in Minuten'");

        // Nachspielzeit pro Halbzeit (nullable = nicht erfasst)
        $this->addSql("ALTER TABLE games ADD first_half_extra_time SMALLINT DEFAULT NULL COMMENT 'Nachspielzeit 1. Halbzeit in Minuten'");
        $this->addSql("ALTER TABLE games ADD second_half_extra_time SMALLINT DEFAULT NULL COMMENT 'Nachspielzeit 2. Halbzeit in Minuten'");

        // Halbzeitpausendauer (für Video-Timeline-Korrektur)
        $this->addSql("ALTER TABLE games ADD halftime_break_duration SMALLINT NOT NULL DEFAULT 15 COMMENT 'Halbzeitpausendauer in Minuten'");
    }

    public function down(Schema $schema): void
    {
        $this->abortIf(
            !$this->connection->getDatabasePlatform() instanceof \Doctrine\DBAL\Platforms\MariaDb1010Platform,
            'Migration can only be executed safely on MariaDB 10.10.'
        );

        $this->addSql('ALTER TABLE games DROP half_duration, DROP first_half_extra_time, DROP second_half_extra_time, DROP halftime_break_duration');
    }
}
