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
        return 'App\Service\Api\IgdbCompanyFetcher';
    }

    public function getDataProcessorServiceId(): string
    {
        return 'App\Service\Processor\IgdbDataProcessor';
    }

    public function getDataStorageServiceId(): string
    {
        return 'App\Service\Storage\IgdbCompanyStorage';
    }
}
