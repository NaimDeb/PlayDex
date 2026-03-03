<?php

namespace App\Service\Api;

use App\Interfaces\Api\DataFetcherInterface;
use App\Service\ExternalApiService;

/**
 * Fetches games from IGDB API
 */
class IgdbGameFetcher implements DataFetcherInterface
{
    private ExternalApiService $externalApiService;

    public function __construct(ExternalApiService $externalApiService)
    {
        $this->externalApiService = $externalApiService;
    }

    public function getCount(?int $from = null): int
    {
        return $this->externalApiService->getNumberOfIgdbGames($from);
    }

    public function fetchBatch(int $limit, int $offset = 0, ?int $from = null): array
    {
        return $this->externalApiService->getIgdbGames($limit, $offset, $from);
    }

    public function getSourceName(): string
    {
        return 'games';
    }

    public function getProviderName(): string
    {
        return 'IGDB';
    }
}
