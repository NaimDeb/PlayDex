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
        return 'app.api.igdb.genre_fetcher';
    }

    public function getDataProcessorServiceId(): string
    {
        return 'app.processor.igdb_data_processor';
    }

    public function getDataStorageServiceId(): string
    {
        return 'app.storage.igdb_genre_storage';
    }
}
