<?php

namespace App\Config\Api\IGDB;

use App\Config\Api\DataImportDefinition;

/**
 * Defines the import configuration for IGDB Genres
 */
class IgdbGenreDefinition extends DataImportDefinition
{
    public function getKey(): string
    {
        return 'igdb_genres';
    }

    public function getName(): string
    {
        return 'IGDB Genres';
    }

    public function getDescription(): string
    {
        return 'Fetches game genres from IGDB and stores them in the database.';
    }

    public function getDataFetcherServiceId(): string
    {
        return 'App\Service\Api\IgdbGenreFetcher';
    }

    public function getDataProcessorServiceId(): string
    {
        return 'App\Service\Processor\IgdbDataProcessor';
    }

    public function getDataStorageServiceId(): string
    {
        return 'App\Service\Storage\IgdbGenreStorage';
    }
}
