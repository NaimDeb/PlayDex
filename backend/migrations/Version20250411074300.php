<?php

declare(strict_types=1);

namespace DoctrineMigrations;

use Doctrine\DBAL\Schema\Schema;
use Doctrine\Migrations\AbstractMigration;

/**
 * Auto-generated Migration: Please modify to your needs!
 */
final class Version20250411074300 extends AbstractMigration
{
    public function getDescription(): string
    {
        return '';
    }

    public function up(Schema $schema): void
    {
        // this up() migration is auto-generated, please modify it to your needs
        // $this->addSql('DROP INDEX UNIQ_COMPANY_API_ID ON company');
        // $this->addSql('DROP INDEX UNIQ_GAME_API_ID ON game');
        // $this->addSql('DROP INDEX UNIQ_GENRE_API_ID ON genre');
        // $this->addSql('ALTER TABLE update_history CHANGE updated_at updated_at INT NOT NULL');
    }

    public function down(Schema $schema): void
    {
        // this down() migration is auto-generated, please modify it to your needs
        // $this->addSql('CREATE UNIQUE INDEX UNIQ_COMPANY_API_ID ON company (api_id)');
        // $this->addSql('ALTER TABLE update_history CHANGE updated_at updated_at DATETIME NOT NULL COMMENT \'(DC2Type:datetime_immutable)\'');
        // $this->addSql('CREATE UNIQUE INDEX UNIQ_GAME_API_ID ON game (api_id)');
        // $this->addSql('CREATE UNIQUE INDEX UNIQ_GENRE_API_ID ON genre (api_id)');
    }
}
