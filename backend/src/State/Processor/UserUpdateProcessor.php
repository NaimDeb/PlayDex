<?php

namespace App\State\Processor;

use ApiPlatform\Metadata\Operation;
use App\Entity\User;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Bundle\SecurityBundle\Security;
use Symfony\Component\HttpKernel\Exception\BadRequestHttpException;
use Symfony\Component\PasswordHasher\Hasher\UserPasswordHasherInterface;

final class UserUpdateProcessor extends AbstractProcessor
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
            
            $this->entityManager->refresh($currentUser);

            if ($data->getUsername()) {
                $currentUser->setUsername($data->getUsername());
            }

            if ($data->getEmail()) {
                $currentUser->setEmail($data->getEmail());
            }

            if ($data->getNewPassword()) {
                $currentPassword = $data->getCurrentPassword();
                $newPassword = $data->getNewPassword();

                if (!$currentPassword) {
                    throw new BadRequestHttpException('Le mot de passe actuel est requis pour changer le mot de passe.');
                }
                
                if (!$this->passwordHasher->isPasswordValid($currentUser, $currentPassword)) {
                    throw new BadRequestHttpException('Le mot de passe actuel est incorrect.');
                }

                $hashedPassword = $this->passwordHasher->hashPassword($currentUser, $newPassword);
                $currentUser->setPassword($hashedPassword);
            }

            $this->persist($currentUser);
            
            return $currentUser;
        }

        return $data;
    }
}
