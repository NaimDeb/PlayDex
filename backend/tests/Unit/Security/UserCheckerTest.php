<?php

declare(strict_types=1);

namespace App\Tests\Unit\Security;

use App\Entity\User;
use App\Security\UserChecker;
use Doctrine\ORM\EntityManagerInterface;
use PHPUnit\Framework\TestCase;
use Symfony\Component\Security\Core\Exception\CustomUserMessageAccountStatusException;
use Symfony\Component\Security\Core\User\UserInterface;

/**
 * Tests de la règle de sécurité métier : qui peut se (ré)authentifier.
 *
 * UserChecker::checkPreAuth est appelé au login : il doit bloquer les comptes
 * supprimés et bannis, et lever automatiquement un ban temporaire expiré.
 */
class UserCheckerTest extends TestCase
{
    private function checker(): UserChecker
    {
        return new UserChecker($this->createMock(EntityManagerInterface::class));
    }

    public function testDeletedUserCannotAuthenticate(): void
    {
        $user = (new User())->setEmail('deleted@test.com');
        $user->setIsDeleted(true);

        $this->expectException(CustomUserMessageAccountStatusException::class);
        $this->checker()->checkPreAuth($user);
    }

    public function testPermanentlyBannedUserCannotAuthenticate(): void
    {
        $user = (new User())->setEmail('banned@test.com');
        $user->setIsBanned(true);
        $user->setBanReason('Spam');
        $user->setBannedUntil(null); // ban permanent

        $this->expectException(CustomUserMessageAccountStatusException::class);
        $this->checker()->checkPreAuth($user);
    }

    public function testTemporarilyBannedUserCannotAuthenticateWhileBanActive(): void
    {
        $user = (new User())->setEmail('temp@test.com');
        $user->setIsBanned(true);
        $user->setBanReason('Flood');
        $user->setBannedUntil(new \DateTimeImmutable('+7 days')); // encore actif

        $this->expectException(CustomUserMessageAccountStatusException::class);
        $this->checker()->checkPreAuth($user);
    }

    public function testExpiredTemporaryBanIsLiftedAutomatically(): void
    {
        $user = (new User())->setEmail('expired@test.com');
        $user->setIsBanned(true);
        $user->setBanReason('Ancien ban');
        $user->setBannedUntil(new \DateTimeImmutable('-1 day')); // expiré

        // L'EM doit persister la levée de ban.
        $em = $this->createMock(EntityManagerInterface::class);
        $em->expects($this->once())->method('persist')->with($user);
        $em->expects($this->once())->method('flush');

        $checker = new UserChecker($em);
        $checker->checkPreAuth($user); // ne doit PAS lever d'exception

        $this->assertFalse($user->isBanned());
        $this->assertNull($user->getBanReason());
        $this->assertNull($user->getBannedUntil());
    }

    public function testValidUserPassesPreAuth(): void
    {
        $user = (new User())->setEmail('ok@test.com');

        $this->expectNotToPerformAssertions();
        $this->checker()->checkPreAuth($user); // aucune exception
    }

    public function testNonAppUserIsIgnored(): void
    {
        $this->expectNotToPerformAssertions();
        $this->checker()->checkPreAuth($this->createMock(UserInterface::class));
    }

    public function testPostAuthUpdatesLastLogin(): void
    {
        $user = (new User())->setEmail('login@test.com');
        $this->assertNull($user->getLastLoginAt());

        $em = $this->createMock(EntityManagerInterface::class);
        $em->expects($this->once())->method('persist')->with($user);
        $em->expects($this->once())->method('flush');

        (new UserChecker($em))->checkPostAuth($user);

        $this->assertInstanceOf(\DateTimeImmutable::class, $user->getLastLoginAt());
    }
}
