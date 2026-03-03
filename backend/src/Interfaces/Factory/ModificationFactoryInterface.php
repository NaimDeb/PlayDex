<?php

declare(strict_types=1);

namespace App\Interfaces\Factory;

use App\Entity\Modification;
use App\Entity\Patchnote;
use App\Entity\User;

/**
 * Interface for creating Modification entities.
 * Encapsulates the creation logic to ensure consistent initialization.
 */
interface ModificationFactoryInterface
{
    /**
     * Create a new Modification entity.
     *
     * @param array<int, array{0: int, 1: string}>|null $difference The diff data
     */
    public function create(
        User $user,
        Patchnote $patchnote,
        ?array $difference = null,
    ): Modification;

    /**
     * Create a Modification from an array of data.
     *
     * @param array<string, mixed> $data
     */
    public function createFromArray(array $data, User $user): Modification;
}
