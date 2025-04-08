<?php

declare(strict_types=1);

namespace DoctrineMigrations;

use Doctrine\DBAL\Schema\Schema;
use Doctrine\Migrations\AbstractMigration;

/**
 * Auto-generated Migration: Please modify to your needs!
 */
final class Version20250307104653 extends AbstractMigration
{
    public function getDescription(): string
    {
        return '';
    }

    public function up(Schema $schema): void
    {
        // this up() migration is auto-generated, please modify it to your needs
        $this->addSql('CREATE TABLE company (id INT AUTO_INCREMENT NOT NULL, name VARCHAR(255) NOT NULL, PRIMARY KEY(id)) DEFAULT CHARACTER SET utf8mb4 COLLATE `utf8mb4_unicode_ci` ENGINE = InnoDB');
        $this->addSql('CREATE TABLE company_game (company_id INT NOT NULL, game_id INT NOT NULL, INDEX IDX_60462B62979B1AD6 (company_id), INDEX IDX_60462B62E48FD905 (game_id), PRIMARY KEY(company_id, game_id)) DEFAULT CHARACTER SET utf8mb4 COLLATE `utf8mb4_unicode_ci` ENGINE = InnoDB');
        $this->addSql('CREATE TABLE followed_games (id INT AUTO_INCREMENT NOT NULL, PRIMARY KEY(id)) DEFAULT CHARACTER SET utf8mb4 COLLATE `utf8mb4_unicode_ci` ENGINE = InnoDB');
        $this->addSql('CREATE TABLE followed_games_game (followed_games_id INT NOT NULL, game_id INT NOT NULL, INDEX IDX_D0714868D49E67D8 (followed_games_id), INDEX IDX_D0714868E48FD905 (game_id), PRIMARY KEY(followed_games_id, game_id)) DEFAULT CHARACTER SET utf8mb4 COLLATE `utf8mb4_unicode_ci` ENGINE = InnoDB');
        $this->addSql('CREATE TABLE followed_games_user (followed_games_id INT NOT NULL, user_id INT NOT NULL, INDEX IDX_7EC9AFADD49E67D8 (followed_games_id), INDEX IDX_7EC9AFADA76ED395 (user_id), PRIMARY KEY(followed_games_id, user_id)) DEFAULT CHARACTER SET utf8mb4 COLLATE `utf8mb4_unicode_ci` ENGINE = InnoDB');
        $this->addSql('CREATE TABLE genre (id INT AUTO_INCREMENT NOT NULL, api_id INT NOT NULL, name VARCHAR(255) NOT NULL, PRIMARY KEY(id)) DEFAULT CHARACTER SET utf8mb4 COLLATE `utf8mb4_unicode_ci` ENGINE = InnoDB');
        $this->addSql('CREATE TABLE genre_game (genre_id INT NOT NULL, game_id INT NOT NULL, INDEX IDX_98C6E87C4296D31F (genre_id), INDEX IDX_98C6E87CE48FD905 (game_id), PRIMARY KEY(genre_id, game_id)) DEFAULT CHARACTER SET utf8mb4 COLLATE `utf8mb4_unicode_ci` ENGINE = InnoDB');
        $this->addSql('CREATE TABLE link (id INT AUTO_INCREMENT NOT NULL, game_id INT NOT NULL, url VARCHAR(255) NOT NULL, INDEX IDX_36AC99F1E48FD905 (game_id), PRIMARY KEY(id)) DEFAULT CHARACTER SET utf8mb4 COLLATE `utf8mb4_unicode_ci` ENGINE = InnoDB');
        $this->addSql('CREATE TABLE modification (id INT AUTO_INCREMENT NOT NULL, user_id INT NOT NULL, difference LONGTEXT NOT NULL, created_at DATETIME NOT NULL COMMENT \'(DC2Type:datetime_immutable)\', INDEX IDX_EF6425D2A76ED395 (user_id), PRIMARY KEY(id)) DEFAULT CHARACTER SET utf8mb4 COLLATE `utf8mb4_unicode_ci` ENGINE = InnoDB');
        $this->addSql('CREATE TABLE report (id INT AUTO_INCREMENT NOT NULL, reported_by_id INT NOT NULL, reason LONGTEXT NOT NULL, reported_at DATETIME NOT NULL COMMENT \'(DC2Type:datetime_immutable)\', reportable_id INT NOT NULL, reportable_entity VARCHAR(255) NOT NULL, INDEX IDX_C42F778471CE806 (reported_by_id), PRIMARY KEY(id)) DEFAULT CHARACTER SET utf8mb4 COLLATE `utf8mb4_unicode_ci` ENGINE = InnoDB');
        $this->addSql('CREATE TABLE status (id INT AUTO_INCREMENT NOT NULL, api_id INT NOT NULL, name VARCHAR(255) NOT NULL, PRIMARY KEY(id)) DEFAULT CHARACTER SET utf8mb4 COLLATE `utf8mb4_unicode_ci` ENGINE = InnoDB');
        $this->addSql('CREATE TABLE update_history (id INT AUTO_INCREMENT NOT NULL, updated_at DATETIME NOT NULL COMMENT \'(DC2Type:datetime_immutable)\', PRIMARY KEY(id)) DEFAULT CHARACTER SET utf8mb4 COLLATE `utf8mb4_unicode_ci` ENGINE = InnoDB');
        $this->addSql('ALTER TABLE company_game ADD CONSTRAINT FK_60462B62979B1AD6 FOREIGN KEY (company_id) REFERENCES company (id) ON DELETE CASCADE');
        $this->addSql('ALTER TABLE company_game ADD CONSTRAINT FK_60462B62E48FD905 FOREIGN KEY (game_id) REFERENCES game (id) ON DELETE CASCADE');
        $this->addSql('ALTER TABLE followed_games_game ADD CONSTRAINT FK_D0714868D49E67D8 FOREIGN KEY (followed_games_id) REFERENCES followed_games (id) ON DELETE CASCADE');
        $this->addSql('ALTER TABLE followed_games_game ADD CONSTRAINT FK_D0714868E48FD905 FOREIGN KEY (game_id) REFERENCES game (id) ON DELETE CASCADE');
        $this->addSql('ALTER TABLE followed_games_user ADD CONSTRAINT FK_7EC9AFADD49E67D8 FOREIGN KEY (followed_games_id) REFERENCES followed_games (id) ON DELETE CASCADE');
        $this->addSql('ALTER TABLE followed_games_user ADD CONSTRAINT FK_7EC9AFADA76ED395 FOREIGN KEY (user_id) REFERENCES user (id) ON DELETE CASCADE');
        $this->addSql('ALTER TABLE genre_game ADD CONSTRAINT FK_98C6E87C4296D31F FOREIGN KEY (genre_id) REFERENCES genre (id) ON DELETE CASCADE');
        $this->addSql('ALTER TABLE genre_game ADD CONSTRAINT FK_98C6E87CE48FD905 FOREIGN KEY (game_id) REFERENCES game (id) ON DELETE CASCADE');
        $this->addSql('ALTER TABLE link ADD CONSTRAINT FK_36AC99F1E48FD905 FOREIGN KEY (game_id) REFERENCES game (id)');
        $this->addSql('ALTER TABLE modification ADD CONSTRAINT FK_EF6425D2A76ED395 FOREIGN KEY (user_id) REFERENCES user (id)');
        $this->addSql('ALTER TABLE report ADD CONSTRAINT FK_C42F778471CE806 FOREIGN KEY (reported_by_id) REFERENCES user (id)');
        $this->addSql('ALTER TABLE game ADD status_id INT DEFAULT NULL');
        $this->addSql('ALTER TABLE game ADD CONSTRAINT FK_232B318C6BF700BD FOREIGN KEY (status_id) REFERENCES status (id)');
        $this->addSql('CREATE INDEX IDX_232B318C6BF700BD ON game (status_id)');
        $this->addSql('ALTER TABLE patchnote ADD modification_id INT DEFAULT NULL');
        $this->addSql('ALTER TABLE patchnote ADD CONSTRAINT FK_DB17E7164A605127 FOREIGN KEY (modification_id) REFERENCES modification (id)');
        $this->addSql('CREATE INDEX IDX_DB17E7164A605127 ON patchnote (modification_id)');
    }

