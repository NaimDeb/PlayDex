<?php

declare(strict_types=1);

namespace DoctrineMigrations;

use Doctrine\DBAL\Schema\Schema;
use Doctrine\Migrations\AbstractMigration;

/**
 * Auto-generated Migration: Please modify to your needs!
 */
final class Version20250620123347 extends AbstractMigration
{
    public function getDescription(): string
    {
        return '';
    }

    public function up(Schema $schema): void
    {
        // this up() migration is auto-generated, please modify it to your needs
        $this->addSql('CREATE TABLE warning (id INT AUTO_INCREMENT NOT NULL, reported_user_id_id INT NOT NULL, warned_by_id INT DEFAULT NULL, reason VARCHAR(255) DEFAULT NULL, INDEX IDX_404E9CC6F687AE13 (reported_user_id_id), INDEX IDX_404E9CC6AAAF436D (warned_by_id), PRIMARY KEY(id)) DEFAULT CHARACTER SET utf8mb4 COLLATE `utf8mb4_unicode_ci` ENGINE = InnoDB');
        $this->addSql('ALTER TABLE warning ADD CONSTRAINT FK_404E9CC6F687AE13 FOREIGN KEY (reported_user_id_id) REFERENCES user (id)');
        $this->addSql('ALTER TABLE warning ADD CONSTRAINT FK_404E9CC6AAAF436D FOREIGN KEY (warned_by_id) REFERENCES user (id)');
    }

    public function down(Schema $schema): void
    {
        // this down() migration is auto-generated, please modify it to your needs
        $this->addSql('ALTER TABLE warning DROP FOREIGN KEY FK_404E9CC6F687AE13');
        $this->addSql('ALTER TABLE warning DROP FOREIGN KEY FK_404E9CC6AAAF436D');
        $this->addSql('DROP TABLE warning');
    }
}
