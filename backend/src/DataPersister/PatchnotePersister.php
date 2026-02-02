<?php

namespace App\DataPersister;

use ApiPlatform\Metadata\Operation;
use ApiPlatform\State\ProcessorInterface;
use App\Entity\Patchnote;
use App\Entity\User;
use App\Entity\UserDetails;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Bundle\SecurityBundle\Security;
use Symfony\Component\PasswordHasher\Hasher\UserPasswordHasherInterface;

/**
 * Handles the creation and initialization of Patchnote entities.
 *
 * Responsibilities:
 * - Validates incoming Patchnote data
 * - Associates the patchnote with the authenticated user (creator)
 * - Sets creation timestamp
 * - Persists the patchnote to the database
 *
 * Note: This class implements ProcessorInterface directly. Should extend AbstractDataPersister
 * to inherit common persist() and getAuthenticatedUser() methods.
 */
class PatchnotePersister implements ProcessorInterface
{
    public function __construct(
        private readonly EntityManagerInterface $entityManager,
        private readonly Security $security,
    ) {}

    public function process(mixed $data, Operation $operation, array $uriVariables = [], array $context = []): Patchnote
    {
        if ($data instanceof Patchnote) {


            $user = $this->security->getUser();

            if (!$user) {
                throw new \Symfony\Component\Security\Core\Exception\AccessDeniedException('Not authenticated');
            }
            // Roles
            $data->setCreatedBy($user);
            // initialise createdAt
            $data->setCreatedAtValue();
            $this->entityManager->persist($data);
            $this->entityManager->flush();
        }

        return $data;
    }
}