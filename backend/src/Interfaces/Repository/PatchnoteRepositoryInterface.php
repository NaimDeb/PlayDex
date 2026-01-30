<?php

declare(strict_types=1);

namespace App\Interfaces\Repository;

use App\Entity\Game;
use App\Entity\Patchnote;
use App\Entity\User;

/**
 * Interface for Patchnote repository.
 * Defines business-specific query methods for patchnotes.
 */
interface PatchnoteRepositoryInterface
{
    /**
     * Find all active (non-deleted) patchnotes for a game.
     *
     * @return Patchnote[]
     */
    public function findActiveByGame(Game $game): array;

    /**
     * Find all patchnotes created by a user.
     *
     * @return Patchnote[]
     */
    public function findByUser(User $user): array;

    /**
     * Find recent patchnotes for games followed by a user.
     *
     * @return Patchnote[]
     */
    public function findRecentForUser(User $user, \DateTimeInterface $since): array;

    /**
     * Find patchnotes by game ordered by release date.
     *
     * @return Patchnote[]
     */
    public function findByGameOrderedByReleaseDate(Game $game, int $limit = 10): array;

    /**
     * Count patchnotes for a game.
     */
    public function countByGame(Game $game): int;
}
