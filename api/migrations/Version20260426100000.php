<?php

declare(strict_types=1);

namespace DoctrineMigrations;

use Doctrine\DBAL\Schema\Schema;
use Doctrine\Migrations\AbstractMigration;

final class Version20260426100000 extends AbstractMigration
{
    public function getDescription(): string
    {
        return 'Create watchlist table for player/coach scouting watchlist feature';
    }

    public function up(Schema $schema): void
    {
        $this->abortIf(
            !$this->connection->getDatabasePlatform() instanceof \Doctrine\DBAL\Platforms\MariaDb1010Platform,
            "Migration can only be executed safely on '\\Doctrine\\DBAL\\Platforms\\MariaDb1010Platform'."
        );

        $this->addSql(<<<'SQL'
            CREATE TABLE watchlist (
                id INT AUTO_INCREMENT NOT NULL,
                watcher_id INT NOT NULL,
                watched_player_id INT DEFAULT NULL,
                watched_coach_id INT DEFAULT NULL,
                is_anonymous TINYINT(1) NOT NULL DEFAULT 1,
                created_at DATETIME NOT NULL COMMENT '(DC2Type:datetime_immutable)',
                UNIQUE INDEX uniq_watchlist_watcher_player (watcher_id, watched_player_id),
                UNIQUE INDEX uniq_watchlist_watcher_coach (watcher_id, watched_coach_id),
                INDEX idx_watchlist_watched_player (watched_player_id),
                INDEX idx_watchlist_watched_coach (watched_coach_id),
                PRIMARY KEY(id)
            ) DEFAULT CHARACTER SET utf8mb4 COLLATE `utf8mb4_unicode_ci` ENGINE = InnoDB
        SQL);

        $this->addSql(<<<'SQL'
            ALTER TABLE watchlist
                ADD CONSTRAINT fk_watchlist_users_watcher_id
                    FOREIGN KEY (watcher_id) REFERENCES users (id) ON DELETE CASCADE,
                ADD CONSTRAINT fk_watchlist_players_watched_player_id
                    FOREIGN KEY (watched_player_id) REFERENCES players (id) ON DELETE CASCADE,
                ADD CONSTRAINT fk_watchlist_coaches_watched_coach_id
                    FOREIGN KEY (watched_coach_id) REFERENCES coaches (id) ON DELETE CASCADE
        SQL);
    }

    public function down(Schema $schema): void
    {
        $this->abortIf(
            !$this->connection->getDatabasePlatform() instanceof \Doctrine\DBAL\Platforms\MariaDb1010Platform,
            "Migration can only be executed safely on '\\Doctrine\\DBAL\\Platforms\\MariaDb1010Platform'."
        );

        $this->addSql('ALTER TABLE watchlist DROP FOREIGN KEY fk_watchlist_users_watcher_id');
        $this->addSql('ALTER TABLE watchlist DROP FOREIGN KEY fk_watchlist_players_watched_player_id');
        $this->addSql('ALTER TABLE watchlist DROP FOREIGN KEY fk_watchlist_coaches_watched_coach_id');
        $this->addSql('DROP TABLE watchlist');
    }

    public function isTransactional(): bool
    {
        return false;
    }
}
