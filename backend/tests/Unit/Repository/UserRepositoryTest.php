<?php

namespace App\Tests\Unit\Repository;

use App\Entity\User;
use App\Repository\UserRepository;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Bundle\FrameworkBundle\Test\KernelTestCase;

class UserRepositoryTest extends KernelTestCase
{
    private EntityManagerInterface $entityManager;
    private UserRepository $userRepository;

    protected function setUp(): void
    {
        $kernel = self::bootKernel();
        $this->entityManager = $kernel->getContainer()->get('doctrine')->getManager();
        $this->userRepository = $this->entityManager->getRepository(User::class);
    }

    public function testFindByEmail(): void
    {
        // Create a test user
        $user = new User();
        $user->setEmail('test@example.com');
        $user->setUsername('testuser');
        $user->setPassword('hashedpassword');
        $user->setCreatedAt(new \DateTimeImmutable());

        $this->entityManager->persist($user);
        $this->entityManager->flush();

        // Test finding by email
        $foundUser = $this->userRepository->findOneBy(['email' => 'test@example.com']);

        $this->assertInstanceOf(User::class, $foundUser);
        $this->assertEquals('test@example.com', $foundUser->getEmail());
        $this->assertEquals('testuser', $foundUser->getUsername());

        // Cleanup
        $this->entityManager->remove($user);
        $this->entityManager->flush();
    }

    public function testFindByUsername(): void
    {
        // Create a test user
        $user = new User();
        $user->setEmail('test2@example.com');
        $user->setUsername('testuser2');
        $user->setPassword('hashedpassword');
        $user->setCreatedAt(new \DateTimeImmutable());

        $this->entityManager->persist($user);
        $this->entityManager->flush();

        // Test finding by username
        $foundUser = $this->userRepository->findOneBy(['username' => 'testuser2']);

        $this->assertInstanceOf(User::class, $foundUser);
        $this->assertEquals('testuser2', $foundUser->getUsername());

        // Cleanup
        $this->entityManager->remove($user);
        $this->entityManager->flush();
    }

    public function testUpgradePassword(): void
    {
        // Create a test user
        $user = new User();
        $user->setEmail('test3@example.com');
        $user->setUsername('testuser3');
        $user->setPassword('oldpassword');
        $user->setCreatedAt(new \DateTimeImmutable());

        $this->entityManager->persist($user);
        $this->entityManager->flush();

        $oldPassword = $user->getPassword();
        $newPassword = 'newhashedpassword';

        // Test password upgrade
        $this->userRepository->upgradePassword($user, $newPassword);

        $this->assertEquals($newPassword, $user->getPassword());
        $this->assertNotEquals($oldPassword, $user->getPassword());

        // Cleanup
        $this->entityManager->remove($user);
        $this->entityManager->flush();
    }

    protected function tearDown(): void
    {
        parent::tearDown();
        $this->entityManager->close();
    }
}
