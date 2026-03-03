<?php

namespace App\DataPersister;

use ApiPlatform\Metadata\Operation;
use App\Entity\User;
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
 */
class UserDataPersister extends AbstractDataPersister
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
            if ($data->getPlainPassword()) {
                $hashedPassword = $this->passwordHasher->hashPassword($data, $data->getPlainPassword());
                $data->setPassword($hashedPassword);
            }

            $data->setRoles(['ROLE_USER']);
            $data->setReputation(0);
            $data->setCreatedAtValue();

            $this->persist($data);
        }

        return $data;
    }
}
