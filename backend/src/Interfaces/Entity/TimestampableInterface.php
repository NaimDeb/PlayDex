<?php

declare(strict_types=1);

namespace App\Interfaces\Entity;

/**
 * Interface for entities that track creation and update timestamps.
 */
interface TimestampableInterface
{
    public function getCreatedAt(): ?\DateTimeImmutable;

    public function setCreatedAt(\DateTimeImmutable $createdAt): static;

    public function getUpdatedAt(): ?\DateTimeImmutable;

    public function setUpdatedAt(?\DateTimeImmutable $updatedAt): static;
}
