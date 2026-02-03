<?php

namespace App\Config\Api;

/**
 * Defines what data types are available for import from a specific API provider.
 * This makes it easy to add or remove data types without modifying command code.
 */
abstract class DataImportDefinition
{
    /**
     * Get the unique identifier for this data type
     */
    abstract public function getKey(): string;

    /**
     * Get the human-readable name for this data type
     */
    abstract public function getName(): string;

    /**
     * Get the description of what this data type imports
     */
    abstract public function getDescription(): string;

    /**
     * Get the service ID for the data fetcher (from service container)
     */
    abstract public function getDataFetcherServiceId(): string;

    /**
     * Get the service ID for the data processor (from service container)
     */
    abstract public function getDataProcessorServiceId(): string;

    /**
     * Get the service ID for the data storage handler (from service container)
     */
    abstract public function getDataStorageServiceId(): string;

    /**
     * Get console command options specific to this data type
     * Return empty array if no special options needed
     * 
     * @return array ['optionName' => ['type' => InputOption::VALUE_*, 'description' => '...']]
     */
    public function getConsoleOptions(): array
    {
        return [];
    }
}
