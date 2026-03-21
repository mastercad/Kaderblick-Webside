<?php

declare(strict_types=1);

namespace DoctrineMigrations;

use Doctrine\DBAL\Schema\Schema;
use Doctrine\Migrations\AbstractMigration;

final class Version20260310100000 extends AbstractMigration
{
    public function getDescription(): string
    {
        return 'Create cups table and add cup_id to games';
    }

    public function up(Schema $schema): void
    {
        $this->abortIf(
            !$this->connection->getDatabasePlatform() instanceof \Doctrine\DBAL\Platforms\MariaDb1010Platform,
            "Migration can only be executed safely on '\Doctrine\DBAL\Platforms\MariaDb1010Platform'."
        );

        $this->addSql(<<<'SQL'
            CREATE TABLE cups (
              id INT AUTO_INCREMENT NOT NULL,
              name VARCHAR(255) NOT NULL,
              PRIMARY KEY(id)
            ) DEFAULT CHARACTER SET utf8mb4 COLLATE `utf8mb4_unicode_ci` ENGINE = InnoDB
        SQL);
        $this->addSql(<<<'SQL'
            ALTER TABLE games ADD cup_id INT DEFAULT NULL
        SQL);
        $this->addSql(<<<'SQL'
            ALTER TABLE games ADD CONSTRAINT fk_games_cups_cup_id FOREIGN KEY (cup_id) REFERENCES cups (id) ON DELETE SET NULL
        SQL);
        $this->addSql(<<<'SQL'
            CREATE INDEX idx_games_cup_id ON games (cup_id)
        SQL);
    }

    public function down(Schema $schema): void
    {
        $this->abortIf(
            !$this->connection->getDatabasePlatform() instanceof \Doctrine\DBAL\Platforms\MariaDb1010Platform,
            "Migration can only be executed safely on '\Doctrine\DBAL\Platforms\MariaDb1010Platform'."
        );

        $this->addSql(<<<'SQL'
            ALTER TABLE games DROP FOREIGN KEY fk_games_cups_cup_id
        SQL);
        $this->addSql(<<<'SQL'
            DROP INDEX idx_games_cup_id ON games
        SQL);
        $this->addSql(<<<'SQL'
            ALTER TABLE games DROP cup_id
        SQL);
        $this->addSql(<<<'SQL'
            DROP TABLE cups
        SQL);
    }

    public function isTransactional(): bool
    {
        return false;
    }
}
