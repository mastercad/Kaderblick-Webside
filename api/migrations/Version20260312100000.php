<?php

declare(strict_types=1);

namespace DoctrineMigrations;

use Doctrine\DBAL\Schema\Schema;
use Doctrine\Migrations\AbstractMigration;

final class Version20260312100000 extends AbstractMigration
{
    public function getDescription(): string
    {
        return 'Add half_duration (minutes per half) to game_types table';
    }

    public function up(Schema $schema): void
    {
        $this->addSql(
            'ALTER TABLE game_types ADD half_duration INT UNSIGNED DEFAULT NULL COMMENT "Duration of one half in minutes"'
        );
    }

    public function down(Schema $schema): void
    {
        $this->addSql('ALTER TABLE game_types DROP COLUMN half_duration');
    }
}
