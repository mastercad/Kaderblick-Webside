<?php

declare(strict_types=1);

namespace DoctrineMigrations;

use Doctrine\DBAL\Schema\Schema;
use Doctrine\Migrations\AbstractMigration;

/**
 * Extends xp_rules with configurable fields (category, description, enabled, cooldown, limits).
 */
final class Version20260309100000 extends AbstractMigration
{
    public function getDescription(): string
    {
        return 'Extend xp_rules table with category/enabled/cooldown/limits and seed defaults';
    }

    public function up(Schema $schema): void
    {
        // ── 1. Add new columns ────────────────────────────────────────────────
        $this->addSql(<<<'SQL'
            ALTER TABLE xp_rules
                ADD COLUMN category       VARCHAR(20)  NOT NULL DEFAULT 'platform' AFTER label,
                ADD COLUMN description    VARCHAR(255) NULL      AFTER category,
                ADD COLUMN enabled        TINYINT(1)   NOT NULL DEFAULT 1 AFTER xp_value,
                ADD COLUMN is_system      TINYINT(1)   NOT NULL DEFAULT 0 AFTER enabled,
                ADD COLUMN cooldown_minutes INT         NOT NULL DEFAULT 0 AFTER is_system,
                ADD COLUMN monthly_limit  INT          NULL      AFTER daily_limit
        SQL);

        // ── 2. Unique index on action_type (may already be present as de-facto PK candidate)
        $this->addSql(<<<'SQL'
            ALTER TABLE xp_rules
                ADD UNIQUE INDEX uniq_xp_rules_action_type (action_type)
        SQL);
    }

    public function down(Schema $schema): void
    {
        $this->addSql(<<<'SQL'
            ALTER TABLE xp_rules
                DROP INDEX  uniq_xp_rules_action_type,
                DROP COLUMN category,
                DROP COLUMN description,
                DROP COLUMN enabled,
                DROP COLUMN is_system,
                DROP COLUMN cooldown_minutes,
                DROP COLUMN monthly_limit
        SQL);
    }

    public function isTransactional(): bool
    {
        return false;
    }
}
