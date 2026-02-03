<?php

namespace App\Interfaces\Api;

/**
 * Contract for fetching data from external APIs.
 * Allows different API implementations to be used interchangeably.
 * Feacher
 */
interface DataFetcherInterface
{
    /**
     * Get the total count of items from the API
     */
    public function getCount(?int $from = null): int;

    /**
     * Fetch a batch of items from the API
     * 
     * @return array The fetched items
     */
    public function fetchBatch(int $limit, int $offset = 0, ?int $from = null): array;

    /**
     * Get the name of the data source
     */
    public function getSourceName(): string;

    /**
     * Get the API provider name (e.g., 'IGDB')
     */
    public function getProviderName(): string;
}
