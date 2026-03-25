<?php

namespace App\Tests\Unit\Service;

use App\Entity\Patchnote;
use App\Entity\Report;
use App\Entity\User;
use App\Service\SoftDeleteService;
use App\Service\WarningService;
use Doctrine\ORM\EntityManagerInterface;
use Doctrine\ORM\EntityRepository;
use PHPUnit\Framework\TestCase;
use Symfony\Bundle\SecurityBundle\Security;

class SoftDeleteServiceTest extends TestCase
{
    private EntityManagerInterface $entityManager;
    private Security $security;
    private WarningService $warningService;
    private EntityRepository $reportRepository;
    private SoftDeleteService $service;

    protected function setUp(): void
    {
        $this->entityManager = $this->createMock(EntityManagerInterface::class);
        $this->security = $this->createMock(Security::class);
        $this->warningService = $this->createMock(WarningService::class);
        $this->reportRepository = $this->createMock(EntityRepository::class);

        $this->entityManager
            ->method('getRepository')
            ->with(Report::class)
            ->willReturn($this->reportRepository);

        $this->service = new SoftDeleteService(
            $this->entityManager,
            $this->security,
            $this->warningService
        );
    }

    public function testSoftDeleteSetsDeletedAndPersists(): void
    {
        $patchnote = $this->createMock(Patchnote::class);
        $patchnote->expects($this->once())->method('setIsDeleted')->with(true);
        $patchnote->method('getId')->willReturn(1);

        $this->reportRepository->method('findBy')->willReturn([]);

        $this->entityManager->expects($this->once())->method('persist')->with($patchnote);
        $this->entityManager->expects($this->once())->method('flush');

        $this->service->softDeleteWithReports($patchnote, 'Patchnote');
    }

    public function testSoftDeleteCascadesReportDeletion(): void
    {
        $patchnote = $this->createMock(Patchnote::class);
        $patchnote->method('getId')->willReturn(1);

        $report1 = new Report();
        $report2 = new Report();

        $this->reportRepository->method('findBy')
            ->willReturn([$report1, $report2]);

        $this->service->softDeleteWithReports($patchnote, 'Patchnote');

        $this->assertTrue($report1->isDeleted());
        $this->assertTrue($report2->isDeleted());
    }

    public function testSoftDeleteWarnsAuthorWhenDifferentFromAdmin(): void
    {
        $author = new User();
        $author->setUsername('author');

        $admin = new User();
        $admin->setUsername('admin');

        $patchnote = $this->createMock(Patchnote::class);
        $patchnote->method('getId')->willReturn(1);
        $patchnote->method('getCreatedBy')->willReturn($author);

        $this->security->method('getUser')->willReturn($admin);
        $this->reportRepository->method('findBy')->willReturn([]);

        $this->warningService->expects($this->once())
            ->method('warnUserForDeletion')
            ->with($author, $admin);

        $this->service->softDeleteWithReports($patchnote, 'Patchnote', 'createdBy');
    }

    public function testSoftDeleteDoesNotWarnWhenAuthorIsSameAsAdmin(): void
    {
        $user = new User();
        $user->setUsername('sameuser');

        $patchnote = $this->createMock(Patchnote::class);
        $patchnote->method('getId')->willReturn(1);
        $patchnote->method('getCreatedBy')->willReturn($user);

        $this->security->method('getUser')->willReturn($user);
        $this->reportRepository->method('findBy')->willReturn([]);

        $this->warningService->expects($this->never())->method('warnUserForDeletion');

        $this->service->softDeleteWithReports($patchnote, 'Patchnote', 'createdBy');
    }

    public function testSoftDeleteDoesNotWarnWhenNoAuthorProperty(): void
    {
        $patchnote = $this->createMock(Patchnote::class);
        $patchnote->method('getId')->willReturn(1);

        $this->reportRepository->method('findBy')->willReturn([]);

        $this->warningService->expects($this->never())->method('warnUserForDeletion');

        $this->service->softDeleteWithReports($patchnote, 'Patchnote');
    }

    public function testSoftDeleteHandlesNonExistentGetter(): void
    {
        $patchnote = $this->createMock(Patchnote::class);
        $patchnote->method('getId')->willReturn(1);
        $patchnote->expects($this->once())->method('setIsDeleted')->with(true);

        $this->reportRepository->method('findBy')->willReturn([]);

        $this->warningService->expects($this->never())->method('warnUserForDeletion');

        // 'nonexistent' => getNonexistent() doesn't exist on mock, should not throw
        $this->service->softDeleteWithReports($patchnote, 'Patchnote', 'nonexistent');
    }

    public function testSoftDeleteRelatedReportsWithNoReports(): void
    {
        $this->reportRepository->method('findBy')->willReturn([]);

        // Should not call persist for reports
        $this->entityManager->expects($this->never())->method('persist');

        $this->service->softDeleteRelatedReports('Patchnote', 1);
    }
}
