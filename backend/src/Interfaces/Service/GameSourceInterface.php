<?php

declare(strict_types=1);

namespace App\Interfaces\Service;

/**
 * Interface for external game data sources (IGDB, Steam, etc.).
 * Implements the Adapter pattern for different game APIs.
 */
interface GameSourceInterface
{
    /**
     * Fetch multiple games from the source.
     *
     * @return array<int, array<string, mixed>>
     */
    public function fetchGames(int $limit, int $offset): array;

    /**
     * Fetch a single game by its external ID.
     *
     * @return array<string, mixed>|null
     */
    public function fetchGame(string $externalId): ?array;

    /**
     * Get the total count of games available.
     */
    public function getCount(?string $from = null): int;

    /**
     * Get the unique identifier for this source.
     */
    public function getSourceName(): string;

    /**
     * Check if this source supports a specific feature.
     */
    public function supports(string $feature): bool;
}
