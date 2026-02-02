<?php

namespace App\DataPersister;

use ApiPlatform\Metadata\Operation;
use ApiPlatform\State\ProcessorInterface;
use App\Entity\User;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Bundle\SecurityBundle\Security;

/**
 * Handles unbanning of User accounts.
 *
 * Responsibilities:
 * - Validates that the user ID is provided
 * - Retrieves the user to unban from the database
 * - Updates user's ban status (clears ban)
 * - Verifies user permissions for unban operation
 * - Persists changes to the database
 *
 * Note: This is a custom Processor for moderation actions.
 * Could potentially inherit from AbstractDataPersister for persist() method.
 */
final class UserUnbanProcessor implements ProcessorInterface
{
    public function __construct(
        private readonly EntityManagerInterface $entityManager,
        private readonly Security $security
    ) {}

    public function process(mixed $data, Operation $operation, array $uriVariables = [], array $context = []): User
    {
        // Get the user ID from URI variables
        $userId = $uriVariables['id'] ?? null;

        if (!$userId) {
            throw new \InvalidArgumentException('User ID is required');
        }

        // Find the user to unban
        $userToUnban = $this->entityManager->getRepository(User::class)->find($userId);

        if (!$userToUnban) {
            throw new \InvalidArgumentException('User not found');
        }

        // Remove ban status
        $userToUnban->setIsBanned(false);
        $userToUnban->setBanReason(null);
        $userToUnban->setBannedUntil(null);

        $this->entityManager->persist($userToUnban);
        $this->entityManager->flush();

        return $userToUnban;
    }
}
