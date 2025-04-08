<?php

declare(strict_types=1);

namespace DoctrineMigrations;

use Doctrine\DBAL\Schema\Schema;
use Doctrine\Migrations\AbstractMigration;

/**
 * Auto-generated Migration: Please modify to your needs!
 */
final class Version20250408141601 extends AbstractMigration
{
    public function getDescription(): string
    {
        return '';
    }

    public function up(Schema $schema): void
    {
        // this up() migration is auto-generated, please modify it to your needs
        $this->addSql('ALTER TABLE modification ADD is_deleted TINYINT(1) NOT NULL');
        $this->addSql('ALTER TABLE patchnote ADD is_deleted TINYINT(1) NOT NULL');
        $this->addSql('ALTER TABLE report ADD is_deleted TINYINT(1) NOT NULL');
    }

    public function down(Schema $schema): void
    {
        // this down() migration is auto-generated, please modify it to your needs
        $this->addSql('ALTER TABLE report DROP is_deleted');
        $this->addSql('ALTER TABLE patchnote DROP is_deleted');
        $this->addSql('ALTER TABLE modification DROP is_deleted');
    }
}
