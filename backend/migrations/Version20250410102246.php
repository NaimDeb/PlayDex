<?php

declare(strict_types=1);

namespace DoctrineMigrations;

use Doctrine\DBAL\Schema\Schema;
use Doctrine\Migrations\AbstractMigration;

/**
 * Auto-generated Migration: Please modify to your needs!
 */
final class Version20250410102246 extends AbstractMigration
{
    public function getDescription(): string
    {
        return '';
    }

    public function up(Schema $schema): void
    {
        // this up() migration is auto-generated, please modify it to your needs
        $this->addSql('ALTER TABLE followed_games_user DROP FOREIGN KEY FK_7EC9AFADA76ED395');
        $this->addSql('ALTER TABLE followed_games_user DROP FOREIGN KEY FK_7EC9AFADD49E67D8');
        $this->addSql('DROP TABLE followed_games_user');
        $this->addSql('ALTER TABLE user ADD followed_games_id INT DEFAULT NULL');
        $this->addSql('ALTER TABLE user ADD CONSTRAINT FK_8D93D649D49E67D8 FOREIGN KEY (followed_games_id) REFERENCES followed_games (id)');
        $this->addSql('CREATE INDEX IDX_8D93D649D49E67D8 ON user (followed_games_id)');
    }

    public function down(Schema $schema): void
    {
        // this down() migration is auto-generated, please modify it to your needs
        $this->addSql('CREATE TABLE followed_games_user (followed_games_id INT NOT NULL, user_id INT NOT NULL, INDEX IDX_7EC9AFADD49E67D8 (followed_games_id), INDEX IDX_7EC9AFADA76ED395 (user_id), PRIMARY KEY(followed_games_id, user_id)) DEFAULT CHARACTER SET utf8mb4 COLLATE `utf8mb4_unicode_ci` ENGINE = InnoDB COMMENT = \'\' ');
        $this->addSql('ALTER TABLE followed_games_user ADD CONSTRAINT FK_7EC9AFADA76ED395 FOREIGN KEY (user_id) REFERENCES user (id) ON UPDATE NO ACTION ON DELETE CASCADE');
        $this->addSql('ALTER TABLE followed_games_user ADD CONSTRAINT FK_7EC9AFADD49E67D8 FOREIGN KEY (followed_games_id) REFERENCES followed_games (id) ON UPDATE NO ACTION ON DELETE CASCADE');
        $this->addSql('ALTER TABLE user DROP FOREIGN KEY FK_8D93D649D49E67D8');
        $this->addSql('DROP INDEX IDX_8D93D649D49E67D8 ON user');
        $this->addSql('ALTER TABLE user DROP followed_games_id');
    }
}
