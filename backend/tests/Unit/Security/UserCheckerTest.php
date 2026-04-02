<?php

namespace App\Tests\Unit\Security;

use App\Entity\User;
use App\Security\UserChecker;
use Doctrine\ORM\EntityManagerInterface;
use PHPUnit\Framework\TestCase;
use Symfony\Component\Security\Core\Exception\CustomUserMessageAccountStatusException;
use Symfony\Component\Security\Core\User\UserInterface;

class UserCheckerTest extends TestCase
{
    private EntityManagerInterface $entityManager;
    private UserChecker $checker;

    protected function setUp(): void
    {
        $this->entityManager = $this->createMock(EntityManagerInterface::class);
        $this->checker = new UserChecker($this->entityManager);
    }

    public function testCheckPreAuthWithNonUserReturnsEarly(): void
    {
        $nonUser = $this->createMock(UserInterface::class);

        // Should not throw
        $this->checker->checkPreAuth($nonUser);
        $this->assertTrue(true);
    }

    public function testCheckPreAuthWithDeletedUserThrows(): void
    {
        $user = new User();
        $user->setIsDeleted(true);

        $this->expectException(CustomUserMessageAccountStatusException::class);
        $this->expectExceptionMessage('supprimé');

        $this->checker->checkPreAuth($user);
    }

    public function testCheckPreAuthWithPermanentBanThrows(): void
    {
        $user = new User();
        $user->setIsDeleted(false);
        $user->setIsBanned(true);
        $user->setBannedUntil(null);
        $user->setBanReason('spam');

        $this->expectException(CustomUserMessageAccountStatusException::class);
        $this->expectExceptionMessage('définitivement');

        $this->checker->checkPreAuth($user);
    }

    public function testCheckPreAuthWithActiveBanThrows(): void
    {
        $user = new User();
        $user->setIsDeleted(false);
        $user->setIsBanned(true);
        $user->setBannedUntil(new \DateTimeImmutable('+1 week'));
        $user->setBanReason('toxic behavior');

        $this->expectException(CustomUserMessageAccountStatusException::class);
        $this->expectExceptionMessage('banni jusqu');

        $this->checker->checkPreAuth($user);
    }

    public function testCheckPreAuthWithExpiredBanUnbansUser(): void
    {
        $user = new User();
        $user->setIsDeleted(false);
        $user->setIsBanned(true);
        $user->setBannedUntil(new \DateTimeImmutable('-1 day'));
        $user->setBanReason('temp ban');

        $this->entityManager->expects($this->once())->method('persist')->with($user);
        $this->entityManager->expects($this->once())->method('flush');

        $this->checker->checkPreAuth($user);

        $this->assertFalse($user->isBanned());
        $this->assertNull($user->getBanReason());
        $this->assertNull($user->getBannedUntil());
    }

    public function testCheckPreAuthWithNormalUserPasses(): void
    {
        $user = new User();
        $user->setIsDeleted(false);
        $user->setIsBanned(false);

        // Should not throw
        $this->checker->checkPreAuth($user);
        $this->assertTrue(true);
    }

    public function testCheckPostAuthSetsLastLogin(): void
    {
        $user = new User();

        $this->entityManager->expects($this->once())->method('persist')->with($user);
        $this->entityManager->expects($this->once())->method('flush');

        $before = new \DateTimeImmutable();
        $this->checker->checkPostAuth($user);
        $after = new \DateTimeImmutable();

        $lastLogin = $user->getLastLoginAt();
        $this->assertInstanceOf(\DateTimeImmutable::class, $lastLogin);
        $this->assertGreaterThanOrEqual($before, $lastLogin);
        $this->assertLessThanOrEqual($after, $lastLogin);
    }
}
