<?php

declare(strict_types=1);

namespace App\Interfaces\Factory;

use App\Config\PatchNoteImportance;
use App\Entity\Game;
use App\Entity\Patchnote;
use App\Entity\User;

/**
 * Interface for creating Patchnote entities.
 * Encapsulates the creation logic to ensure consistent initialization.
 */
interface PatchnoteFactoryInterface
{
    /**
     * Create a new Patchnote entity with all required fields.
     */
    public function create(
        User $author,
        Game $game,
        string $title,
        string $content,
        \DateTimeImmutable $releasedAt,
        ?string $smallDescription = null,
        ?PatchNoteImportance $importance = null,
    ): Patchnote;

    /**
     * Create a Patchnote from an array of data.
     *
     * @param array<string, mixed> $data
     */
    public function createFromArray(array $data, User $author): Patchnote;
}
