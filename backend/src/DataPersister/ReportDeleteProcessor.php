<?php

namespace App\DataPersister;

use ApiPlatform\Metadata\Operation;
use ApiPlatform\State\ProcessorInterface;
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
 *
 * Note: This is a Processor, not a Persister. Handles deletion logic rather than creation.
 * Could extend AbstractDataPersister to use the softDelete() method.
 */
class ReportDeleteProcessor implements ProcessorInterface
{
    public function __construct(
        private EntityManagerInterface $entityManager
    ) {}

    public function process(mixed $data, Operation $operation, array $uriVariables = [], array $context = []): void
    {
        if (!$data instanceof Report) {
            return;
        }

        // Check if already deleted
        if ($data->isDeleted()) {
            throw new BadRequestHttpException('This report has already been deleted.');
        }

        // Soft delete by setting isDeleted to true
        $data->setIsDeleted(true);

        // Save the changes
        $this->entityManager->persist($data);
        $this->entityManager->flush();
    }
}
