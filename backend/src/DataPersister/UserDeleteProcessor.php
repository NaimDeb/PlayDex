<?php

namespace App\DataPersister;

use ApiPlatform\Metadata\Operation;
use ApiPlatform\State\ProcessorInterface;
use App\Entity\User;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Component\HttpKernel\Exception\BadRequestHttpException;

/**
 * Handles deletion (soft-delete) of User entities.
 *
 * Responsibilities:
 * - Validates that the user exists
 * - Prevents deletion of already-deleted users
 * - Marks user as deleted (soft-delete)
 * - Persists changes to the database
 *
 * Note: This is a Processor, not a Persister. Handles deletion logic rather than creation.
 * Could extend AbstractDataPersister to use the softDelete() method.
 */
class UserDeleteProcessor implements ProcessorInterface
{
    public function __construct(
        private EntityManagerInterface $entityManager
    ) {}

    public function process(mixed $data, Operation $operation, array $uriVariables = [], array $context = []): void
    {
        if (!$data instanceof User) {
            return;
        }

        // Check if already deleted
        if ($data->isDeleted()) {
            throw new BadRequestHttpException('This user has already been deleted.');
        }

        // Soft delete by setting isDeleted to true
        $data->setIsDeleted(true);

        // Save the changes
        $this->entityManager->persist($data);
        $this->entityManager->flush();
    }
}
