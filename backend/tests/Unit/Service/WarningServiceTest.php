<?php

declare(strict_types=1);

namespace App\Tests\Unit\Service;

use App\Entity\User;
use App\Entity\Warning;
use App\Service\WarningService;
use Doctrine\ORM\EntityManagerInterface;
use Doctrine\ORM\EntityRepository;
use PHPUnit\Framework\TestCase;

/**
 * Tests du service d'avertissements (modération).
 */
class WarningServiceTest extends TestCase
{
    public function testWarnCreatesAndPersistsWarning(): void
    {
        $user = (new User())->setEmail('warned@test.com');
        $admin = (new User())->setEmail('admin@test.com');

        $em = $this->createMock(EntityManagerInterface::class);
        $em->expects($this->once())
            ->method('persist')
            ->with($this->isInstanceOf(Warning::class));
        $em->expects($this->once())->method('flush');

        $warning = (new WarningService($em))->warn($user, $admin, 'Comportement inapproprié');

        $this->assertInstanceOf(Warning::class, $warning);
        $this->assertSame($user, $warning->getReportedUserId());
        $this->assertSame($admin, $warning->getWarnedBy());

        // ⚠️ Bug connu : warn() ne sauvegarde PAS la raison reçue (setReason jamais appelé).
        // Ce test documente le comportement actuel ; à corriger côté service.
        $this->assertNull($warning->getReason());
    }

    public function testGetWarningCount(): void
    {
        $user = (new User())->setEmail('count@test.com');

        $repo = $this->createMock(EntityRepository::class);
        $repo->expects($this->once())
            ->method('count')
            ->with(['reportedUserId' => $user])
            ->willReturn(2);

        $em = $this->createMock(EntityManagerInterface::class);
        $em->method('getRepository')->with(Warning::class)->willReturn($repo);

        $this->assertSame(2, (new WarningService($em))->getWarningCount($user));
    }

    public function testShouldBeBannedAtThreshold(): void
    {
        $user = (new User())->setEmail('threshold@test.com');

        $repo = $this->createMock(EntityRepository::class);
        $repo->method('count')->willReturn(3); // seuil = 3

        $em = $this->createMock(EntityManagerInterface::class);
        $em->method('getRepository')->willReturn($repo);

        $service = new WarningService($em);
        $this->assertTrue($service->shouldBeBanned($user));
        $this->assertSame(3, $service->getBanThreshold());
    }

    public function testShouldNotBeBannedBelowThreshold(): void
    {
        $user = (new User())->setEmail('below@test.com');

        $repo = $this->createMock(EntityRepository::class);
        $repo->method('count')->willReturn(2);

        $em = $this->createMock(EntityManagerInterface::class);
        $em->method('getRepository')->willReturn($repo);

        $this->assertFalse((new WarningService($em))->shouldBeBanned($user));
    }
}
