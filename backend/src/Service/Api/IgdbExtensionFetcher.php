<?php

namespace App\Service\Api;

use App\Interfaces\Api\DataFetcherInterface;
use App\Service\ExternalApiService;

/**
 * Fetches game extensions and DLCs from IGDB API
 */
class IgdbExtensionFetcher implements DataFetcherInterface
{
    private ExternalApiService $externalApiService;

    public function __construct(ExternalApiService $externalApiService)
    {
        $this->externalApiService = $externalApiService;
    }

    public function getCount(?int $from = null): int
    {
        return $this->externalApiService->getNumberOfIgdbExtensions($from);
    }

    public function fetchBatch(int $limit, int $offset = 0, ?int $from = null): array
    {
        return $this->externalApiService->getIgdbExtensions($limit, $offset, $from);
    }

    public function getSourceName(): string
    {
        return 'extensions';
    }

    public function getProviderName(): string
    {
        return 'IGDB';
    }
}
