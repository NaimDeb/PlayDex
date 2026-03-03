<?php

declare(strict_types=1);

namespace App\Interfaces\Factory;

use App\Entity\Report;
use App\Entity\User;
use App\Interfaces\ReportableInterface;

/**
 * Interface for creating Report entities.
 * Encapsulates the creation logic to ensure consistent initialization.
 */
interface ReportFactoryInterface
{
    /**
     * Create a new Report entity.
     */
    public function create(
        User $reporter,
        string $reason,
        string $reportableEntity,
        int $reportableId,
    ): Report;

    /**
     * Create a Report from a reportable entity.
     */
    public function createFromReportable(
        User $reporter,
        string $reason,
        ReportableInterface $reportable,
    ): Report;

    /**
     * Create a Report from an array of data.
     *
     * @param array<string, mixed> $data
     */
    public function createFromArray(array $data, User $reporter): Report;
}
