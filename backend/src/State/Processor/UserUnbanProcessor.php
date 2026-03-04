<?php

namespace App\State\Processor;

use ApiPlatform\Metadata\Operation;
use App\Entity\User;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Bundle\SecurityBundle\Security;

final class UserUnbanProcessor extends AbstractProcessor
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
