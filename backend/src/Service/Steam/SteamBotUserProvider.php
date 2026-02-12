<?php

declare(strict_types=1);

namespace App\Service\Steam;

use App\Entity\User;
use App\Repository\UserRepository;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Component\PasswordHasher\Hasher\UserPasswordHasherInterface;

class SteamBotUserProvider
{
    private const BOT_EMAIL = 'steambot@playdex.internal';
    private const BOT_USERNAME = 'SteamBot';

    private ?User $cachedBotUser = null;

    public function __construct(
        private readonly UserRepository $userRepository,
        private readonly EntityManagerInterface $em,
        private readonly UserPasswordHasherInterface $passwordHasher,
    ) {
    }

    public function getBotUser(): User
    {
        if ($this->cachedBotUser !== null) {
            return $this->cachedBotUser;
        }

        $botUser = $this->userRepository->findOneBy(['email' => self::BOT_EMAIL]);

        if ($botUser === null) {
            $botUser = new User();
            $botUser->setEmail(self::BOT_EMAIL);
            $botUser->setUsername(self::BOT_USERNAME);
            $botUser->setRoles(['ROLE_USER']);
            $botUser->setPassword(
                $this->passwordHasher->hashPassword($botUser, bin2hex(random_bytes(32)))
            );
            $botUser->setCreatedAt(new \DateTimeImmutable());
            $botUser->setIsDeleted(false);
            $botUser->setReputation('0');

            $this->em->persist($botUser);
            $this->em->flush();
        }

        $this->cachedBotUser = $botUser;

        return $botUser;
    }
}
