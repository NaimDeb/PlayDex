<?php

namespace App\Config\Api\IGDB;

use App\Config\Api\DataImportDefinition;

/**
 * Defines the import configuration for IGDB Companies
 */
class IgdbCompanyDefinition extends DataImportDefinition
{
    public function getKey(): string
    {
        return 'igdb_companies';
    }

    public function getName(): string
    {
        return 'IGDB Companies';
    }

    public function getDescription(): string
    {
        return 'Fetches game companies from IGDB and stores them in the database.';
    }

    public function getDataFetcherServiceId(): string
    {
        return 'app.api.igdb.company_fetcher';
    }

    public function getDataProcessorServiceId(): string
    {
        return 'app.processor.igdb_data_processor';
    }

    public function getDataStorageServiceId(): string
    {
        return 'app.storage.igdb_company_storage';
    }
}
