<?php

declare(strict_types=1);

namespace DoctrineMigrations;

use Doctrine\DBAL\Schema\Schema;
use Doctrine\Migrations\AbstractMigration;

final class Version20260320093000 extends AbstractMigration
{
    public function getDescription(): string
    {
        return 'Add index on game_events.timestamp to speed up report date filters';
    }

    public function up(Schema $schema): void
    {
        $this->addSql('CREATE INDEX idx_game_event_timestamp ON game_events (timestamp)');
    }

    public function down(Schema $schema): void
    {
        $this->addSql('DROP INDEX idx_game_event_timestamp ON game_events');
    }
}
