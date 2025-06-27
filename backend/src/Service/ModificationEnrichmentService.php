<?php

namespace App\Service;

use App\Entity\Modification;
use App\Repository\ReportRepository;

class ModificationEnrichmentService
{
    public function __construct(
        private ReportRepository $reportRepository
    ) {}

    public function enrichModification(Modification $modification): array
    {
        $data = [
            'id' => $modification->getId(),
            'createdAt' => $modification->getCreatedAt(),
            'user' => $modification->getUser(),
            'patchnote' => $modification->getPatchnote(),
            'difference' => $modification->getDifference(),
            'isDeleted' => $modification->isDeleted(),
        ];

        // Add report count
        $data['reportCount'] = $this->reportRepository->countReportsForEntity(
            'Modification',
            $modification->getId()
        );

        return $data;
    }

    public function enrichModifications(array $modifications): array
    {
        return array_map([$this, 'enrichModification'], $modifications);
    }
}
