<?php

declare(strict_types=1);

namespace App\Interfaces\Entity;

/**
 * Interface for entities that have an identifier.
 * Base interface for all identifiable entities.
 */
interface IdentifiableInterface
{
    public function getId(): ?int;
}
