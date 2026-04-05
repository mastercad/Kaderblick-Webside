<?php

declare(strict_types=1);

namespace DoctrineMigrations;

use Doctrine\DBAL\Schema\Schema;
use Doctrine\Migrations\AbstractMigration;

final class Version20260405120000 extends AbstractMigration
{
    public function getDescription(): string
    {
        return 'Add matchday_views table and meeting_point/meeting_time to calendar_events';
    }

    public function up(Schema $schema): void
    {
        $this->addSql('CREATE TABLE IF NOT EXISTS matchday_views (id INT AUTO_INCREMENT NOT NULL, user_id INT NOT NULL, calendar_event_id INT NOT NULL, viewed_at DATETIME NOT NULL COMMENT \'(DC2Type:datetime_immutable)\', INDEX idx_matchday_view_user (user_id), INDEX idx_matchday_view_event (calendar_event_id), UNIQUE INDEX uniq_matchday_view_user_event (user_id, calendar_event_id), PRIMARY KEY(id)) DEFAULT CHARACTER SET utf8mb4 COLLATE `utf8mb4_unicode_ci` ENGINE = InnoDB');
        $this->addSql('ALTER TABLE matchday_views ADD CONSTRAINT fk_matchday_views_users_user_id FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE');
        $this->addSql('ALTER TABLE matchday_views ADD CONSTRAINT fk_matchday_views_calendar_events_calendar_event_id FOREIGN KEY (calendar_event_id) REFERENCES calendar_events (id) ON DELETE CASCADE');
        $this->addSql('ALTER TABLE calendar_events ADD COLUMN IF NOT EXISTS meeting_point VARCHAR(255) DEFAULT NULL, ADD COLUMN IF NOT EXISTS meeting_time DATETIME DEFAULT NULL');
    }

    public function down(Schema $schema): void
    {
        $this->addSql('ALTER TABLE matchday_views DROP FOREIGN KEY fk_matchday_views_calendar_events_calendar_event_id');
        $this->addSql('ALTER TABLE matchday_views DROP FOREIGN KEY fk_matchday_views_users_user_id');
        $this->addSql('DROP TABLE matchday_views');
        $this->addSql('ALTER TABLE calendar_events DROP COLUMN meeting_point, DROP COLUMN meeting_time');
    }

    public function isTransactional(): bool
    {
        return false;
    }
}
