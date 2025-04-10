<?php

declare(strict_types=1);

namespace DoctrineMigrations;

use Doctrine\DBAL\Schema\Schema;
use Doctrine\Migrations\AbstractMigration;

/**
 * Auto-generated Migration: Please modify to your needs!
 */
final class Version20250410123034 extends AbstractMigration
{
    public function getDescription(): string
    {
        return '';
    }

    public function up(Schema $schema): void
    {
        // this up() migration is auto-generated, please modify it to your needs
        $this->addSql('CREATE TABLE company (id INT AUTO_INCREMENT NOT NULL, name VARCHAR(255) NOT NULL, api_id INT NOT NULL, PRIMARY KEY(id)) DEFAULT CHARACTER SET utf8mb4 COLLATE `utf8mb4_unicode_ci` ENGINE = InnoDB');
        $this->addSql('CREATE TABLE company_game (company_id INT NOT NULL, game_id INT NOT NULL, INDEX IDX_60462B62979B1AD6 (company_id), INDEX IDX_60462B62E48FD905 (game_id), PRIMARY KEY(company_id, game_id)) DEFAULT CHARACTER SET utf8mb4 COLLATE `utf8mb4_unicode_ci` ENGINE = InnoDB');
        $this->addSql('CREATE TABLE extension (id INT AUTO_INCREMENT NOT NULL, game_id INT NOT NULL, title VARCHAR(255) NOT NULL, description LONGTEXT DEFAULT NULL, released_at DATETIME DEFAULT NULL COMMENT \'(DC2Type:datetime_immutable)\', api_id INT NOT NULL, image_url VARCHAR(255) DEFAULT NULL, last_updated_at DATETIME DEFAULT NULL COMMENT \'(DC2Type:datetime_immutable)\', INDEX IDX_9FB73D77E48FD905 (game_id), PRIMARY KEY(id)) DEFAULT CHARACTER SET utf8mb4 COLLATE `utf8mb4_unicode_ci` ENGINE = InnoDB');
        $this->addSql('CREATE TABLE followed_games (id INT AUTO_INCREMENT NOT NULL, user_id INT NOT NULL, game_id INT NOT NULL, INDEX IDX_6CB4C683A76ED395 (user_id), INDEX IDX_6CB4C683E48FD905 (game_id), PRIMARY KEY(id)) DEFAULT CHARACTER SET utf8mb4 COLLATE `utf8mb4_unicode_ci` ENGINE = InnoDB');
        $this->addSql('CREATE TABLE game (id INT AUTO_INCREMENT NOT NULL, steam_id INT DEFAULT NULL, api_id INT DEFAULT NULL, title VARCHAR(255) DEFAULT NULL, description LONGTEXT DEFAULT NULL, image_url VARCHAR(255) DEFAULT NULL, released_at DATETIME DEFAULT NULL COMMENT \'(DC2Type:datetime_immutable)\', last_updated_at DATETIME DEFAULT NULL COMMENT \'(DC2Type:datetime_immutable)\', PRIMARY KEY(id)) DEFAULT CHARACTER SET utf8mb4 COLLATE `utf8mb4_unicode_ci` ENGINE = InnoDB');
        $this->addSql('CREATE TABLE genre (id INT AUTO_INCREMENT NOT NULL, api_id INT NOT NULL, name VARCHAR(255) NOT NULL, PRIMARY KEY(id)) DEFAULT CHARACTER SET utf8mb4 COLLATE `utf8mb4_unicode_ci` ENGINE = InnoDB');
        $this->addSql('CREATE TABLE genre_game (genre_id INT NOT NULL, game_id INT NOT NULL, INDEX IDX_98C6E87C4296D31F (genre_id), INDEX IDX_98C6E87CE48FD905 (game_id), PRIMARY KEY(genre_id, game_id)) DEFAULT CHARACTER SET utf8mb4 COLLATE `utf8mb4_unicode_ci` ENGINE = InnoDB');
        $this->addSql('CREATE TABLE modification (id INT AUTO_INCREMENT NOT NULL, user_id INT NOT NULL, patchnote_id INT NOT NULL, difference LONGTEXT NOT NULL, created_at DATETIME NOT NULL COMMENT \'(DC2Type:datetime_immutable)\', is_deleted TINYINT(1) NOT NULL, INDEX IDX_EF6425D2A76ED395 (user_id), INDEX IDX_EF6425D2EC06FAC5 (patchnote_id), PRIMARY KEY(id)) DEFAULT CHARACTER SET utf8mb4 COLLATE `utf8mb4_unicode_ci` ENGINE = InnoDB');
        $this->addSql('CREATE TABLE patchnote (id INT AUTO_INCREMENT NOT NULL, created_by_id INT DEFAULT NULL, game_id INT NOT NULL, title VARCHAR(255) DEFAULT NULL, content LONGTEXT DEFAULT NULL, released_at DATETIME DEFAULT NULL COMMENT \'(DC2Type:datetime_immutable)\', created_at DATETIME NOT NULL COMMENT \'(DC2Type:datetime_immutable)\', importance VARCHAR(255) DEFAULT NULL, small_description LONGTEXT DEFAULT NULL, is_deleted TINYINT(1) NOT NULL, INDEX IDX_DB17E716B03A8386 (created_by_id), INDEX IDX_DB17E716E48FD905 (game_id), PRIMARY KEY(id)) DEFAULT CHARACTER SET utf8mb4 COLLATE `utf8mb4_unicode_ci` ENGINE = InnoDB');
        $this->addSql('CREATE TABLE report (id INT AUTO_INCREMENT NOT NULL, reported_by_id INT NOT NULL, reason LONGTEXT NOT NULL, reported_at DATETIME NOT NULL COMMENT \'(DC2Type:datetime_immutable)\', reportable_id INT NOT NULL, reportable_entity VARCHAR(255) NOT NULL, is_deleted TINYINT(1) NOT NULL, INDEX IDX_C42F778471CE806 (reported_by_id), PRIMARY KEY(id)) DEFAULT CHARACTER SET utf8mb4 COLLATE `utf8mb4_unicode_ci` ENGINE = InnoDB');
        $this->addSql('CREATE TABLE update_history (id INT AUTO_INCREMENT NOT NULL, updated_at DATETIME NOT NULL COMMENT \'(DC2Type:datetime_immutable)\', PRIMARY KEY(id)) DEFAULT CHARACTER SET utf8mb4 COLLATE `utf8mb4_unicode_ci` ENGINE = InnoDB');
        $this->addSql('CREATE TABLE user (id INT AUTO_INCREMENT NOT NULL, email VARCHAR(180) NOT NULL, roles JSON NOT NULL, password VARCHAR(255) NOT NULL, username VARCHAR(255) NOT NULL, created_at DATETIME NOT NULL COMMENT \'(DC2Type:datetime_immutable)\', reputation BIGINT NOT NULL, is_deleted TINYINT(1) NOT NULL, UNIQUE INDEX UNIQ_IDENTIFIER_EMAIL (email), PRIMARY KEY(id)) DEFAULT CHARACTER SET utf8mb4 COLLATE `utf8mb4_unicode_ci` ENGINE = InnoDB');
        $this->addSql('ALTER TABLE company_game ADD CONSTRAINT FK_60462B62979B1AD6 FOREIGN KEY (company_id) REFERENCES company (id) ON DELETE CASCADE');
        $this->addSql('ALTER TABLE company_game ADD CONSTRAINT FK_60462B62E48FD905 FOREIGN KEY (game_id) REFERENCES game (id) ON DELETE CASCADE');
        $this->addSql('ALTER TABLE extension ADD CONSTRAINT FK_9FB73D77E48FD905 FOREIGN KEY (game_id) REFERENCES game (id)');
        $this->addSql('ALTER TABLE followed_games ADD CONSTRAINT FK_6CB4C683A76ED395 FOREIGN KEY (user_id) REFERENCES user (id)');
        $this->addSql('ALTER TABLE followed_games ADD CONSTRAINT FK_6CB4C683E48FD905 FOREIGN KEY (game_id) REFERENCES game (id)');
        $this->addSql('ALTER TABLE genre_game ADD CONSTRAINT FK_98C6E87C4296D31F FOREIGN KEY (genre_id) REFERENCES genre (id) ON DELETE CASCADE');
        $this->addSql('ALTER TABLE genre_game ADD CONSTRAINT FK_98C6E87CE48FD905 FOREIGN KEY (game_id) REFERENCES game (id) ON DELETE CASCADE');
        $this->addSql('ALTER TABLE modification ADD CONSTRAINT FK_EF6425D2A76ED395 FOREIGN KEY (user_id) REFERENCES user (id)');
        $this->addSql('ALTER TABLE modification ADD CONSTRAINT FK_EF6425D2EC06FAC5 FOREIGN KEY (patchnote_id) REFERENCES patchnote (id)');
        $this->addSql('ALTER TABLE patchnote ADD CONSTRAINT FK_DB17E716B03A8386 FOREIGN KEY (created_by_id) REFERENCES user (id)');
        $this->addSql('ALTER TABLE patchnote ADD CONSTRAINT FK_DB17E716E48FD905 FOREIGN KEY (game_id) REFERENCES game (id)');
        $this->addSql('ALTER TABLE report ADD CONSTRAINT FK_C42F778471CE806 FOREIGN KEY (reported_by_id) REFERENCES user (id)');
    }

