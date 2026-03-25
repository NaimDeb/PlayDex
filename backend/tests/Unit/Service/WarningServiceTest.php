<?php

namespace App\Tests\Unit\Service;

use App\Entity\User;
use App\Entity\Warning;
use App\Service\WarningService;
use Doctrine\ORM\EntityManagerInterface;
use Doctrine\ORM\EntityRepository;
use PHPUnit\Framework\TestCase;

class WarningServiceTest extends TestCase
{
    private EntityManagerInterface $entityManager;
    private EntityRepository $warningRepository;
    private WarningService $service;

    protected function setUp(): void
    {
        $this->entityManager = $this->createMock(EntityManagerInterface::class);
        $this->warningRepository = $this->createMock(EntityRepository::class);

        $this->entityManager
            ->method('getRepository')
            ->with(Warning::class)
            ->willReturn($this->warningRepository);

        $this->service = new WarningService($this->entityManager);
    }

    public function testWarnCreatesWarningAndPersists(): void
    {
        $user = new User();
        $user->setUsername('targetuser');

        $admin = new User();
        $admin->setUsername('adminuser');

        $this->entityManager->expects($this->once())->method('persist')
            ->with($this->isInstanceOf(Warning::class));
        $this->entityManager->expects($this->once())->method('flush');

        $warning = $this->service->warn($user, $admin, 'spam');

        $this->assertInstanceOf(Warning::class, $warning);
        $this->assertSame($user, $warning->getReportedUserId());
        $this->assertSame($admin, $warning->getWarnedBy());
    }

    public function testWarnUserForDeletionWithAdminCallsWarn(): void
    {
        $target = new User();
        $admin = new User();

        $this->entityManager->expects($this->once())->method('persist');
        $this->entityManager->expects($this->once())->method('flush');

        $this->service->warnUserForDeletion($target, $admin);
    }

    public function testWarnUserForDeletionWithNullAdminDoesNothing(): void
    {
        $target = new User();

        $this->entityManager->expects($this->never())->method('persist');
        $this->entityManager->expects($this->never())->method('flush');

        $this->service->warnUserForDeletion($target, null);
    }

    public function testGetWarningCountReturnsRepositoryCount(): void
    {
        $user = new User();

        $this->warningRepository->expects($this->once())
            ->method('count')
            ->with(['reportedUserId' => $user])
            ->willReturn(5);

        $this->assertEquals(5, $this->service->getWarningCount($user));
    }

    public function testShouldBeBannedReturnsTrueAtThreshold(): void
    {
        $user = new User();
        $this->warningRepository->method('count')->willReturn(3);

        $this->assertTrue($this->service->shouldBeBanned($user));
    }

    public function testShouldBeBannedReturnsFalseBelowThreshold(): void
    {
        $user = new User();
        $this->warningRepository->method('count')->willReturn(2);

        $this->assertFalse($this->service->shouldBeBanned($user));
    }

    public function testShouldBeBannedReturnsTrueAboveThreshold(): void
    {
        $user = new User();
        $this->warningRepository->method('count')->willReturn(10);

        $this->assertTrue($this->service->shouldBeBanned($user));
    }

    public function testGetBanThresholdReturnsThree(): void
    {
        $this->assertEquals(3, $this->service->getBanThreshold());
    }
}
