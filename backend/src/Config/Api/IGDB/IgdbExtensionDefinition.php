<?php

namespace App\Config\Api\IGDB;

use App\Config\Api\DataImportDefinition;
use Symfony\Component\Console\Input\InputOption;

/**
 * Defines the import configuration for IGDB Extensions/DLCs
 */
class IgdbExtensionDefinition extends DataImportDefinition
{
    public function getKey(): string
    {
        return 'igdb_extensions';
    }

    public function getName(): string
    {
        return 'IGDB Extensions/DLCs';
    }

    public function getDescription(): string
    {
        return 'Fetches game extensions and DLCs from IGDB and stores them in the database. Memory intensive - use --no-debug flag.';
    }

    public function getDataFetcherServiceId(): string
    {
        return 'app.api.igdb.extension_fetcher';
    }

    public function getDataProcessorServiceId(): string
    {
        return 'app.processor.igdb_data_processor';
    }

    public function getDataStorageServiceId(): string
    {
        return 'app.storage.igdb_extension_storage';
    }

    public function getConsoleOptions(): array
    {
        return [
            'offset' => [
                'shortcut' => null,
                'mode' => InputOption::VALUE_OPTIONAL,
                'description' => 'Offset for fetching extensions',
                'default' => 0,
            ],
            'fetchSize' => [
                'shortcut' => null,
                'mode' => InputOption::VALUE_OPTIONAL,
                'description' => 'Number of extensions to fetch per request, maximum is 500',
                'default' => null, // Will use ApiConfig::IGDB_BATCH_SIZE
            ],
        ];
    }
}
