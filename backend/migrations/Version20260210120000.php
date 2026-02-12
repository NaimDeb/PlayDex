<?php

declare(strict_types=1);

namespace DoctrineMigrations;

use Doctrine\DBAL\Schema\Schema;
use Doctrine\Migrations\AbstractMigration;

final class Version20260210120000 extends AbstractMigration
{
    public function getDescription(): string
    {
        return 'Add externalId column to patchnote table for Steam patchnote deduplication';
    }

    public function up(Schema $schema): void
    {
        $this->addSql('ALTER TABLE patchnote ADD external_id VARCHAR(255) DEFAULT NULL');
        $this->addSql('CREATE UNIQUE INDEX UNIQ_PATCHNOTE_EXTERNAL_ID ON patchnote (external_id)');
    }

    public function down(Schema $schema): void
    {
        $this->addSql('DROP INDEX UNIQ_PATCHNOTE_EXTERNAL_ID ON patchnote');
        $this->addSql('ALTER TABLE patchnote DROP external_id');
    }
}
