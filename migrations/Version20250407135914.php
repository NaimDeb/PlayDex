<?php

declare(strict_types=1);

namespace DoctrineMigrations;

use Doctrine\DBAL\Schema\Schema;
use Doctrine\Migrations\AbstractMigration;

/**
 * Auto-generated Migration: Please modify to your needs!
 */
final class Version20250407135914 extends AbstractMigration
{
    public function getDescription(): string
    {
        return '';
    }

    public function up(Schema $schema): void
    {
        // this up() migration is auto-generated, please modify it to your needs
        $this->addSql('ALTER TABLE modification ADD patchnote_id INT NOT NULL');
        $this->addSql('ALTER TABLE modification ADD CONSTRAINT FK_EF6425D2EC06FAC5 FOREIGN KEY (patchnote_id) REFERENCES patchnote (id)');
        $this->addSql('CREATE INDEX IDX_EF6425D2EC06FAC5 ON modification (patchnote_id)');
        $this->addSql('ALTER TABLE patchnote DROP FOREIGN KEY FK_DB17E7164A605127');
        $this->addSql('DROP INDEX IDX_DB17E7164A605127 ON patchnote');
        $this->addSql('ALTER TABLE patchnote DROP modification_id');
    }

    public function down(Schema $schema): void
    {
        // this down() migration is auto-generated, please modify it to your needs
        $this->addSql('ALTER TABLE patchnote ADD modification_id INT DEFAULT NULL');
        $this->addSql('ALTER TABLE patchnote ADD CONSTRAINT FK_DB17E7164A605127 FOREIGN KEY (modification_id) REFERENCES modification (id) ON UPDATE NO ACTION ON DELETE NO ACTION');
        $this->addSql('CREATE INDEX IDX_DB17E7164A605127 ON patchnote (modification_id)');
        $this->addSql('ALTER TABLE modification DROP FOREIGN KEY FK_EF6425D2EC06FAC5');
        $this->addSql('DROP INDEX IDX_EF6425D2EC06FAC5 ON modification');
        $this->addSql('ALTER TABLE modification DROP patchnote_id');
    }
}
