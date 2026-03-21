<?php

declare(strict_types=1);

namespace DoctrineMigrations;

use Doctrine\DBAL\Schema\Schema;
use Doctrine\Migrations\AbstractMigration;

final class Version20260307130000 extends AbstractMigration
{
    public function getDescription(): string
    {
        return 'Add feedback_comment table for bidirectional admin/user comment threads on feedback items';
    }

    public function up(Schema $schema): void
    {
        $this->addSql('DROP TABLE IF EXISTS feedback_comment');

        $this->addSql(<<<'SQL'
            CREATE TABLE feedback_comment (
                id INT AUTO_INCREMENT NOT NULL,
                feedback_id INT NOT NULL,
                author_id INT DEFAULT NULL,
                content LONGTEXT NOT NULL,
                is_admin_message TINYINT(1) NOT NULL DEFAULT 0,
                is_read_by_recipient TINYINT(1) NOT NULL DEFAULT 0,
                created_at DATETIME NOT NULL,
                INDEX idx_feedback_comment_feedback_id (feedback_id),
                INDEX IDX_FEEDBACK_COMMENT_AUTHOR (author_id),
                CONSTRAINT FK_feedback_comment_feedback FOREIGN KEY (feedback_id) REFERENCES feedback (id) ON DELETE CASCADE,
                CONSTRAINT FK_feedback_comment_author FOREIGN KEY (author_id) REFERENCES users (id) ON DELETE SET NULL,
                PRIMARY KEY(id)
            ) DEFAULT CHARACTER SET utf8mb4 COLLATE `utf8mb4_unicode_ci` ENGINE = InnoDB
        SQL);
    }

    public function down(Schema $schema): void
    {
        $this->addSql('ALTER TABLE feedback_comment DROP FOREIGN KEY FK_feedback_comment_feedback');
        $this->addSql('ALTER TABLE feedback_comment DROP FOREIGN KEY FK_feedback_comment_author');
        $this->addSql('DROP TABLE feedback_comment');
    }
}
