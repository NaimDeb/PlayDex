<?php

namespace App\Service\Api;

use App\Interfaces\Api\DataFetcherInterface;
use App\Service\ExternalApiService;

/**
 * Fetches game genres from IGDB API
 */
class IgdbGenreFetcher implements DataFetcherInterface
{
    private ExternalApiService $externalApiService;

    public function __construct(ExternalApiService $externalApiService)
    {
        $this->externalApiService = $externalApiService;
    }

    public function getCount(?int $from = null): int
    {
        return $this->externalApiService->getNumberOfIgdbGenres($from);
    }

    public function fetchBatch(int $limit, int $offset = 0, ?int $from = null): array
    {
        return $this->externalApiService->getIgdbGenres($limit, $offset, $from);
    }

    public function getSourceName(): string
    {
        return 'genres';
    }

    public function getProviderName(): string
    {
        return 'IGDB';
    }
}
