<?php

declare(strict_types=1);

namespace DoctrineMigrations;

use Doctrine\DBAL\Schema\Schema;
use Doctrine\Migrations\AbstractMigration;

final class Version20260313100000 extends AbstractMigration
{
    public function getDescription(): string
    {
        return 'Add default_half_duration and default_halftime_break_duration to teams table';
    }

    public function up(Schema $schema): void
    {
        $this->addSql('ALTER TABLE teams ADD COLUMN default_half_duration SMALLINT DEFAULT NULL, ADD COLUMN default_halftime_break_duration SMALLINT DEFAULT NULL');
    }

    public function down(Schema $schema): void
    {
        $this->addSql('ALTER TABLE teams DROP COLUMN default_half_duration, DROP COLUMN default_halftime_break_duration');
    }
}
