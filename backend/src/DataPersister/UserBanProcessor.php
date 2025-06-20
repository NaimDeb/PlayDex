<?php

namespace App\DataPersister;

use ApiPlatform\Metadata\Operation;
use ApiPlatform\State\ProcessorInterface;
use App\Entity\User;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Bundle\SecurityBundle\Security;

final class UserBanProcessor implements ProcessorInterface
{
    public function __construct(
        private readonly EntityManagerInterface $entityManager,
        private readonly Security $security
    ) {}

    public function process(mixed $data, Operation $operation, array $uriVariables = [], array $context = []): User
    {
        if ($data instanceof User) {
            // Get the user ID from URI variables
            $userId = $uriVariables['id'] ?? null;

            if (!$userId) {
                throw new \InvalidArgumentException('User ID is required');
            }

            // Find the user to ban
            $userToBan = $this->entityManager->getRepository(User::class)->find($userId);

            if (!$userToBan) {
                throw new \InvalidArgumentException('User not found');
            }

            // Get the ban reason from the request data
            $banReason = $data->getBanReason();
            if (!$banReason) {
                throw new \InvalidArgumentException('Ban reason is required');
            }

            // Set ban properties
            $userToBan->setIsBanned(true);
            $userToBan->setBanReason($banReason);

            // Set ban duration if provided
            if ($data->getBannedUntil()) {
                $userToBan->setBannedUntil($data->getBannedUntil());
            }

            $this->entityManager->persist($userToBan);
            $this->entityManager->flush();

            return $userToBan;
        }

        return $data;
    }
}
