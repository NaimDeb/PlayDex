<?php

declare(strict_types=1);

namespace App\Interfaces\Strategy;

use App\Entity\Report;

/**
 * Interface for report enrichers.
 * Implements the Strategy pattern for enriching reports with entity-specific data.
 */
interface ReportEnricherInterface
{
    /**
     * Check if this enricher supports the given entity type.
     */
    public function supports(string $entityType): bool;

    /**
     * Enrich a report with additional entity-specific data.
     *
     * @return array<string, mixed> Enriched report data
     */
    public function enrich(Report $report, object $entity): array;
}
