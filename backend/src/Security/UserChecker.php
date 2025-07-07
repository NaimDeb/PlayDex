<?php

namespace App\Security;

use App\Entity\User;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Component\Security\Core\User\UserCheckerInterface;
use Symfony\Component\Security\Core\User\UserInterface;
use Symfony\Component\Security\Core\Exception\CustomUserMessageAccountStatusException;

class UserChecker implements UserCheckerInterface
{
    public function __construct(
        private readonly EntityManagerInterface $entityManager
    ) {}

    public function checkPreAuth(UserInterface $user): void
    {
        if (!$user instanceof User) {
            return;
        }

        if ($user->isDeleted() === true) {
            throw new CustomUserMessageAccountStatusException('Votre compte a été supprimé. Si c\'est une erreur, veuillez contacter le support.');
        }

        // Check if user is banned
        if ($user->isBanned() === true) {
            $this->handleBannedUser($user);
        }
    }

    public function checkPostAuth(UserInterface $user): void
    {

        $this->setLastLogin($user);
        
    }


    private function setLastLogin(User $user): void
    {
        $now = new \DateTimeImmutable();
        $user->setLastLoginAt($now);
        $this->entityManager->persist($user);
        $this->entityManager->flush();

    }

    private function handleBannedUser(User $user): void
    {
        $bannedUntil = $user->getBannedUntil();

        // If ban has no expiration date (permanent ban)
        if ($bannedUntil === null) {
            $reason = $user->getBanReason() ?? 'Votre compte a été banni.';
            throw new CustomUserMessageAccountStatusException('Votre compte a été banni définitivement. Raison: ' . $reason);
        }

        // Check if ban has expired
        $now = new \DateTimeImmutable();
        if ($now > $bannedUntil) {
            // Ban has expired, remove ban status
            $this->unbanUser($user);
            return;
        }

        // Ban is still active
        $reason = $user->getBanReason() ?? 'Votre compte a été banni.';
        $banEndDate = $bannedUntil->format('d/m/Y à H:i');
        throw new CustomUserMessageAccountStatusException(
            "Votre compte est banni jusqu'au {$banEndDate}. Raison: {$reason}"
        );
    }

    private function unbanUser(User $user): void
    {
        $user->setIsBanned(false);
        $user->setBanReason(null);
        $user->setBannedUntil(null);

        $this->entityManager->persist($user);
        $this->entityManager->flush();
    }
}
