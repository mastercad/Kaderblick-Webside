<?php

declare(strict_types=1);

namespace DoctrineMigrations;

use Doctrine\DBAL\Schema\Schema;
use Doctrine\Migrations\AbstractMigration;

final class Version20260313110000 extends AbstractMigration
{
    public function getDescription(): string
    {
        return 'Fügt das Feld last_activity_at zur users-Tabelle hinzu (SUPERADMIN-Aktivitätsübersicht).';
    }

    public function up(Schema $schema): void
    {
        $this->addSql('ALTER TABLE users ADD last_activity_at DATETIME DEFAULT NULL');
    }

    public function down(Schema $schema): void
    {
        $this->addSql('ALTER TABLE users DROP COLUMN last_activity_at');
    }
}