    public function down(Schema $schema): void
    {
        // this down() migration is auto-generated, please modify it to your needs
        $this->addSql('ALTER TABLE company_game DROP FOREIGN KEY FK_60462B62979B1AD6');
        $this->addSql('ALTER TABLE company_game DROP FOREIGN KEY FK_60462B62E48FD905');
        $this->addSql('ALTER TABLE extension DROP FOREIGN KEY FK_9FB73D77E48FD905');
        $this->addSql('ALTER TABLE followed_games DROP FOREIGN KEY FK_6CB4C683A76ED395');
        $this->addSql('ALTER TABLE followed_games DROP FOREIGN KEY FK_6CB4C683E48FD905');
        $this->addSql('ALTER TABLE genre_game DROP FOREIGN KEY FK_98C6E87C4296D31F');
        $this->addSql('ALTER TABLE genre_game DROP FOREIGN KEY FK_98C6E87CE48FD905');
        $this->addSql('ALTER TABLE modification DROP FOREIGN KEY FK_EF6425D2A76ED395');
        $this->addSql('ALTER TABLE modification DROP FOREIGN KEY FK_EF6425D2EC06FAC5');
        $this->addSql('ALTER TABLE patchnote DROP FOREIGN KEY FK_DB17E716B03A8386');
        $this->addSql('ALTER TABLE patchnote DROP FOREIGN KEY FK_DB17E716E48FD905');
        $this->addSql('ALTER TABLE report DROP FOREIGN KEY FK_C42F778471CE806');
        $this->addSql('DROP TABLE company');
        $this->addSql('DROP TABLE company_game');
        $this->addSql('DROP TABLE extension');
        $this->addSql('DROP TABLE followed_games');
        $this->addSql('DROP TABLE game');
        $this->addSql('DROP TABLE genre');
        $this->addSql('DROP TABLE genre_game');
        $this->addSql('DROP TABLE modification');
        $this->addSql('DROP TABLE patchnote');
        $this->addSql('DROP TABLE report');
        $this->addSql('DROP TABLE update_history');
        $this->addSql('DROP TABLE user');
    }
}
