<?php

namespace App\DataPersister;

use AbstractDataPersister;
use ApiPlatform\Metadata\Operation;
use App\Entity\User;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Bundle\SecurityBundle\Security;
use Symfony\Component\PasswordHasher\Hasher\UserPasswordHasherInterface;

/**
 * Handles updates to User profile data.
 *
 * Responsibilities:
 * - Updates authenticated user's username (if provided)
 * - Updates authenticated user's email (if provided)
 * - Hashes password if provided for update
 * - Persists changes to the database
 * - Operates on the currently authenticated user only
 */
final class UserUpdateDataPersister extends AbstractDataPersister
{
    public function __construct(
        EntityManagerInterface $entityManager,
        Security $security,
        private readonly UserPasswordHasherInterface $passwordHasher
    ) {
        parent::__construct($entityManager, $security);
    }

    public function process(mixed $data, Operation $operation, array $uriVariables = [], array $context = []): User
    {
        if ($data instanceof User) {
            $currentUser = $this->getAuthenticatedUser();

            if ($data->getUsername()) {
                $currentUser->setUsername($data->getUsername());
            }

            if ($data->getEmail()) {
                $currentUser->setEmail($data->getEmail());
            }

            if ($data->getPassword()) {
                $hashedPassword = $this->passwordHasher->hashPassword($currentUser, $data->getPassword());
                $currentUser->setPassword($hashedPassword);
            }

            $this->persist($currentUser);
        }

        return $data;
    }
}
