<?php

declare(strict_types=1);

namespace DoctrineMigrations;

use Doctrine\DBAL\Schema\Schema;
use Doctrine\Migrations\AbstractMigration;

/**
 * Ajoute l'opt-out des emails de notification de patchnotes.
 */
final class Version20260722090000 extends AbstractMigration
{
    public function getDescription(): string
    {
        return 'Added user.email_notifications (opt-out des notifications mail)';
    }

    public function up(Schema $schema): void
    {
        $this->addSql('ALTER TABLE user ADD email_notifications TINYINT(1) DEFAULT 1 NOT NULL');
    }

    public function down(Schema $schema): void
    {
        $this->addSql('ALTER TABLE user DROP email_notifications');
    }
}
