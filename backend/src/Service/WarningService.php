<?php

namespace App\Service;

use App\Entity\User;
use App\Entity\Warning;
use App\Interfaces\Service\WarningServiceInterface;
use Doctrine\ORM\EntityManagerInterface;

/**
 * Handles user warning operations including creation, counting, and ban threshold checks.
 *
 * Responsibilities:
 * - Create warning records for users
 * - Track warning counts
 * - Determine automatic ban eligibility based on warning threshold
 */
class WarningService implements WarningServiceInterface
{
    private const BAN_THRESHOLD = 3;

    public function __construct(
        private EntityManagerInterface $em
    ) {}

    /**
     * Issue a warning to a user.
     *
     * @param User $user The user receiving the warning
     * @param User $admin The admin issuing the warning
     * @param string $reason The reason for the warning
     * @return Warning The created warning entity
     */
    public function warn(User $user, User $admin, string $reason): Warning
    {
        $warning = new Warning();
        $warning->setReportedUserId($user);
        $warning->setWarnedBy($admin);
        $this->em->persist($warning);
        $this->em->flush();

        return $warning;
    }

    /**
     * Warn user for content deletion (convenience method).
     *
     * @param User $target The user whose content was deleted
     * @param User|null $admin The admin who deleted the content
     */
    public function warnUserForDeletion(
        User $target,
        ?User $admin,
    ): void {
        if ($admin) {
            $this->warn($target, $admin, 'Content deletion by moderator');
        }
    }

    /**
     * Get the warning count for a user.
     *
     * @param User $user The user to check
     * @return int The number of warnings
     */
    public function getWarningCount(User $user): int
    {
        return $this->em->getRepository(Warning::class)->count([
            'reportedUserId' => $user,
        ]);
    }

    /**
     * Check if a user should be banned based on warnings.
     *
     * @param User $user The user to check
     * @return bool True if user should be banned
     */
    public function shouldBeBanned(User $user): bool
    {
        return $this->getWarningCount($user) >= self::BAN_THRESHOLD;
    }

    /**
     * Get the threshold for automatic ban.
     *
     * @return int The ban threshold
     */
    public function getBanThreshold(): int
    {
        return self::BAN_THRESHOLD;
    }
}
