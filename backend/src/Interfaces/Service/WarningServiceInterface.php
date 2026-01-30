<?php

declare(strict_types=1);

namespace App\Interfaces\Service;

use App\Entity\User;
use App\Entity\Warning;

/**
 * Interface for the warning service.
 * Handles user warning logic and automatic actions.
 */
interface WarningServiceInterface
{
    /**
     * Issue a warning to a user.
     */
    public function warn(User $user, User $admin, string $reason): Warning;

    /**
     * Get the warning count for a user.
     */
    public function getWarningCount(User $user): int;

    /**
     * Check if a user should be banned based on warnings.
     */
    public function shouldBeBanned(User $user): bool;

    /**
     * Get the threshold for automatic ban.
     */
    public function getBanThreshold(): int;
}
