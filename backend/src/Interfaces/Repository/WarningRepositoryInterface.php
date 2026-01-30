<?php

declare(strict_types=1);

namespace App\Interfaces\Repository;

use App\Entity\User;
use App\Entity\Warning;

/**
 * Interface for Warning repository.
 * Defines business-specific query methods for warnings.
 */
interface WarningRepositoryInterface
{
    /**
     * Find all warnings for a user.
     *
     * @return Warning[]
     */
    public function findByUser(User $user): array;

    /**
     * Find all warnings issued by an admin.
     *
     * @return Warning[]
     */
    public function findByAdmin(User $admin): array;

    /**
     * Count warnings for a user.
     */
    public function countByUser(User $user): int;

    /**
     * Find recent warnings for a user.
     *
     * @return Warning[]
     */
    public function findRecentByUser(User $user, \DateTimeInterface $since): array;
}
