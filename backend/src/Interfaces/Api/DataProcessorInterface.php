<?php

namespace App\Interfaces\Api;

/**
 * Contract for processing data fetched from external APIs.
 * Handles data transformation and validation.
 */
interface DataProcessorInterface
{
    /**
     * Process a batch of fetched data
     * 
     * @param array $data The raw data from the API
     * @return array The processed data ready for database insertion
     */
    public function processBatch(array $data): array;

    /**
     * Get the name of the entity being processed
     */
    public function getEntityName(): string;
}
