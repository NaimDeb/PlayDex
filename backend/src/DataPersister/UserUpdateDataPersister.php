<?php

namespace App\DataPersister;


use ApiPlatform\Metadata\Operation;
use App\Entity\User;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Bundle\SecurityBundle\Security;
use Symfony\Component\HttpKernel\Exception\BadRequestHttpException;
use Symfony\Component\PasswordHasher\Hasher\UserPasswordHasherInterface;

/**
 * Handles updates to User profile data.
 *
 * Responsibilities:
 * - Updates authenticated user's username (if provided)
 * - Updates authenticated user's email (if provided)
 * - Validates current password before allowing password change
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
            
            // Refresh user from database to get latest password hash
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
                
                // Verify current password against the database hash
                if (!$this->passwordHasher->isPasswordValid($currentUser, $currentPassword)) {
                    throw new BadRequestHttpException('Le mot de passe actuel est incorrect.');
                }

                // Hash the new password and update
                $hashedPassword = $this->passwordHasher->hashPassword($currentUser, $newPassword);
                $currentUser->setPassword($hashedPassword);
            }

            $this->persist($currentUser);
            
            return $currentUser;
        }

        return $data;
    }
}
