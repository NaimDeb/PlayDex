<?php

declare(strict_types=1);

namespace App\Interfaces\Repository;

use App\Entity\Game;

/**
 * Interface for Game repository.
 * Defines business-specific query methods for games.
 */
interface GameRepositoryInterface
{
    /**
     * Find a game by its API ID (IGDB).
     */
    public function findByApiId(int $apiId): ?Game;

    /**
     * Find a game by its Steam ID.
     */
    public function findBySteamId(int $steamId): ?Game;

    /**
     * Find games by title (partial match).
     *
     * @return Game[]
     */
    public function findByTitle(string $title, int $limit = 10): array;

    /**
     * Find popular/trending games.
     *
     * @return Game[]
     */
    public function findPopular(int $limit = 10): array;

    /**
     * Find games with recent patchnotes.
     *
     * @return Game[]
     */
    public function findWithRecentPatchnotes(\DateTimeInterface $since, int $limit = 10): array;

    /**
     * Get all API IDs currently in database.
     *
     * @return int[]
     */
    public function getAllApiIds(): array;
}
