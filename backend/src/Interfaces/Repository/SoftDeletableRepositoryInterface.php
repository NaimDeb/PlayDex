<?php

declare(strict_types=1);

namespace App\Interfaces\Repository;

use App\Interfaces\Entity\SoftDeletableInterface;

/**
 * Interface for repositories that handle soft-deletable entities.
 *
 * @template T of SoftDeletableInterface
 * @extends RepositoryInterface<T>
 */
interface SoftDeletableRepositoryInterface extends RepositoryInterface
{
    /**
     * Find all non-deleted entities.
     *
     * @return T[]
     */
    public function findAllActive(): array;

    /**
     * Find all soft-deleted entities.
     *
     * @return T[]
     */
    public function findAllDeleted(): array;

    /**
     * Soft delete an entity.
     *
     * @param T $entity
     */
    public function softDelete(object $entity, bool $flush = true): void;

    /**
     * Restore a soft-deleted entity.
     *
     * @param T $entity
     */
    public function restore(object $entity, bool $flush = true): void;
}
