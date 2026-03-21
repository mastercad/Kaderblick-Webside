<?php

declare(strict_types=1);

namespace DoctrineMigrations;

use Doctrine\DBAL\Schema\Schema;
use Doctrine\Migrations\AbstractMigration;

final class Version20260302164026 extends AbstractMigration
{
    public function getDescription(): string
    {
        return 'Remove unique constraint on videos (game_id, name) - multiple videos per game can have the same name.';
    }

    public function up(Schema $schema): void
    {
        $this->addSql('DROP INDEX IF EXISTS uniq_game_name ON videos');
    }

    public function down(Schema $schema): void
    {
        $this->addSql('CREATE UNIQUE INDEX IF NOT EXISTS uniq_game_name ON videos (game_id, name)');
    }
}
