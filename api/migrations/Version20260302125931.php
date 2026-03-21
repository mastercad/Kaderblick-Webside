<?php

declare(strict_types=1);

namespace DoctrineMigrations;

use Doctrine\DBAL\Schema\Schema;
use Doctrine\Migrations\AbstractMigration;
use Throwable;

/**
 * Auto-generated Migration: Please modify to your needs!
 */
final class Version20260302125931 extends AbstractMigration
{
    public function getDescription(): string
    {
        return '';
    }

    public function up(Schema $schema): void
    {
        // this up() migration is auto-generated, please modify it to your needs
        $this->abortIf(
            !$this->connection->getDatabasePlatform() instanceof \Doctrine\DBAL\Platforms\MariaDb1010Platform,
            "Migration can only be executed safely on '\Doctrine\DBAL\Platforms\MariaDb1010Platform'."
        );

        // All statements are executed individually with error handling
        // because a previous partial run may have already applied some of them.
        $statements = [
            'DROP TABLE IF EXISTS goals',

            // CREATE INDEX - use IF NOT EXISTS for idempotency
            'CREATE UNIQUE INDEX IF NOT EXISTS uniq_age_groups_name ON age_groups (name)',
            'CREATE UNIQUE INDEX IF NOT EXISTS unique_location_name ON locations (name)',
            'CREATE UNIQUE INDEX IF NOT EXISTS uniq_user_event ON participations (user_id, event_id)',
            'CREATE INDEX IF NOT EXISTS idx_player_titles_is_active ON player_titles (is_active)',
            'CREATE UNIQUE INDEX IF NOT EXISTS uniq_player_title_active ON player_titles (player_id, title_category, title_scope, team_id, league_id, is_active)',
            'CREATE UNIQUE INDEX IF NOT EXISTS uniq_position_name ON positions (name)',
            'CREATE UNIQUE INDEX IF NOT EXISTS uniq_surface_type_name ON surface_types (name)',
            'CREATE INDEX IF NOT EXISTS idx_teams_name ON teams (name)',
            'CREATE UNIQUE INDEX IF NOT EXISTS uniq_game_sort ON videos (game_id, sort)',
            'CREATE UNIQUE INDEX IF NOT EXISTS uniq_game_name ON videos (game_id, name)',

            // RENAME INDEX statements
            'ALTER TABLE coach_club_assignments RENAME INDEX idx_coach_club_assignments_coach_id TO idx_coach_club_assignment_coach_id',
            'ALTER TABLE coach_club_assignments RENAME INDEX idx_coach_club_assignments_club_id TO idx_coach_club_assignment_club_id',
            'ALTER TABLE coach_license_assignments RENAME INDEX idx_coach_license_assignments_coach_id TO idx_coach_license_assignment_coach_id',
            'ALTER TABLE coach_license_assignments RENAME INDEX idx_coach_license_assignments_license_id TO idx_coach_license_assignment_license_id',
            'ALTER TABLE coach_nationality_assignments RENAME INDEX idx_coach_nationality_assignments_coach_id TO idx_coach_nationality_assignment_coach_id',
            'ALTER TABLE coach_nationality_assignments RENAME INDEX idx_coach_nationality_assignments_nationality_id TO idx_coach_nationality_assignment_nationality_id',
            'ALTER TABLE coach_team_assignments RENAME INDEX idx_coach_team_assignments_coach_id TO idx_coach_team_assignment_coach_id',
            'ALTER TABLE coach_team_assignments RENAME INDEX idx_coach_team_assignments_team_id TO idx_coach_team_assignment_team_id',
            'ALTER TABLE coach_team_assignments RENAME INDEX idx_coach_team_assignments_coach_team_assignment_type_id TO idx_coach_team_assignment_coach_team_assignment_type_id',
            'ALTER TABLE formations RENAME INDEX idx_formations_user_id TO idx_formation_user_id',
            'ALTER TABLE formations RENAME INDEX idx_formations_formation_type_id TO idx_formation_formation_type_id',
            'ALTER TABLE game_types RENAME INDEX uniq_game_types_name TO uniq_game_type_name',
            'ALTER TABLE locations RENAME INDEX idx_locations_surface_type_id TO idx_location_surface_type_id',
            'ALTER TABLE nationalities RENAME INDEX uniq_nationalities_iso_code TO uniq_nationality_iso_code',
            'ALTER TABLE player_club_assignments RENAME INDEX idx_player_club_assignments_player_id TO idx_player_club_assignment_player_id',
            'ALTER TABLE player_club_assignments RENAME INDEX idx_player_club_assignments_club_id TO idx_player_club_assignment_club_id',
            'ALTER TABLE player_nationality_assignments RENAME INDEX idx_player_nationality_assignments_player_id TO idx_player_nationality_assignment_player_id',
            'ALTER TABLE player_nationality_assignments RENAME INDEX idx_player_nationality_assignments_nationality_id TO idx_player_nationality_assignment_nationality_id',
            'ALTER TABLE refresh_tokens RENAME INDEX idx_refresh_tokens_user_id TO idx_refresh_token_user_id',
            'ALTER TABLE refresh_tokens RENAME INDEX uniq_refresh_tokens_token TO uniq_refresh_token_token',
            'ALTER TABLE strong_feet RENAME INDEX uniq_strong_feet_code TO uniq_strong_foot_code',
            'ALTER TABLE substitutions RENAME INDEX idx_substitutions_game_id TO idx_substitution_game_id',
            'ALTER TABLE substitutions RENAME INDEX idx_substitutions_player_in_id TO idx_substitution_player_in_id',
            'ALTER TABLE substitutions RENAME INDEX idx_substitutions_player_out_id TO idx_substitution_player_out_id',
            'ALTER TABLE substitutions RENAME INDEX idx_substitutions_team_id TO idx_substitution_team_id',
            'ALTER TABLE substitutions RENAME INDEX idx_substitutions_substitution_reason_id TO idx_substitution_substitution_reason_id',
            'ALTER TABLE videos RENAME INDEX idx_videos_created_from_id TO idx_videos_created_from',
            'ALTER TABLE videos RENAME INDEX idx_videos_updated_from_id TO idx_videos_updated_from',
            'ALTER TABLE video_types RENAME INDEX idx_video_types_created_from_id TO idx_video_types_created_from',
            'ALTER TABLE video_types RENAME INDEX idx_video_types_updated_from_id TO idx_video_types_updated_from',
        ];

        foreach ($statements as $sql) {
            try {
                $this->connection->executeStatement($sql);
            } catch (Throwable $e) {
                $this->write(sprintf('  <comment>Skipped (already applied): %s</comment>', substr($sql, 0, 80)));
            }
        }
    }

