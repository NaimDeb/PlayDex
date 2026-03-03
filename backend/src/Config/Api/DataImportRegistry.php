<?php

namespace App\Config\Api;

use Symfony\Component\Console\Input\InputOption;

/**
 * Registry of all available data types for a specific API provider.
 * Allows dynamic management of what data can be imported.
 */
class DataImportRegistry
{
    /**
     * @var DataImportDefinition[]
     */
    private array $definitions = [];

    /**
     * @var string The API provider this registry is for (e.g., 'IGDB')
     */
    private string $providerName;

    public function __construct(string $providerName)
    {
        $this->providerName = $providerName;
    }

    /**
     * Register a data type for import
     */
    public function register(DataImportDefinition $definition): self
    {
        $this->definitions[$definition->getKey()] = $definition;
        return $this;
    }

    /**
     * Unregister a data type
     */
    public function unregister(string $key): self
    {
        unset($this->definitions[$key]);
        return $this;
    }

    /**
     * Get a specific data type definition
     */
    public function get(string $key): ?DataImportDefinition
    {
        return $this->definitions[$key] ?? null;
    }

    /**
     * Get all registered data type definitions
     * 
     * @return DataImportDefinition[]
     */
    public function all(): array
    {
        return $this->definitions;
    }

    /**
     * Get all keys in registration order
     * 
     * @return string[]
     */
    public function getKeys(): array
    {
        return array_keys($this->definitions);
    }

    /**
     * Check if a data type is registered
     */
    public function has(string $key): bool
    {
        return isset($this->definitions[$key]);
    }

    /**
     * Get the provider name
     */
    public function getProviderName(): string
    {
        return $this->providerName;
    }

    /**
     * Get the total number of registered data types
     */
    public function count(): int
    {
        return count($this->definitions);
    }
}
