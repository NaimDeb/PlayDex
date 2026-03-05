<?php

declare(strict_types=1);

namespace DoctrineMigrations;

use Doctrine\DBAL\Schema\Schema;
use Doctrine\Migrations\AbstractMigration;

/**
 * Auto-generated Migration: Please modify to your needs!
 */
final class Version20260305121117 extends AbstractMigration
{
    public function getDescription(): string
    {
        return '';
    }

    public function up(Schema $schema): void
    {
        // this up() migration is auto-generated, please modify it to your needs
        $this->addSql('CREATE UNIQUE INDEX user_game_unique ON followed_games (user_id, game_id)');
        $this->addSql('DROP INDEX game_id ON genre_game');
        $this->addSql('ALTER TABLE patchnote RENAME INDEX uniq_patchnote_external_id TO UNIQ_DB17E7169F75D7B0');
        $this->addSql('ALTER TABLE user DROP previous_login_at, CHANGE reputation reputation BIGINT DEFAULT 0 NOT NULL');
    }

    public function down(Schema $schema): void
    {
        // this down() migration is auto-generated, please modify it to your needs
        $this->addSql('DROP INDEX user_game_unique ON followed_games');
        $this->addSql('ALTER TABLE user ADD previous_login_at DATETIME DEFAULT NULL COMMENT \'(DC2Type:datetime_immutable)\', CHANGE reputation reputation BIGINT NOT NULL');
        $this->addSql('ALTER TABLE patchnote RENAME INDEX uniq_db17e7169f75d7b0 TO UNIQ_PATCHNOTE_EXTERNAL_ID');
        $this->addSql('CREATE INDEX game_id ON genre_game (game_id)');
    }
}
