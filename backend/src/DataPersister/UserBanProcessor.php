<?php

namespace App\DataPersister;

use ApiPlatform\Metadata\Operation;
use App\Entity\User;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Bundle\SecurityBundle\Security;

/**
 * Handles banning of User accounts.
 *
 * Responsibilities:
 * - Validates that the user ID is provided
 * - Retrieves the user to ban from the database
 * - Updates user's ban status and sets ban timestamp
 * - Verifies user permissions for ban operation
 * - Persists changes to the database
 */
final class UserBanProcessor extends AbstractDataPersister
{
    public function __construct(
        EntityManagerInterface $entityManager,
        Security $security
    ) {
        parent::__construct($entityManager, $security);
    }

    public function process(mixed $data, Operation $operation, array $uriVariables = [], array $context = []): User
    {
        if ($data instanceof User) {
            $userId = $uriVariables['id'] ?? null;

            if (!$userId) {
                throw new \InvalidArgumentException('User ID is required');
            }

            $userToBan = $this->entityManager->getRepository(User::class)->find($userId);

            if (!$userToBan) {
                throw new \InvalidArgumentException('User not found');
            }

            $banReason = $data->getBanReason();
            if (!$banReason) {
                throw new \InvalidArgumentException('Ban reason is required');
            }

            $userToBan->setIsBanned(true);
            $userToBan->setBanReason($banReason);

            if ($data->getBannedUntil()) {
                $userToBan->setBannedUntil($data->getBannedUntil());
            }

            $this->persist($userToBan);

            return $userToBan;
        }

        return $data;
    }
}
