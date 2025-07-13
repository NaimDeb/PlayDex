<?php

namespace App\DataPersister;

use ApiPlatform\Metadata\Operation;
use ApiPlatform\State\ProcessorInterface;
use App\Entity\User;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Bundle\SecurityBundle\Security;
use Symfony\Component\PasswordHasher\Hasher\UserPasswordHasherInterface;

final class UserUpdateDataPersister implements ProcessorInterface
{

    public function __construct(
        private readonly EntityManagerInterface $entityManager,
        private readonly Security $security,
        private readonly UserPasswordHasherInterface $passwordHasher
    ) {}

    public function process(mixed $data, Operation $operation, array $uriVariables = [], array $context = []): User
    {
        if ($data instanceof User) {
            /**
             * @var User
             */
            $currentUser = $this->security->getUser();

            // Update username if provided
            if ($data->getUsername()) {
                $currentUser->setUsername($data->getUsername());
            }

            // Update email if provided
            if ($data->getEmail()) {
                $currentUser->setEmail($data->getEmail());
            }

            // Update password if provided
            if ($data->getPassword()) {
                $hashedPassword = $this->passwordHasher->hashPassword($currentUser, $data->getPassword());
                $currentUser->setPassword($hashedPassword);
            }

            $this->entityManager->persist($currentUser);
            $this->entityManager->flush();
        }

        return $data;
    }
}
