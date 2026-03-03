<?php

declare(strict_types=1);

namespace App\Interfaces\Repository;

use App\Entity\User;

/**
 * Interface for User repository.
 * Defines business-specific query methods for users.
 */
interface UserRepositoryInterface
{
    /**
     * Find a user by email.
     */
    public function findByEmail(string $email): ?User;

    /**
     * Find a user by username.
     */
    public function findByUsername(string $username): ?User;

    /**
     * Find all banned users.
     *
     * @return User[]
     */
    public function findBanned(): array;

    /**
     * Find users whose ban has expired.
     *
     * @return User[]
     */
    public function findExpiredBans(): array;

    /**
     * Find users by role.
     *
     * @return User[]
     */
    public function findByRole(string $role): array;

    /**
     * Search users by username or email.
     *
     * @return User[]
     */
    public function search(string $query, int $limit = 10): array;
}
