<?php

declare(strict_types=1);

namespace DoctrineMigrations;

use Doctrine\DBAL\Schema\Schema;
use Doctrine\Migrations\AbstractMigration;

final class Version20260305190000 extends AbstractMigration
{
    public function getDescription(): string
    {
        return 'Add reminders_sent and initial_notification_sent to survey table for push notification reminders';
    }

    public function up(Schema $schema): void
    {
        $this->addSql(<<<'SQL'
            ALTER TABLE survey ADD reminders_sent JSON DEFAULT '[]' NOT NULL, ADD initial_notification_sent TINYINT(1) DEFAULT 0 NOT NULL
        SQL);
    }

    public function down(Schema $schema): void
    {
        $this->addSql(<<<'SQL'
            ALTER TABLE survey DROP reminders_sent, DROP initial_notification_sent
        SQL);
    }
}
