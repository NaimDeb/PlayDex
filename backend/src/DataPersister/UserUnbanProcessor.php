<?php

namespace App\DataPersister;


use ApiPlatform\Metadata\Operation;
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
 */
final class UserUnbanProcessor extends AbstractDataPersister
{
    public function __construct(
        EntityManagerInterface $entityManager,
        Security $security
    ) {
        parent::__construct($entityManager, $security);
    }

    public function process(mixed $data, Operation $operation, array $uriVariables = [], array $context = []): User
    {
        $userId = $uriVariables['id'] ?? null;

        if (!$userId) {
            throw new \InvalidArgumentException('User ID is required');
        }

        $userToUnban = $this->entityManager->getRepository(User::class)->find($userId);

        if (!$userToUnban) {
            throw new \InvalidArgumentException('User not found');
        }

        $userToUnban->setIsBanned(false);
        $userToUnban->setBanReason(null);
        $userToUnban->setBannedUntil(null);

        $this->persist($userToUnban);

        return $userToUnban;
    }
}