    public function down(Schema $schema): void
    {
        // this down() migration is auto-generated, please modify it to your needs
        $this->addSql('ALTER TABLE patchnote DROP FOREIGN KEY FK_DB17E7164A605127');
        $this->addSql('ALTER TABLE game DROP FOREIGN KEY FK_232B318C6BF700BD');
        $this->addSql('ALTER TABLE company_game DROP FOREIGN KEY FK_60462B62979B1AD6');
        $this->addSql('ALTER TABLE company_game DROP FOREIGN KEY FK_60462B62E48FD905');
        $this->addSql('ALTER TABLE followed_games_game DROP FOREIGN KEY FK_D0714868D49E67D8');
        $this->addSql('ALTER TABLE followed_games_game DROP FOREIGN KEY FK_D0714868E48FD905');
        $this->addSql('ALTER TABLE followed_games_user DROP FOREIGN KEY FK_7EC9AFADD49E67D8');
        $this->addSql('ALTER TABLE followed_games_user DROP FOREIGN KEY FK_7EC9AFADA76ED395');
        $this->addSql('ALTER TABLE genre_game DROP FOREIGN KEY FK_98C6E87C4296D31F');
        $this->addSql('ALTER TABLE genre_game DROP FOREIGN KEY FK_98C6E87CE48FD905');
        $this->addSql('ALTER TABLE link DROP FOREIGN KEY FK_36AC99F1E48FD905');
        $this->addSql('ALTER TABLE modification DROP FOREIGN KEY FK_EF6425D2A76ED395');
        $this->addSql('ALTER TABLE report DROP FOREIGN KEY FK_C42F778471CE806');
        $this->addSql('DROP TABLE company');
        $this->addSql('DROP TABLE company_game');
        $this->addSql('DROP TABLE followed_games');
        $this->addSql('DROP TABLE followed_games_game');
        $this->addSql('DROP TABLE followed_games_user');
        $this->addSql('DROP TABLE genre');
        $this->addSql('DROP TABLE genre_game');
        $this->addSql('DROP TABLE link');
        $this->addSql('DROP TABLE modification');
        $this->addSql('DROP TABLE report');
        $this->addSql('DROP TABLE status');
        $this->addSql('DROP TABLE update_history');
        $this->addSql('DROP INDEX IDX_232B318C6BF700BD ON game');
        $this->addSql('ALTER TABLE game DROP status_id');
        $this->addSql('DROP INDEX IDX_DB17E7164A605127 ON patchnote');
        $this->addSql('ALTER TABLE patchnote DROP modification_id');
    }
}
