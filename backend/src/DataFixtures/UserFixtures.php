<?php

namespace App\DataFixtures;

use App\Entity\User;
use Doctrine\Bundle\FixturesBundle\Fixture;
use Doctrine\Persistence\ObjectManager;
use Symfony\Component\PasswordHasher\Hasher\UserPasswordHasherInterface;

class UserFixtures extends Fixture
{
    private UserPasswordHasherInterface $hasher;

    public function __construct(UserPasswordHasherInterface $hasher)
    {
        $this->hasher = $hasher;
    }

    public function load(ObjectManager $manager): void
    {
        // Create Admin Users
        $admin1 = $this->createUser(
            'admin@playdex.com',
            'AdminUser1',
            ['ROLE_ADMIN', 'ROLE_USER'],
            new \DateTimeImmutable('2025-07-08 10:00:00'),
            100
        );
        $manager->persist($admin1);
        $this->addReference('admin-1', $admin1);

        $admin2 = $this->createUser(
            'moderator@playdex.com',
            'ModeratorUser',
            ['ROLE_ADMIN', 'ROLE_USER'],
            new \DateTimeImmutable('2025-07-09 09:30:00'),
            75
        );
        $manager->persist($admin2);
        $this->addReference('admin-2', $admin2);

        // Create Regular Users
        $user1 = $this->createUser(
            'user1@example.com',
            'ActiveUser1',
            ['ROLE_USER'],
            new \DateTimeImmutable('2025-07-09 08:00:00'),
            50
        );
        $manager->persist($user1);
        $this->addReference('user-1', $user1);

        $user2 = $this->createUser(
            'user2@example.com',
            'RegularUser2',
            ['ROLE_USER'],
            new \DateTimeImmutable('2025-07-08 15:45:00'),
            30
        );
        $manager->persist($user2);
        $this->addReference('user-2', $user2);

        $user3 = $this->createUser(
            'user3@example.com',
            'CasualUser3',
            ['ROLE_USER'],
            new \DateTimeImmutable('2025-07-07 11:20:00'),
            20
        );
        $manager->persist($user3);
        $this->addReference('user-3', $user3);

        // Create Banned Users
        $bannedUser1 = $this->createUser(
            'banned1@example.com',
            'BannedUser1',
            ['ROLE_USER'],
            new \DateTimeImmutable('2025-07-01 09:00:00'),
            -10
        );
        $bannedUser1->setIsBanned(true);
        $bannedUser1->setBanReason('Multiple violations of community guidelines');
        $bannedUser1->setBannedUntil(new \DateTimeImmutable('2025-08-01 00:00:00'));
        $manager->persist($bannedUser1);
        $this->addReference('banned-user-1', $bannedUser1);

        $bannedUser2 = $this->createUser(
            'banned2@example.com',
            'BannedUser2',
            ['ROLE_USER'],
            new \DateTimeImmutable('2025-07-02 14:30:00'),
            -5
        );
        $bannedUser2->setIsBanned(true);
        $bannedUser2->setBanReason('Spamming patchnotes');
        $bannedUser2->setBannedUntil(new \DateTimeImmutable('2025-07-16 00:00:00'));
        $manager->persist($bannedUser2);
        $this->addReference('banned-user-2', $bannedUser2);

        $manager->flush();
    }

    private function createUser(
        string $email,
        string $username,
        array $roles,
        \DateTimeImmutable $lastLoginAt,
        int $reputation
    ): User {
        $user = new User();
        $user->setEmail($email);
        $user->setUsername($username);
        $user->setRoles($roles);
        $user->setPassword($this->hasher->hashPassword($user, 'password123'));
        $user->setCreatedAt(new \DateTimeImmutable('2025-01-01'));
        $user->setLastLoginAt($lastLoginAt);
        $user->setReputation((string) $reputation);
        $user->setIsDeleted(false);

        return $user;
    }
}
