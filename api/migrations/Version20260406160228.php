<?php

declare(strict_types=1);

namespace DoctrineMigrations;

use Doctrine\DBAL\Schema\Schema;
use Doctrine\Migrations\AbstractMigration;

final class Version20260406160228 extends AbstractMigration
{
    public function getDescription(): string
    {
        return 'Add send-context columns (group_id, team_targets, club_targets, direct_recipient_ids) and thread columns (parent_id, thread_id) to messages table.';
    }

    public function up(Schema $schema): void
    {
        // send-context columns
        $this->addSql('ALTER TABLE messages ADD group_id INT DEFAULT NULL, ADD team_targets JSON DEFAULT NULL COMMENT \'(DC2Type:json)\', ADD club_targets JSON DEFAULT NULL COMMENT \'(DC2Type:json)\', ADD direct_recipient_ids JSON DEFAULT NULL COMMENT \'(DC2Type:json)\'');
        $this->addSql('ALTER TABLE messages ADD CONSTRAINT fk_messages_group_id FOREIGN KEY (group_id) REFERENCES message_groups (id) ON DELETE SET NULL');
        $this->addSql('CREATE INDEX idx_messages_group_id ON messages (group_id)');

        // thread columns
        $this->addSql('ALTER TABLE messages ADD COLUMN parent_id INT DEFAULT NULL, ADD COLUMN thread_id INT DEFAULT NULL');
        $this->addSql('ALTER TABLE messages ADD CONSTRAINT fk_messages_parent_id FOREIGN KEY (parent_id) REFERENCES messages (id) ON DELETE SET NULL, ADD CONSTRAINT fk_messages_thread_id FOREIGN KEY (thread_id) REFERENCES messages (id) ON DELETE SET NULL');
        $this->addSql('CREATE INDEX idx_messages_thread_id ON messages (thread_id)');
    }

    public function down(Schema $schema): void
    {
        // thread columns
        $this->addSql('ALTER TABLE messages DROP FOREIGN KEY fk_messages_parent_id');
        $this->addSql('ALTER TABLE messages DROP FOREIGN KEY fk_messages_thread_id');
        $this->addSql('DROP INDEX idx_messages_thread_id ON messages');
        $this->addSql('ALTER TABLE messages DROP COLUMN parent_id, DROP COLUMN thread_id');

        // send-context columns
        $this->addSql('ALTER TABLE messages DROP FOREIGN KEY fk_messages_group_id');
        $this->addSql('DROP INDEX idx_messages_group_id ON messages');
        $this->addSql('ALTER TABLE messages DROP group_id, DROP team_targets, DROP club_targets, DROP direct_recipient_ids');
    }

    public function isTransactional(): bool
    {
        return false;
    }
}
