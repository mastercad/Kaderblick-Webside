<?php

declare(strict_types=1);

namespace DoctrineMigrations;

use Doctrine\DBAL\Schema\Schema;
use Doctrine\Migrations\AbstractMigration;

/**
 * Adds socks_size (Stutzen-/Sockengröße) and jacket_size (Trainingsjacke)
 * to the user table for complete kit size tracking.
 */
final class Version20260307140000 extends AbstractMigration
{
    public function getDescription(): string
    {
        return 'Add socks_size and jacket_size fields to user table';
    }

    public function up(Schema $schema): void
    {
        $this->addSql('ALTER TABLE users ADD socks_size VARCHAR(10) DEFAULT NULL, ADD jacket_size VARCHAR(3) DEFAULT NULL');
    }

    public function down(Schema $schema): void
    {
        $this->addSql('ALTER TABLE users DROP COLUMN socks_size, DROP COLUMN jacket_size');
    }
}
