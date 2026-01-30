<?php

declare(strict_types=1);

namespace App\Interfaces\Repository;

use App\Entity\Report;
use App\Entity\User;

/**
 * Interface for Report repository.
 * Defines business-specific query methods for reports.
 */
interface ReportRepositoryInterface
{
    /**
     * Find all reports made by a user.
     *
     * @return Report[]
     */
    public function findByReporter(User $user): array;

    /**
     * Find all reports for a specific entity type.
     *
     * @return Report[]
     */
    public function findByEntityType(string $entityType): array;

    /**
     * Find all reports for a specific entity.
     *
     * @return Report[]
     */
    public function findByEntity(string $entityType, int $entityId): array;

    /**
     * Check if a user has already reported an entity.
     */
    public function hasUserReported(User $user, string $entityType, int $entityId): bool;

    /**
     * Count reports for a specific entity.
     */
    public function countByEntity(string $entityType, int $entityId): int;

    /**
     * Find pending (unresolved) reports.
     *
     * @return Report[]
     */
    public function findPending(int $limit = 50): array;
}
