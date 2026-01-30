<?php

declare(strict_types=1);

namespace App\Interfaces\Entity;

use App\Entity\User;

/**
 * Interface for entities that have an owner (creator).
 * Used for entities that are created by a user and belong to them.
 */
interface OwnableInterface
{
    public function getCreatedBy(): ?User;

    public function setCreatedBy(?User $user): static;
}
