<?php

declare(strict_types=1);

namespace App\Interfaces\Factory;

use App\Entity\User;

/**
 * Interface for creating User entities.
 * Encapsulates the creation logic to ensure consistent initialization.
 */
interface UserFactoryInterface
{
    /**
     * Create a new User entity.
     */
    public function create(
        string $email,
        string $username,
        string $plainPassword,
    ): User;

    /**
     * Create a User from an array of data.
     *
     * @param array<string, mixed> $data
     */
    public function createFromArray(array $data): User;
}
