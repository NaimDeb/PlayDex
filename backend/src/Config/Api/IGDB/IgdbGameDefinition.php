<?php

namespace App\Config\Api\IGDB;

use App\Config\Api\DataImportDefinition;
use Symfony\Component\Console\Input\InputOption;

/**
 * Defines the import configuration for IGDB Games
 */
class IgdbGameDefinition extends DataImportDefinition
{
    public function getKey(): string
    {
        return 'igdb_games';
    }

    public function getName(): string
    {
        return 'IGDB Games';
    }

    public function getDescription(): string
    {
        return 'Fetches games from IGDB and stores them in the database. Memory intensive - use --no-debug flag.';
    }

    public function getDataFetcherServiceId(): string
    {
        return 'App\Service\Api\IgdbGameFetcher';
    }

    public function getDataProcessorServiceId(): string
    {
        return 'App\Service\Processor\IgdbDataProcessor';
    }

    public function getDataStorageServiceId(): string
    {
        return 'App\Service\Storage\IgdbGameStorage';
    }

    public function getConsoleOptions(): array
    {
        return [
            'offset' => [
                'shortcut' => null,
                'mode' => InputOption::VALUE_OPTIONAL,
                'description' => 'Offset for fetching games',
                'default' => 0,
            ],
            'fetchSize' => [
                'shortcut' => null,
                'mode' => InputOption::VALUE_OPTIONAL,
                'description' => 'Number of games to fetch per request, maximum is 500',
                'default' => null, // Will use ApiConfig::IGDB_BATCH_SIZE
            ],
        ];
    }
}
