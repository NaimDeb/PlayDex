<?php

declare(strict_types=1);

namespace App\Interfaces\Service;

use App\Entity\User;

/**
 * Interface for the user ban service.
 * Handles banning and unbanning users.
 */
interface UserBanServiceInterface
{
    /**
     * Ban a user.
     */
    public function ban(User $user, string $reason, ?\DateTimeImmutable $until = null): void;

    /**
     * Unban a user.
     */
    public function unban(User $user): void;

    /**
     * Check if a user is currently banned.
     */
    public function isBanned(User $user): bool;

    /**
     * Check if a ban has expired.
     */
    public function hasBanExpired(User $user): bool;

    /**
     * Process expired bans (unban users whose ban has expired).
     *
     * @return int Number of users unbanned
     */
    public function processExpiredBans(): int;
}