    public function down(Schema $schema): void
    {
        // this down() migration is auto-generated, please modify it to your needs
        $this->abortIf(
            !$this->connection->getDatabasePlatform() instanceof \Doctrine\DBAL\Platforms\MariaDb1010Platform,
            "Migration can only be executed safely on '\Doctrine\DBAL\Platforms\MariaDb1010Platform'."
        );

        $this->addSql(<<<'SQL'
            CREATE TABLE goals (
              id INT AUTO_INCREMENT NOT NULL,
              game_id INT NOT NULL,
              assist_by_id INT DEFAULT NULL,
              scorer_id INT NOT NULL,
              minute INT NOT NULL,
              own_goal TINYINT(1) NOT NULL,
              penalty TINYINT(1) NOT NULL,
              INDEX idx_goals_assist_by_id (assist_by_id),
              INDEX idx_goals_scorer_id (scorer_id),
              INDEX idx_goals_game_id (game_id),
              PRIMARY KEY(id)
            ) DEFAULT CHARACTER SET utf8mb4 COLLATE `utf8mb4_unicode_ci` ENGINE = InnoDB COMMENT = ''
        SQL);
        $this->addSql(<<<'SQL'
            ALTER TABLE
              goals
            ADD
              CONSTRAINT fk_goals_players_scorer_id FOREIGN KEY (scorer_id) REFERENCES players (id)
        SQL);
        $this->addSql(<<<'SQL'
            ALTER TABLE goals ADD CONSTRAINT fk_goals_games FOREIGN KEY (game_id) REFERENCES games (id)
        SQL);
        $this->addSql(<<<'SQL'
            ALTER TABLE
              goals
            ADD
              CONSTRAINT fk_goals_players FOREIGN KEY (assist_by_id) REFERENCES players (id)
        SQL);
        $this->addSql(<<<'SQL'
            ALTER TABLE strong_feet RENAME INDEX uniq_strong_foot_code TO uniq_strong_feet_code
        SQL);
        $this->addSql(<<<'SQL'
            DROP INDEX uniq_surface_type_name ON surface_types
        SQL);
        $this->addSql(<<<'SQL'
            ALTER TABLE game_types RENAME INDEX uniq_game_type_name TO uniq_game_types_name
        SQL);
        $this->addSql(<<<'SQL'
            ALTER TABLE
              nationalities RENAME INDEX uniq_nationality_iso_code TO uniq_nationalities_iso_code
        SQL);
        $this->addSql(<<<'SQL'
            DROP INDEX uniq_game_sort ON videos
        SQL);
        $this->addSql(<<<'SQL'
            DROP INDEX uniq_game_name ON videos
        SQL);
        $this->addSql(<<<'SQL'
            ALTER TABLE videos RENAME INDEX idx_videos_updated_from TO idx_videos_updated_from_id
        SQL);
        $this->addSql(<<<'SQL'
            ALTER TABLE videos RENAME INDEX idx_videos_created_from TO idx_videos_created_from_id
        SQL);
        $this->addSql(<<<'SQL'
            ALTER TABLE refresh_tokens RENAME INDEX uniq_refresh_token_token TO uniq_refresh_tokens_token
        SQL);
        $this->addSql(<<<'SQL'
            ALTER TABLE
              refresh_tokens RENAME INDEX idx_refresh_token_user_id TO idx_refresh_tokens_user_id
        SQL);
        $this->addSql(<<<'SQL'
            DROP INDEX uniq_position_name ON positions
        SQL);
        $this->addSql(<<<'SQL'
            ALTER TABLE
              player_nationality_assignments RENAME INDEX idx_player_nationality_assignment_player_id TO idx_player_nationality_assignments_player_id
        SQL);
        $this->addSql(<<<'SQL'
            ALTER TABLE
              player_nationality_assignments RENAME INDEX idx_player_nationality_assignment_nationality_id TO idx_player_nationality_assignments_nationality_id
        SQL);
        $this->addSql(<<<'SQL'
            ALTER TABLE
              coach_team_assignments RENAME INDEX idx_coach_team_assignment_team_id TO idx_coach_team_assignments_team_id
        SQL);
        $this->addSql(<<<'SQL'
            ALTER TABLE
              coach_team_assignments RENAME INDEX idx_coach_team_assignment_coach_id TO idx_coach_team_assignments_coach_id
        SQL);
        $this->addSql(<<<'SQL'
            ALTER TABLE
              coach_team_assignments RENAME INDEX idx_coach_team_assignment_coach_team_assignment_type_id TO idx_coach_team_assignments_coach_team_assignment_type_id
        SQL);
        $this->addSql(<<<'SQL'
            ALTER TABLE
              player_club_assignments RENAME INDEX idx_player_club_assignment_club_id TO idx_player_club_assignments_club_id
        SQL);
        $this->addSql(<<<'SQL'
            ALTER TABLE
              player_club_assignments RENAME INDEX idx_player_club_assignment_player_id TO idx_player_club_assignments_player_id
        SQL);
        $this->addSql(<<<'SQL'
            DROP INDEX uniq_user_event ON participations
        SQL);
        $this->addSql(<<<'SQL'
            DROP INDEX unique_location_name ON locations
        SQL);
        $this->addSql(<<<'SQL'
            ALTER TABLE
              locations RENAME INDEX idx_location_surface_type_id TO idx_locations_surface_type_id
        SQL);
        $this->addSql(<<<'SQL'
            DROP INDEX idx_player_titles_is_active ON player_titles
        SQL);
        $this->addSql(<<<'SQL'
            DROP INDEX uniq_player_title_active ON player_titles
        SQL);
        $this->addSql(<<<'SQL'
            ALTER TABLE
              coach_license_assignments RENAME INDEX idx_coach_license_assignment_license_id TO idx_coach_license_assignments_license_id
        SQL);
        $this->addSql(<<<'SQL'
            ALTER TABLE
              coach_license_assignments RENAME INDEX idx_coach_license_assignment_coach_id TO idx_coach_license_assignments_coach_id
        SQL);
        $this->addSql(<<<'SQL'
            ALTER TABLE
              coach_club_assignments RENAME INDEX idx_coach_club_assignment_coach_id TO idx_coach_club_assignments_coach_id
        SQL);
        $this->addSql(<<<'SQL'
            ALTER TABLE
              coach_club_assignments RENAME INDEX idx_coach_club_assignment_club_id TO idx_coach_club_assignments_club_id
        SQL);
        $this->addSql(<<<'SQL'
            ALTER TABLE formations RENAME INDEX idx_formation_user_id TO idx_formations_user_id
        SQL);
        $this->addSql(<<<'SQL'
            ALTER TABLE
              formations RENAME INDEX idx_formation_formation_type_id TO idx_formations_formation_type_id
        SQL);
        $this->addSql(<<<'SQL'
            ALTER TABLE
              video_types RENAME INDEX idx_video_types_created_from TO idx_video_types_created_from_id
        SQL);
        $this->addSql(<<<'SQL'
            ALTER TABLE
              video_types RENAME INDEX idx_video_types_updated_from TO idx_video_types_updated_from_id
        SQL);
        $this->addSql(<<<'SQL'
            DROP INDEX uniq_age_groups_name ON age_groups
        SQL);
        $this->addSql(<<<'SQL'
            DROP INDEX idx_teams_name ON teams
        SQL);
        $this->addSql(<<<'SQL'
            ALTER TABLE
              coach_nationality_assignments RENAME INDEX idx_coach_nationality_assignment_coach_id TO idx_coach_nationality_assignments_coach_id
        SQL);
        $this->addSql(<<<'SQL'
            ALTER TABLE
              coach_nationality_assignments RENAME INDEX idx_coach_nationality_assignment_nationality_id TO idx_coach_nationality_assignments_nationality_id
        SQL);
        $this->addSql(<<<'SQL'
            ALTER TABLE
              substitutions RENAME INDEX idx_substitution_player_out_id TO idx_substitutions_player_out_id
        SQL);
        $this->addSql(<<<'SQL'
            ALTER TABLE substitutions RENAME INDEX idx_substitution_team_id TO idx_substitutions_team_id
        SQL);
        $this->addSql(<<<'SQL'
            ALTER TABLE substitutions RENAME INDEX idx_substitution_game_id TO idx_substitutions_game_id
        SQL);
        $this->addSql(<<<'SQL'
            ALTER TABLE
              substitutions RENAME INDEX idx_substitution_substitution_reason_id TO idx_substitutions_substitution_reason_id
        SQL);
        $this->addSql(<<<'SQL'
            ALTER TABLE
              substitutions RENAME INDEX idx_substitution_player_in_id TO idx_substitutions_player_in_id
        SQL);
    }

    public function isTransactional(): bool
    {
        return false;
    }
}
