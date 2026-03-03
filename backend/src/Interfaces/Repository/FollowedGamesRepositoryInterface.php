<?php

declare(strict_types=1);

namespace App\Interfaces\Repository;

use App\Entity\FollowedGames;
use App\Entity\Game;
use App\Entity\User;

/**
 * Interface for FollowedGames repository.
 * Defines business-specific query methods for followed games.
 */
interface FollowedGamesRepositoryInterface
{
    /**
     * Find all games followed by a user.
     *
     * @return FollowedGames[]
     */
    public function findByUser(User $user): array;

    /**
     * Find all users following a game.
     *
     * @return FollowedGames[]
     */
    public function findByGame(Game $game): array;

    /**
     * Check if a user is following a game.
     */
    public function isFollowing(User $user, Game $game): bool;

    /**
     * Find the follow relationship between a user and a game.
     */
    public function findByUserAndGame(User $user, Game $game): ?FollowedGames;

    /**
     * Count followers for a game.
     */
    public function countFollowers(Game $game): int;

    /**
     * Count games followed by a user.
     */
    public function countFollowedByUser(User $user): int;
}
