<?php

declare(strict_types=1);

namespace DoctrineMigrations;

use Doctrine\DBAL\Schema\Schema;
use Doctrine\Migrations\AbstractMigration;

final class Version20260308090000 extends AbstractMigration
{
    public function getDescription(): string
    {
        return 'Add registration_requests table for self-reported user-relation requests';
    }

    public function up(Schema $schema): void
    {
        $this->abortIf(
            !$this->connection->getDatabasePlatform() instanceof \Doctrine\DBAL\Platforms\MariaDb1010Platform,
            "Migration can only be executed safely on 'MariaDb1010Platform'."
        );

        $this->addSql(<<<'SQL'
            CREATE TABLE registration_requests (
                id INT AUTO_INCREMENT NOT NULL,
                user_id INT NOT NULL,
                player_id INT DEFAULT NULL,
                coach_id INT DEFAULT NULL,
                relation_type_id INT NOT NULL,
                processed_by_id INT DEFAULT NULL,
                status VARCHAR(20) NOT NULL DEFAULT 'pending',
                note LONGTEXT DEFAULT NULL,
                created_at DATETIME NOT NULL,
                processed_at DATETIME DEFAULT NULL,
                INDEX idx_registration_requests_user_id (user_id),
                INDEX idx_registration_requests_status (status),
                CONSTRAINT fk_registration_requests_user FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE,
                CONSTRAINT fk_registration_requests_player FOREIGN KEY (player_id) REFERENCES players (id) ON DELETE SET NULL,
                CONSTRAINT fk_registration_requests_coach FOREIGN KEY (coach_id) REFERENCES coaches (id) ON DELETE SET NULL,
                CONSTRAINT fk_registration_requests_relation_type FOREIGN KEY (relation_type_id) REFERENCES relation_types (id),
                CONSTRAINT fk_registration_requests_processed_by FOREIGN KEY (processed_by_id) REFERENCES users (id) ON DELETE SET NULL,
                PRIMARY KEY(id)
            ) DEFAULT CHARACTER SET utf8mb4 COLLATE `utf8mb4_unicode_ci` ENGINE = InnoDB
        SQL);
    }

    public function down(Schema $schema): void
    {
        $this->abortIf(
            !$this->connection->getDatabasePlatform() instanceof \Doctrine\DBAL\Platforms\MariaDb1010Platform,
            "Migration can only be executed safely on 'MariaDb1010Platform'."
        );

        $this->addSql('ALTER TABLE registration_requests DROP FOREIGN KEY fk_registration_requests_user');
        $this->addSql('ALTER TABLE registration_requests DROP FOREIGN KEY fk_registration_requests_player');
        $this->addSql('ALTER TABLE registration_requests DROP FOREIGN KEY fk_registration_requests_coach');
        $this->addSql('ALTER TABLE registration_requests DROP FOREIGN KEY fk_registration_requests_relation_type');
        $this->addSql('ALTER TABLE registration_requests DROP FOREIGN KEY fk_registration_requests_processed_by');
        $this->addSql('DROP TABLE registration_requests');
    }

    public function isTransactional(): bool
    {
        return false;
    }
}
