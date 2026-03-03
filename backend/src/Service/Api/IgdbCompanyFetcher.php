<?php

namespace App\Service\Api;

use App\Interfaces\Api\DataFetcherInterface;
use App\Service\ExternalApiService;

/**
 * Fetches game companies from IGDB API
 */
class IgdbCompanyFetcher implements DataFetcherInterface
{
    private ExternalApiService $externalApiService;

    public function __construct(ExternalApiService $externalApiService)
    {
        $this->externalApiService = $externalApiService;
    }

    public function getCount(?int $from = null): int
    {
        return $this->externalApiService->getNumberOfIgdbCompanies($from);
    }

    public function fetchBatch(int $limit, int $offset = 0, ?int $from = null): array
    {
        return $this->externalApiService->getIgdbCompanies($limit, $offset, $from);
    }

    public function getSourceName(): string
    {
        return 'companies';
    }

    public function getProviderName(): string
    {
        return 'IGDB';
    }
}
