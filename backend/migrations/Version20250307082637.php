<?php

declare(strict_types=1);

namespace DoctrineMigrations;

use Doctrine\DBAL\Schema\Schema;
use Doctrine\Migrations\AbstractMigration;

/**
 * Auto-generated Migration: Please modify to your needs!
 */
final class Version20250307082637 extends AbstractMigration
{
    public function getDescription(): string
    {
        return '';
    }

    public function up(Schema $schema): void
    {
        // this up() migration is auto-generated, please modify it to your needs
        $this->addSql('CREATE TABLE patchnote (id INT AUTO_INCREMENT NOT NULL, created_by_id INT DEFAULT NULL, game_id INT NOT NULL, title VARCHAR(255) DEFAULT NULL, content LONGTEXT DEFAULT NULL, released_at DATETIME DEFAULT NULL COMMENT \'(DC2Type:datetime_immutable)\', created_at DATETIME NOT NULL COMMENT \'(DC2Type:datetime_immutable)\', importance VARCHAR(255) DEFAULT NULL, INDEX IDX_DB17E716B03A8386 (created_by_id), INDEX IDX_DB17E716E48FD905 (game_id), PRIMARY KEY(id)) DEFAULT CHARACTER SET utf8mb4 COLLATE `utf8mb4_unicode_ci` ENGINE = InnoDB');
        $this->addSql('ALTER TABLE patchnote ADD CONSTRAINT FK_DB17E716B03A8386 FOREIGN KEY (created_by_id) REFERENCES user (id)');
        $this->addSql('ALTER TABLE patchnote ADD CONSTRAINT FK_DB17E716E48FD905 FOREIGN KEY (game_id) REFERENCES game (id)');
    }

    public function down(Schema $schema): void
    {
        // this down() migration is auto-generated, please modify it to your needs
        $this->addSql('ALTER TABLE patchnote DROP FOREIGN KEY FK_DB17E716B03A8386');
        $this->addSql('ALTER TABLE patchnote DROP FOREIGN KEY FK_DB17E716E48FD905');
        $this->addSql('DROP TABLE patchnote');
    }
}
