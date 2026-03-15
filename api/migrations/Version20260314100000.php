<?php

declare(strict_types=1);

namespace DoctrineMigrations;

use Doctrine\DBAL\Schema\Schema;
use Doctrine\Migrations\AbstractMigration;

/**
 * Creates the tactic_presets table.
 *
 * Visibility model:
 *   - is_system = 1   → visible to every authenticated user
 *   - club_id set     → visible to all coaches of that club
 *   - created_by set  → visible only to its creator (personal preset)
 */
final class Version20260314100000 extends AbstractMigration
{
    public function getDescription(): string
    {
        return 'Create tactic_presets table for shareable tactical templates';
    }

    public function up(Schema $schema): void
    {
        $this->addSql(<<<SQL
            CREATE TABLE tactic_presets (
                id          INT AUTO_INCREMENT NOT NULL,
                club_id     INT          DEFAULT NULL,
                created_by  INT          DEFAULT NULL,
                title       VARCHAR(100) NOT NULL,
                category    VARCHAR(50)  NOT NULL,
                description LONGTEXT     NOT NULL,
                is_system   TINYINT(1)   NOT NULL DEFAULT 0,
                data        LONGTEXT     NOT NULL COMMENT '(DC2Type:json)',
                created_at  DATETIME     NOT NULL COMMENT '(DC2Type:datetime_immutable)',

                PRIMARY KEY (id),

                INDEX idx_tactic_presets_is_system (is_system),
                INDEX idx_tactic_presets_club_id   (club_id),
                INDEX idx_tactic_presets_created_by (created_by),

                CONSTRAINT fk_tactic_presets_club
                    FOREIGN KEY (club_id) REFERENCES clubs (id) ON DELETE CASCADE,

                CONSTRAINT fk_tactic_presets_created_by
                    FOREIGN KEY (created_by) REFERENCES users (id) ON DELETE SET NULL
            ) DEFAULT CHARACTER SET utf8mb4 COLLATE `utf8mb4_unicode_ci` ENGINE = InnoDB
        SQL);
    }

    public function down(Schema $schema): void
    {
        $this->addSql('DROP TABLE tactic_presets');
    }
}
