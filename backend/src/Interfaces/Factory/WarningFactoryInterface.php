<?php

declare(strict_types=1);

namespace App\Interfaces\Factory;

use App\Entity\User;
use App\Entity\Warning;

/**
 * Interface for creating Warning entities.
 * Encapsulates the creation logic to ensure consistent initialization.
 */
interface WarningFactoryInterface
{
    /**
     * Create a new Warning entity.
     */
    public function create(
        User $warnedUser,
        User $admin,
        ?string $reason = null,
    ): Warning;

    /**
     * Create a Warning from an array of data.
     *
     * @param array<string, mixed> $data
     */
    public function createFromArray(array $data, User $admin): Warning;
}
