<?php

declare(strict_types=1);

namespace App\Dto;

use App\Entity\Report;

/**
 * Data Transfer Object for enriched report data.
 * Contains the report plus additional entity-specific information.
 */
final readonly class ReportEnrichedDto
{
    public function __construct(
        public Report $report,
        public string $entityTitle,
        public ?string $entityAuthor = null,
        public ?string $entityContent = null,
        public ?\DateTimeImmutable $entityCreatedAt = null,
        /** @var array<string, mixed> */
        public array $additionalData = [],
    ) {
    }

    /**
     * Convert to array for serialization.
     *
     * @return array<string, mixed>
     */
    public function toArray(): array
    {
        return [
            'report' => [
                'id' => $this->report->getId(),
                'reason' => $this->report->getReason(),
                'reportedAt' => $this->report->getReportedAt()?->format(\DateTimeInterface::ATOM),
                'reportableEntity' => $this->report->getReportableEntity(),
                'reportableId' => $this->report->getReportableId(),
            ],
            'entity' => [
                'title' => $this->entityTitle,
                'author' => $this->entityAuthor,
                'content' => $this->entityContent,
                'createdAt' => $this->entityCreatedAt?->format(\DateTimeInterface::ATOM),
            ],
            ...$this->additionalData,
        ];
    }
}
