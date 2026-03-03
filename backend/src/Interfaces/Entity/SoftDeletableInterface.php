<?php

declare(strict_types=1);

namespace App\Interfaces\Entity;

/**
 * Interface for entities that support soft deletion.
 * Entities implementing this interface can be marked as deleted
 * without being physically removed from the database.
 */
interface SoftDeletableInterface
{
    public function isDeleted(): ?bool;

    public function setIsDeleted(bool $isDeleted): static;

    /**
     * Mark the entity as deleted.
     */
    public function delete(): static;

    /**
     * Restore a soft-deleted entity.
     */
    public function restore(): static;
}
