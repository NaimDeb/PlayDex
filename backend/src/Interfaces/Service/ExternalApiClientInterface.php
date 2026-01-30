<?php

declare(strict_types=1);

namespace App\Interfaces\Service;

/**
 * Interface for external API clients.
 * Abstracts HTTP communication with external services.
 */
interface ExternalApiClientInterface
{
    /**
     * Make a GET request to the API.
     *
     * @param array<string, mixed> $query
     * @param array<string, string> $headers
     * @return array<string, mixed>
     */
    public function get(string $endpoint, array $query = [], array $headers = []): array;

    /**
     * Make a POST request to the API.
     *
     * @param array<string, mixed>|string $body
     * @param array<string, string> $headers
     * @return array<string, mixed>
     */
    public function post(string $endpoint, array|string $body = [], array $headers = []): array;

    /**
     * Get the base URL of the API.
     */
    public function getBaseUrl(): string;

    /**
     * Check if the API is available.
     */
    public function isAvailable(): bool;
}
