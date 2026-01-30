<?php

declare(strict_types=1);

namespace App\Interfaces\Service;

use App\Entity\Game;

/**
 * Interface for external patchnote sources (Steam News, etc.).
 * Allows polling patchnotes from different sources.
 */
interface PatchnoteSourceInterface
{
    /**
     * Fetch patchnotes for a game from the external source.
     *
     * @return array<int, array<string, mixed>>
     */
    public function fetchPatchnotes(Game $game, ?\DateTimeInterface $since = null): array;

    /**
     * Check if this source can provide patchnotes for a game.
     */
    public function supports(Game $game): bool;

    /**
     * Get the unique identifier for this source.
     */
    public function getSourceIdentifier(): string;
}
