<?php

declare(strict_types=1);

namespace App\Interfaces\Repository;

use App\Entity\Modification;
use App\Entity\Patchnote;
use App\Entity\User;

/**
 * Interface for Modification repository.
 * Defines business-specific query methods for modifications.
 */
interface ModificationRepositoryInterface
{
    /**
     * Find all modifications for a patchnote.
     *
     * @return Modification[]
     */
    public function findByPatchnote(Patchnote $patchnote): array;

    /**
     * Find all modifications made by a user.
     *
     * @return Modification[]
     */
    public function findByUser(User $user): array;

    /**
     * Find recent modifications.
     *
     * @return Modification[]
     */
    public function findRecent(\DateTimeInterface $since, int $limit = 10): array;

    /**
     * Count modifications for a patchnote.
     */
    public function countByPatchnote(Patchnote $patchnote): int;

    /**
     * Count modifications by a user.
     */
    public function countByUser(User $user): int;
}
