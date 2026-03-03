<?php

namespace App\DataPersister;


use ApiPlatform\Metadata\Operation;
use App\Entity\Report;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Component\HttpKernel\Exception\BadRequestHttpException;

/**
 * Handles deletion (soft-delete) of Report entities.
 *
 * Responsibilities:
 * - Validates that the report exists
 * - Prevents deletion of already-deleted reports
 * - Marks report as deleted (soft-delete)
 * - Persists changes to the database
 */
class ReportDeleteProcessor extends AbstractDataPersister
{
    public function __construct(EntityManagerInterface $entityManager)
    {
        parent::__construct($entityManager, null);
    }

    public function process(mixed $data, Operation $operation, array $uriVariables = [], array $context = []): void
    {
        if (!$data instanceof Report) {
            return;
        }

        if ($data->isDeleted()) {
            throw new BadRequestHttpException('This report has already been deleted.');
        }

        $this->softDelete($data);
    }
}
