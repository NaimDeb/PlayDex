<?php

declare(strict_types=1);

namespace App\Interfaces\Repository;

use App\Entity\User;
use App\Entity\Warning;

/**
 * Interface for Warning repository.
 *
 * @extends RepositoryInterface<Warning>
 */
interface WarningRepositoryInterface extends RepositoryInterface
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
