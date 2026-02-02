<?php

namespace App\DataPersister;

use ApiPlatform\Metadata\Operation;
use ApiPlatform\State\ProcessorInterface;
use App\Entity\User;
use App\Entity\UserDetails;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Bundle\SecurityBundle\Security;
use Symfony\Component\PasswordHasher\Hasher\UserPasswordHasherInterface;

/**
 * Handles the creation and initialization of User entities.
 *
 * Responsibilities:
 * - Hashes the user password using bcrypt
 * - Assigns default ROLE_USER role
 * - Initializes reputation points (0)
 * - Sets creation timestamp
 * - Persists the user to the database
 *
 * Note: This class implements ProcessorInterface directly. Should extend AbstractDataPersister
 * to inherit common persist() and getAuthenticatedUser() methods.
 */
class UserDataPersister implements ProcessorInterface
{
    public function __construct(
        private readonly EntityManagerInterface $entityManager,
        private readonly Security $security,
        private readonly UserPasswordHasherInterface $passwordHasher
    ) {}

    public function process(mixed $data, Operation $operation, array $uriVariables = [], array $context = []): User
    {
        if ($data instanceof User) {

            // Password hashing
            if ($data->getPassword()) {
                $hashedPassword = $this->passwordHasher->hashPassword($data, $data->getPassword());
                $data->setPassword($hashedPassword);
            }

            // Roles
            $data->setRoles(['ROLE_USER']);

            // Initialise reputation
            $data->setReputation(0);


            // initialise createdAt
            $data->setCreatedAtValue();



            $this->entityManager->persist($data);
            $this->entityManager->flush();
        }

        return $data;
    }
}