<?php

declare(strict_types=1);

namespace App\Interfaces\Entity;

/**
 * Interface for entities that can be banned (typically users).
 */
interface BannableInterface
{
    public function isBanned(): ?bool;

    public function setIsBanned(?bool $isBanned): static;

    public function getBanReason(): ?string;

    public function setBanReason(?string $banReason): static;

    public function getBannedUntil(): ?\DateTimeImmutable;

    public function setBannedUntil(?\DateTimeImmutable $bannedUntil): static;
}
