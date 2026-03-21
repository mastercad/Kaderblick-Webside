<?php

declare(strict_types=1);

namespace DoctrineMigrations;

use Doctrine\DBAL\Schema\Schema;
use Doctrine\Migrations\AbstractMigration;

/**
 * Auto-generated Migration: Please modify to your needs!
 */
final class Version20260307161746 extends AbstractMigration
{
    public function getDescription(): string
    {
        return '';
    }

    public function up(Schema $schema): void
    {
        // this up() migration is auto-generated, please modify it to your needs
        $this->addSql(<<<'SQL'
            ALTER TABLE age_groups RENAME INDEX uniq_age_groups_code TO UNIQ_E994440777153098
        SQL);
        $this->addSql(<<<'SQL'
            ALTER TABLE calendar_events RENAME INDEX idx_calendar_events_cancelled_by_id TO IDX_F9E14F16187B2D12
        SQL);
        $this->addSql(<<<'SQL'
            ALTER TABLE calendar_events RENAME INDEX idx_calendar_events_created_by_id TO IDX_F9E14F16B03A8386
        SQL);
        $this->addSql(<<<'SQL'
            ALTER TABLE camera RENAME INDEX idx_camera_created_from_id TO IDX_3B1CEE053EA4CB4D
        SQL);
        $this->addSql(<<<'SQL'
            ALTER TABLE camera RENAME INDEX idx_camera_updated_from_id TO IDX_3B1CEE0564C49DD8
        SQL);
        $this->addSql(<<<'SQL'
            ALTER TABLE clubs RENAME INDEX uniq_clubs_fussball_de_id TO UNIQ_A5BD312367A1B74A
        SQL);
        $this->addSql(<<<'SQL'
            ALTER TABLE dashboard_widgets RENAME INDEX idx_dashboard_widgets_report_definition_id TO IDX_2CBC36EC58C3E861
        SQL);
        $this->addSql(<<<'SQL'
            ALTER TABLE dashboard_widgets RENAME INDEX idx_dashboard_widgets_user_id TO IDX_2CBC36ECA76ED395
        SQL);
        $this->addSql(<<<'SQL'
            ALTER TABLE feedback_comment CHANGE is_admin_message is_admin_message TINYINT(1) NOT NULL, CHANGE is_read_by_recipient is_read_by_recipient TINYINT(1) NOT NULL
        SQL);
        $this->addSql(<<<'SQL'
            ALTER TABLE feedback_comment RENAME INDEX idx_feedback_comment_author TO IDX_52D72CFF675F31B
        SQL);
        $this->addSql(<<<'SQL'
            ALTER TABLE game_event_types RENAME INDEX uniq_game_event_types_code TO UNIQ_C67E7A1E77153098
        SQL);
        $this->addSql(<<<'SQL'
            ALTER TABLE game_events RENAME INDEX idx_game_events_game_id TO IDX_2EB2FA82E48FD905
        SQL);
        $this->addSql(<<<'SQL'
            ALTER TABLE game_events RENAME INDEX idx_game_events_game_event_type_id TO IDX_2EB2FA82EAFFB957
        SQL);
        $this->addSql(<<<'SQL'
            ALTER TABLE game_events RENAME INDEX idx_game_events_player_id TO IDX_2EB2FA8299E6F5DF
        SQL);
        $this->addSql(<<<'SQL'
            ALTER TABLE game_events RENAME INDEX idx_game_events_team_id TO IDX_2EB2FA82296CD8AE
        SQL);
        $this->addSql(<<<'SQL'
            ALTER TABLE game_events RENAME INDEX idx_game_events_related_player_id TO IDX_2EB2FA823127A9C4
        SQL);
        $this->addSql(<<<'SQL'
            ALTER TABLE game_events RENAME INDEX idx_game_events_substitution_reason_id TO IDX_2EB2FA82DAB8CE79
        SQL);
        $this->addSql(<<<'SQL'
            ALTER TABLE games RENAME INDEX uniq_games_fussball_de_id TO UNIQ_FF232B3167A1B74A
        SQL);
        $this->addSql(<<<'SQL'
            ALTER TABLE games RENAME INDEX idx_games_league_id TO IDX_FF232B3158AFC4DE
        SQL);
        $this->addSql(<<<'SQL'
            ALTER TABLE github_issue_state CHANGE is_read is_read TINYINT(1) NOT NULL
        SQL);
        $this->addSql(<<<'SQL'
            ALTER TABLE message_group_members RENAME INDEX idx_message_group_members_message_group_id TO IDX_8A0DC08BF7721D56
        SQL);
        $this->addSql(<<<'SQL'
            ALTER TABLE message_group_members RENAME INDEX idx_message_group_members_user_id TO IDX_8A0DC08BA76ED395
        SQL);
        $this->addSql(<<<'SQL'
            ALTER TABLE message_recipients RENAME INDEX idx_message_recipients_message_id TO IDX_DBB61E5B537A1329
        SQL);
        $this->addSql(<<<'SQL'
            ALTER TABLE message_recipients RENAME INDEX idx_message_recipients_user_id TO IDX_DBB61E5BA76ED395
        SQL);
        $this->addSql(<<<'SQL'
            ALTER TABLE news RENAME INDEX idx_news_club_id TO IDX_1DD3995061190A32
        SQL);
        $this->addSql(<<<'SQL'
            ALTER TABLE news RENAME INDEX idx_news_team_id TO IDX_1DD39950296CD8AE
        SQL);
        $this->addSql(<<<'SQL'
            ALTER TABLE news RENAME INDEX idx_news_created_by TO IDX_1DD39950DE12AB56
        SQL);
        $this->addSql(<<<'SQL'
            ALTER TABLE notifications RENAME INDEX idx_notifications_user_id TO IDX_6000B0D3A76ED395
        SQL);
        $this->addSql(<<<'SQL'
            ALTER TABLE participation_statuses RENAME INDEX uniq_participation_statuses_code TO UNIQ_A7D8928677153098
        SQL);
        $this->addSql(<<<'SQL'
            ALTER TABLE password_reset_tokens RENAME INDEX uniq_password_reset_tokens_token TO UNIQ_3967A2165F37A13B
        SQL);
        $this->addSql(<<<'SQL'
            ALTER TABLE password_reset_tokens RENAME INDEX idx_password_reset_tokens_user_id TO IDX_3967A216A76ED395
        SQL);
        $this->addSql(<<<'SQL'
            ALTER TABLE player_game_stats RENAME INDEX idx_player_game_stats_game_id TO IDX_3AD19A18E48FD905
        SQL);
        $this->addSql(<<<'SQL'
            ALTER TABLE player_game_stats RENAME INDEX idx_player_game_stats_player_id TO IDX_3AD19A1899E6F5DF
        SQL);
        $this->addSql(<<<'SQL'
            ALTER TABLE player_team_assignments RENAME INDEX idx_player_team_assignments_player_id TO IDX_3A6D3D0B99E6F5DF
        SQL);
        $this->addSql(<<<'SQL'
            ALTER TABLE player_team_assignments RENAME INDEX idx_player_team_assignments_player_team_assignment_type_id TO IDX_3A6D3D0B2F42103A
        SQL);
        $this->addSql(<<<'SQL'
            ALTER TABLE player_team_assignments RENAME INDEX idx_player_team_assignments_team_id TO IDX_3A6D3D0B296CD8AE
        SQL);
        $this->addSql(<<<'SQL'
            ALTER TABLE players RENAME INDEX uniq_players_fussball_de_id TO UNIQ_264E43A667A1B74A
        SQL);
        $this->addSql(<<<'SQL'
            ALTER TABLE player_alternative_positions RENAME INDEX idx_player_alternative_positions_player_id TO IDX_47210A0299E6F5DF
        SQL);
        $this->addSql(<<<'SQL'
            ALTER TABLE player_alternative_positions RENAME INDEX idx_player_alternative_positions_position_id TO IDX_47210A02DD842E46
        SQL);
        $this->addSql(<<<'SQL'
            ALTER TABLE push_subscriptions RENAME INDEX idx_push_subscriptions_user_id TO IDX_3FEC449DA76ED395
        SQL);
        $this->addSql(<<<'SQL'
            ALTER TABLE report_definitions RENAME INDEX idx_report_definitions_user_id TO IDX_22760ECAA76ED395
        SQL);
        $this->addSql(<<<'SQL'
            ALTER TABLE survey_team RENAME INDEX idx_survey_team_survey_id TO IDX_209A6D4B3FE509D
        SQL);
        $this->addSql(<<<'SQL'
            ALTER TABLE survey_team RENAME INDEX idx_survey_team_team_id TO IDX_209A6D4296CD8AE
        SQL);
        $this->addSql(<<<'SQL'
            ALTER TABLE survey_club RENAME INDEX idx_survey_club_survey_id TO IDX_7E0738B9B3FE509D
        SQL);
        $this->addSql(<<<'SQL'
            ALTER TABLE survey_club RENAME INDEX idx_survey_club_club_id TO IDX_7E0738B961190A32
        SQL);
        $this->addSql(<<<'SQL'
            ALTER TABLE survey_option RENAME INDEX idx_survey_option_created_by_id TO IDX_7288C8DCB03A8386
        SQL);
        $this->addSql(<<<'SQL'
            ALTER TABLE survey_option_survey_question RENAME INDEX idx_survey_option_survey_question_survey_option_id TO IDX_852A61872925F42
        SQL);
        $this->addSql(<<<'SQL'
            ALTER TABLE survey_option_survey_question RENAME INDEX idx_survey_option_survey_question_survey_question_id TO IDX_852A6187A6DF29BA
        SQL);
        $this->addSql(<<<'SQL'
            ALTER TABLE survey_option_type RENAME INDEX uniq_survey_option_type_type_key TO UNIQ_DC2822CF88874D48
        SQL);
        $this->addSql(<<<'SQL'
            ALTER TABLE survey_question RENAME INDEX idx_survey_question_survey_id TO IDX_EA000F69B3FE509D
        SQL);
        $this->addSql(<<<'SQL'
            ALTER TABLE survey_question RENAME INDEX idx_survey_question_type_id TO IDX_EA000F69C54C8C93
        SQL);
        $this->addSql(<<<'SQL'
            ALTER TABLE survey_response RENAME INDEX idx_survey_response_survey_id TO IDX_628C4DDCB3FE509D
        SQL);
        $this->addSql(<<<'SQL'
            ALTER TABLE task_assignments RENAME INDEX idx_task_assignments_task_id TO IDX_76FFFDEF8DB60186
        SQL);
        $this->addSql(<<<'SQL'
            ALTER TABLE task_assignments RENAME INDEX idx_task_assignments_user_id TO IDX_76FFFDEFA76ED395
        SQL);
        $this->addSql(<<<'SQL'
            ALTER TABLE task_assignments RENAME INDEX idx_task_assignments_substitute_user_id TO IDX_76FFFDEFF0E118F3
        SQL);
        $this->addSql(<<<'SQL'
            ALTER TABLE task_assignments RENAME INDEX uniq_task_assignments_calendar_event_id TO UNIQ_76FFFDEF7495C8E3
        SQL);
        $this->addSql(<<<'SQL'
            ALTER TABLE tasks RENAME INDEX idx_tasks_created_by_id TO IDX_50586597B03A8386
        SQL);
        $this->addSql(<<<'SQL'
            ALTER TABLE task_rotation_users RENAME INDEX idx_task_rotation_users_task_id TO IDX_AB5FFBFC8DB60186
        SQL);
        $this->addSql(<<<'SQL'
            ALTER TABLE task_rotation_users RENAME INDEX idx_task_rotation_users_user_id TO IDX_AB5FFBFCA76ED395
        SQL);
        $this->addSql(<<<'SQL'
            ALTER TABLE team_game_stats RENAME INDEX idx_team_game_stats_game_id TO IDX_5BAD6CE0E48FD905
        SQL);
        $this->addSql(<<<'SQL'
            ALTER TABLE team_game_stats RENAME INDEX idx_team_game_stats_team_id TO IDX_5BAD6CE0296CD8AE
        SQL);
        $this->addSql(<<<'SQL'
            ALTER TABLE team_ride RENAME INDEX idx_team_ride_event_id TO IDX_4ADC88AB71F7E88B
        SQL);
        $this->addSql(<<<'SQL'
            ALTER TABLE team_ride RENAME INDEX idx_team_ride_driver_id TO IDX_4ADC88ABC3423909
        SQL);
        $this->addSql(<<<'SQL'
            ALTER TABLE team_ride_passenger RENAME INDEX idx_team_ride_passenger_team_ride_id TO IDX_4B8F53D5CF53FB47
        SQL);
        $this->addSql(<<<'SQL'
            ALTER TABLE team_ride_passenger RENAME INDEX idx_team_ride_passenger_user_id TO IDX_4B8F53D5A76ED395
        SQL);
        $this->addSql(<<<'SQL'
            ALTER TABLE teams RENAME INDEX uniq_teams_fussball_de_id TO UNIQ_96C2225867A1B74A
        SQL);
        $this->addSql(<<<'SQL'
            ALTER TABLE team_club RENAME INDEX idx_team_club_team_id TO IDX_690FCC09296CD8AE
        SQL);
        $this->addSql(<<<'SQL'
            ALTER TABLE team_club RENAME INDEX idx_team_club_club_id TO IDX_690FCC0961190A32
        SQL);
        $this->addSql(<<<'SQL'
            ALTER TABLE tournament_matches RENAME INDEX idx_tournament_matches_tournament_id TO IDX_6D29EEB033D1A3E7
        SQL);
        $this->addSql(<<<'SQL'
            ALTER TABLE tournament_matches RENAME INDEX idx_tournament_matches_home_team_id TO IDX_6D29EEB09C4C13F6
        SQL);
        $this->addSql(<<<'SQL'
            ALTER TABLE tournament_matches RENAME INDEX idx_tournament_matches_away_team_id TO IDX_6D29EEB045185D02
        SQL);
        $this->addSql(<<<'SQL'
            ALTER TABLE tournament_matches RENAME INDEX uniq_tournament_matches_game_id TO UNIQ_6D29EEB0E48FD905
        SQL);
        $this->addSql(<<<'SQL'
            ALTER TABLE tournament_matches RENAME INDEX idx_tournament_matches_next_match_id TO IDX_6D29EEB012A4E038
        SQL);
        $this->addSql(<<<'SQL'
            ALTER TABLE tournament_matches RENAME INDEX idx_tournament_matches_location_id TO IDX_6D29EEB064D218E
        SQL);
        $this->addSql(<<<'SQL'
            ALTER TABLE tournament_teams RENAME INDEX idx_tournament_teams_tournament_id TO IDX_5794B24133D1A3E7
        SQL);
        $this->addSql(<<<'SQL'
            ALTER TABLE tournament_teams RENAME INDEX idx_tournament_teams_team_id TO IDX_5794B241296CD8AE
        SQL);
        $this->addSql(<<<'SQL'
            ALTER TABLE tournaments RENAME INDEX idx_tournaments_created_by_id TO IDX_E4BCFAC3B03A8386
        SQL);
        $this->addSql(<<<'SQL'
            ALTER TABLE tournaments RENAME INDEX uniq_tournaments_calendar_event_id TO UNIQ_E4BCFAC37495C8E3
        SQL);
        $this->addSql(<<<'SQL'
            ALTER TABLE user_xp_events RENAME INDEX idx_user_xp_events_user_id TO IDX_361A06A0A76ED395
        SQL);
        $this->addSql(<<<'SQL'
            ALTER TABLE users CHANGE notification_preferences notification_preferences JSON DEFAULT NULL COMMENT '(DC2Type:json)'
        SQL);
        $this->addSql(<<<'SQL'
            ALTER TABLE users RENAME INDEX uniq_users_google_id TO UNIQ_1483A5E976F5C865
        SQL);
        $this->addSql(<<<'SQL'
            ALTER TABLE videos RENAME INDEX idx_videos_video_type_id TO IDX_29AA643220A1653E
        SQL);
        $this->addSql(<<<'SQL'
            ALTER TABLE videos RENAME INDEX idx_videos_camera_id TO IDX_29AA6432B47685CD
        SQL);
    }

