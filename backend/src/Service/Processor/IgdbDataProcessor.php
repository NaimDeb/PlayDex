<?php

namespace App\Service\Processor;

use App\Interfaces\Api\DataProcessorInterface;
use App\Service\IgdbDataProcessorService;

/**
 * Processes IGDB data for genres, companies, games, and extensions
 */
class IgdbDataProcessor implements DataProcessorInterface
{
    private IgdbDataProcessorService $igdbDataProcessorService;

    public function __construct(IgdbDataProcessorService $igdbDataProcessorService)
    {
        $this->igdbDataProcessorService = $igdbDataProcessorService;
    }

    public function processBatch(array $data): array
    {
        // This will be called with already processed data from the existing service
        // The actual processing happens in the storage layer where the existing
        // IgdbDataProcessorService methods are called (processGenres, processCompanies, etc)
        return $data;
    }

    public function getEntityName(): string
    {
        return 'IGDB Data';
    }
}