    public function down(Schema $schema): void
    {
        // this down() migration is auto-generated, please modify it to your needs
        $this->addSql(<<<'SQL'
            ALTER TABLE team_ride_passenger RENAME INDEX idx_4b8f53d5cf53fb47 TO idx_team_ride_passenger_team_ride_id
        SQL);
        $this->addSql(<<<'SQL'
            ALTER TABLE team_ride_passenger RENAME INDEX idx_4b8f53d5a76ed395 TO idx_team_ride_passenger_user_id
        SQL);
        $this->addSql(<<<'SQL'
            ALTER TABLE github_issue_state CHANGE is_read is_read TINYINT(1) DEFAULT 0 NOT NULL
        SQL);
        $this->addSql(<<<'SQL'
            ALTER TABLE survey_option_type RENAME INDEX uniq_dc2822cf88874d48 TO uniq_survey_option_type_type_key
        SQL);
        $this->addSql(<<<'SQL'
            ALTER TABLE notifications RENAME INDEX idx_6000b0d3a76ed395 TO idx_notifications_user_id
        SQL);
        $this->addSql(<<<'SQL'
            ALTER TABLE players RENAME INDEX uniq_264e43a667a1b74a TO uniq_players_fussball_de_id
        SQL);
        $this->addSql(<<<'SQL'
            ALTER TABLE feedback_comment CHANGE is_admin_message is_admin_message TINYINT(1) DEFAULT 0 NOT NULL, CHANGE is_read_by_recipient is_read_by_recipient TINYINT(1) DEFAULT 0 NOT NULL
        SQL);
        $this->addSql(<<<'SQL'
            ALTER TABLE feedback_comment RENAME INDEX idx_52d72cff675f31b TO IDX_FEEDBACK_COMMENT_AUTHOR
        SQL);
        $this->addSql(<<<'SQL'
            ALTER TABLE videos RENAME INDEX idx_29aa643220a1653e TO idx_videos_video_type_id
        SQL);
        $this->addSql(<<<'SQL'
            ALTER TABLE videos RENAME INDEX idx_29aa6432b47685cd TO idx_videos_camera_id
        SQL);
        $this->addSql(<<<'SQL'
            ALTER TABLE users CHANGE notification_preferences notification_preferences JSON DEFAULT NULL COMMENT 'Per-category push notification preferences(DC2Type:json)'
        SQL);
        $this->addSql(<<<'SQL'
            ALTER TABLE users RENAME INDEX uniq_1483a5e976f5c865 TO uniq_users_google_id
        SQL);
        $this->addSql(<<<'SQL'
            ALTER TABLE survey_option RENAME INDEX idx_7288c8dcb03a8386 TO idx_survey_option_created_by_id
        SQL);
        $this->addSql(<<<'SQL'
            ALTER TABLE tournaments RENAME INDEX idx_e4bcfac3b03a8386 TO idx_tournaments_created_by_id
        SQL);
        $this->addSql(<<<'SQL'
            ALTER TABLE tournaments RENAME INDEX uniq_e4bcfac37495c8e3 TO uniq_tournaments_calendar_event_id
        SQL);
        $this->addSql(<<<'SQL'
            ALTER TABLE player_alternative_positions RENAME INDEX idx_47210a0299e6f5df TO idx_player_alternative_positions_player_id
        SQL);
        $this->addSql(<<<'SQL'
            ALTER TABLE player_alternative_positions RENAME INDEX idx_47210a02dd842e46 TO idx_player_alternative_positions_position_id
        SQL);
        $this->addSql(<<<'SQL'
            ALTER TABLE password_reset_tokens RENAME INDEX uniq_3967a2165f37a13b TO uniq_password_reset_tokens_token
        SQL);
        $this->addSql(<<<'SQL'
            ALTER TABLE password_reset_tokens RENAME INDEX idx_3967a216a76ed395 TO idx_password_reset_tokens_user_id
        SQL);
        $this->addSql(<<<'SQL'
            ALTER TABLE message_recipients RENAME INDEX idx_dbb61e5ba76ed395 TO idx_message_recipients_user_id
        SQL);
        $this->addSql(<<<'SQL'
            ALTER TABLE message_recipients RENAME INDEX idx_dbb61e5b537a1329 TO idx_message_recipients_message_id
        SQL);
        $this->addSql(<<<'SQL'
            ALTER TABLE task_rotation_users RENAME INDEX idx_ab5ffbfc8db60186 TO idx_task_rotation_users_task_id
        SQL);
        $this->addSql(<<<'SQL'
            ALTER TABLE task_rotation_users RENAME INDEX idx_ab5ffbfca76ed395 TO idx_task_rotation_users_user_id
        SQL);
        $this->addSql(<<<'SQL'
            ALTER TABLE game_events RENAME INDEX idx_2eb2fa82296cd8ae TO idx_game_events_team_id
        SQL);
        $this->addSql(<<<'SQL'
            ALTER TABLE game_events RENAME INDEX idx_2eb2fa82e48fd905 TO idx_game_events_game_id
        SQL);
        $this->addSql(<<<'SQL'
            ALTER TABLE game_events RENAME INDEX idx_2eb2fa823127a9c4 TO idx_game_events_related_player_id
        SQL);
        $this->addSql(<<<'SQL'
            ALTER TABLE game_events RENAME INDEX idx_2eb2fa82eaffb957 TO idx_game_events_game_event_type_id
        SQL);
        $this->addSql(<<<'SQL'
            ALTER TABLE game_events RENAME INDEX idx_2eb2fa82dab8ce79 TO idx_game_events_substitution_reason_id
        SQL);
        $this->addSql(<<<'SQL'
            ALTER TABLE game_events RENAME INDEX idx_2eb2fa8299e6f5df TO idx_game_events_player_id
        SQL);
        $this->addSql(<<<'SQL'
            ALTER TABLE user_xp_events RENAME INDEX idx_361a06a0a76ed395 TO idx_user_xp_events_user_id
        SQL);
        $this->addSql(<<<'SQL'
            ALTER TABLE participation_statuses RENAME INDEX uniq_a7d8928677153098 TO uniq_participation_statuses_code
        SQL);
        $this->addSql(<<<'SQL'
            ALTER TABLE team_club RENAME INDEX idx_690fcc09296cd8ae TO idx_team_club_team_id
        SQL);
        $this->addSql(<<<'SQL'
            ALTER TABLE team_club RENAME INDEX idx_690fcc0961190a32 TO idx_team_club_club_id
        SQL);
        $this->addSql(<<<'SQL'
            ALTER TABLE survey_option_survey_question RENAME INDEX idx_852a61872925f42 TO idx_survey_option_survey_question_survey_option_id
        SQL);
        $this->addSql(<<<'SQL'
            ALTER TABLE survey_option_survey_question RENAME INDEX idx_852a6187a6df29ba TO idx_survey_option_survey_question_survey_question_id
        SQL);
        $this->addSql(<<<'SQL'
            ALTER TABLE message_group_members RENAME INDEX idx_8a0dc08bf7721d56 TO idx_message_group_members_message_group_id
        SQL);
        $this->addSql(<<<'SQL'
            ALTER TABLE message_group_members RENAME INDEX idx_8a0dc08ba76ed395 TO idx_message_group_members_user_id
        SQL);
        $this->addSql(<<<'SQL'
            ALTER TABLE tournament_teams RENAME INDEX idx_5794b24133d1a3e7 TO idx_tournament_teams_tournament_id
        SQL);
        $this->addSql(<<<'SQL'
            ALTER TABLE tournament_teams RENAME INDEX idx_5794b241296cd8ae TO idx_tournament_teams_team_id
        SQL);
        $this->addSql(<<<'SQL'
            ALTER TABLE player_game_stats RENAME INDEX idx_3ad19a18e48fd905 TO idx_player_game_stats_game_id
        SQL);
        $this->addSql(<<<'SQL'
            ALTER TABLE player_game_stats RENAME INDEX idx_3ad19a1899e6f5df TO idx_player_game_stats_player_id
        SQL);
        $this->addSql(<<<'SQL'
            ALTER TABLE player_team_assignments RENAME INDEX idx_3a6d3d0b296cd8ae TO idx_player_team_assignments_team_id
        SQL);
        $this->addSql(<<<'SQL'
            ALTER TABLE player_team_assignments RENAME INDEX idx_3a6d3d0b99e6f5df TO idx_player_team_assignments_player_id
        SQL);
        $this->addSql(<<<'SQL'
            ALTER TABLE player_team_assignments RENAME INDEX idx_3a6d3d0b2f42103a TO idx_player_team_assignments_player_team_assignment_type_id
        SQL);
        $this->addSql(<<<'SQL'
            ALTER TABLE survey_team RENAME INDEX idx_209a6d4b3fe509d TO idx_survey_team_survey_id
        SQL);
        $this->addSql(<<<'SQL'
            ALTER TABLE survey_team RENAME INDEX idx_209a6d4296cd8ae TO idx_survey_team_team_id
        SQL);
        $this->addSql(<<<'SQL'
            ALTER TABLE survey_response RENAME INDEX idx_628c4ddcb3fe509d TO idx_survey_response_survey_id
        SQL);
        $this->addSql(<<<'SQL'
            ALTER TABLE clubs RENAME INDEX uniq_a5bd312367a1b74a TO uniq_clubs_fussball_de_id
        SQL);
        $this->addSql(<<<'SQL'
            ALTER TABLE camera RENAME INDEX idx_3b1cee053ea4cb4d TO idx_camera_created_from_id
        SQL);
        $this->addSql(<<<'SQL'
            ALTER TABLE camera RENAME INDEX idx_3b1cee0564c49dd8 TO idx_camera_updated_from_id
        SQL);
        $this->addSql(<<<'SQL'
            ALTER TABLE games RENAME INDEX uniq_ff232b3167a1b74a TO uniq_games_fussball_de_id
        SQL);
        $this->addSql(<<<'SQL'
            ALTER TABLE games RENAME INDEX idx_ff232b3158afc4de TO idx_games_league_id
        SQL);
        $this->addSql(<<<'SQL'
            ALTER TABLE team_game_stats RENAME INDEX idx_5bad6ce0e48fd905 TO idx_team_game_stats_game_id
        SQL);
        $this->addSql(<<<'SQL'
            ALTER TABLE team_game_stats RENAME INDEX idx_5bad6ce0296cd8ae TO idx_team_game_stats_team_id
        SQL);
        $this->addSql(<<<'SQL'
            ALTER TABLE tasks RENAME INDEX idx_50586597b03a8386 TO idx_tasks_created_by_id
        SQL);
        $this->addSql(<<<'SQL'
            ALTER TABLE dashboard_widgets RENAME INDEX idx_2cbc36eca76ed395 TO idx_dashboard_widgets_user_id
        SQL);
        $this->addSql(<<<'SQL'
            ALTER TABLE dashboard_widgets RENAME INDEX idx_2cbc36ec58c3e861 TO idx_dashboard_widgets_report_definition_id
        SQL);
        $this->addSql(<<<'SQL'
            ALTER TABLE age_groups RENAME INDEX uniq_e994440777153098 TO uniq_age_groups_code
        SQL);
        $this->addSql(<<<'SQL'
            ALTER TABLE survey_question RENAME INDEX idx_ea000f69b3fe509d TO idx_survey_question_survey_id
        SQL);
        $this->addSql(<<<'SQL'
            ALTER TABLE survey_question RENAME INDEX idx_ea000f69c54c8c93 TO idx_survey_question_type_id
        SQL);
        $this->addSql(<<<'SQL'
            ALTER TABLE teams RENAME INDEX uniq_96c2225867a1b74a TO uniq_teams_fussball_de_id
        SQL);
        $this->addSql(<<<'SQL'
            ALTER TABLE survey_club RENAME INDEX idx_7e0738b9b3fe509d TO idx_survey_club_survey_id
        SQL);
        $this->addSql(<<<'SQL'
            ALTER TABLE survey_club RENAME INDEX idx_7e0738b961190a32 TO idx_survey_club_club_id
        SQL);
        $this->addSql(<<<'SQL'
            ALTER TABLE push_subscriptions RENAME INDEX idx_3fec449da76ed395 TO idx_push_subscriptions_user_id
        SQL);
        $this->addSql(<<<'SQL'
            ALTER TABLE task_assignments RENAME INDEX idx_76fffdeff0e118f3 TO idx_task_assignments_substitute_user_id
        SQL);
        $this->addSql(<<<'SQL'
            ALTER TABLE task_assignments RENAME INDEX uniq_76fffdef7495c8e3 TO uniq_task_assignments_calendar_event_id
        SQL);
        $this->addSql(<<<'SQL'
            ALTER TABLE task_assignments RENAME INDEX idx_76fffdef8db60186 TO idx_task_assignments_task_id
        SQL);
        $this->addSql(<<<'SQL'
            ALTER TABLE task_assignments RENAME INDEX idx_76fffdefa76ed395 TO idx_task_assignments_user_id
        SQL);
        $this->addSql(<<<'SQL'
            ALTER TABLE tournament_matches RENAME INDEX idx_6d29eeb045185d02 TO idx_tournament_matches_away_team_id
        SQL);
        $this->addSql(<<<'SQL'
            ALTER TABLE tournament_matches RENAME INDEX idx_6d29eeb033d1a3e7 TO idx_tournament_matches_tournament_id
        SQL);
        $this->addSql(<<<'SQL'
            ALTER TABLE tournament_matches RENAME INDEX idx_6d29eeb064d218e TO idx_tournament_matches_location_id
        SQL);
        $this->addSql(<<<'SQL'
            ALTER TABLE tournament_matches RENAME INDEX idx_6d29eeb012a4e038 TO idx_tournament_matches_next_match_id
        SQL);
        $this->addSql(<<<'SQL'
            ALTER TABLE tournament_matches RENAME INDEX idx_6d29eeb09c4c13f6 TO idx_tournament_matches_home_team_id
        SQL);
        $this->addSql(<<<'SQL'
            ALTER TABLE tournament_matches RENAME INDEX uniq_6d29eeb0e48fd905 TO uniq_tournament_matches_game_id
        SQL);
        $this->addSql(<<<'SQL'
            ALTER TABLE report_definitions RENAME INDEX idx_22760ecaa76ed395 TO idx_report_definitions_user_id
        SQL);
        $this->addSql(<<<'SQL'
            ALTER TABLE team_ride RENAME INDEX idx_4adc88abc3423909 TO idx_team_ride_driver_id
        SQL);
        $this->addSql(<<<'SQL'
            ALTER TABLE team_ride RENAME INDEX idx_4adc88ab71f7e88b TO idx_team_ride_event_id
        SQL);
        $this->addSql(<<<'SQL'
            ALTER TABLE calendar_events RENAME INDEX idx_f9e14f16b03a8386 TO idx_calendar_events_created_by_id
        SQL);
        $this->addSql(<<<'SQL'
            ALTER TABLE calendar_events RENAME INDEX idx_f9e14f16187b2d12 TO idx_calendar_events_cancelled_by_id
        SQL);
        $this->addSql(<<<'SQL'
            ALTER TABLE game_event_types RENAME INDEX uniq_c67e7a1e77153098 TO uniq_game_event_types_code
        SQL);
        $this->addSql(<<<'SQL'
            ALTER TABLE news RENAME INDEX idx_1dd3995061190a32 TO idx_news_club_id
        SQL);
        $this->addSql(<<<'SQL'
            ALTER TABLE news RENAME INDEX idx_1dd39950296cd8ae TO idx_news_team_id
        SQL);
        $this->addSql(<<<'SQL'
            ALTER TABLE news RENAME INDEX idx_1dd39950de12ab56 TO idx_news_created_by
        SQL);
    }

    public function isTransactional(): bool
    {
        return false;
    }
}
