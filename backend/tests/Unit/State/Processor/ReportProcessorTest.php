<?php

namespace App\Tests\Unit\State\Processor;

use ApiPlatform\Metadata\Operation;
use App\Entity\Report;
use App\Entity\User;
use App\State\Processor\ReportProcessor;
use Doctrine\ORM\EntityManagerInterface;
use Doctrine\ORM\EntityRepository;
use PHPUnit\Framework\TestCase;
use Symfony\Bundle\SecurityBundle\Security;

class ReportProcessorTest extends TestCase
{
    private EntityManagerInterface $entityManager;
    private Security $security;
    private ReportProcessor $processor;
    private Operation $operation;
    private User $authenticatedUser;

    protected function setUp(): void
    {
        $this->entityManager = $this->createMock(EntityManagerInterface::class);
        $this->security = $this->createMock(Security::class);
        $this->operation = $this->createMock(Operation::class);

        $this->authenticatedUser = new User();
        $this->authenticatedUser->setUsername('reporter');
        $this->security->method('getUser')->willReturn($this->authenticatedUser);

        $this->processor = new ReportProcessor($this->entityManager, $this->security);
    }

    public function testProcessCreatesValidReport(): void
    {
        $report = new Report();
        $report->setReportableEntity('Patchnote');
        $report->setReportableId(1);
        $report->setReason('inappropriate content');

        // Mock patchnote repository
        $patchnoteRepo = $this->createMock(EntityRepository::class);
        $patchnoteRepo->method('find')->with(1)->willReturn(new \App\Entity\Patchnote());

        // Mock report repository (no duplicate)
        $reportRepo = $this->createMock(EntityRepository::class);
        $reportRepo->method('findOneBy')->willReturn(null);

        $this->entityManager->method('getRepository')
            ->willReturnCallback(function (string $class) use ($patchnoteRepo, $reportRepo) {
                if ($class === 'App\\Entity\\Patchnote') {
                    return $patchnoteRepo;
                }
                return $reportRepo;
            });

        $this->entityManager->expects($this->once())->method('persist');
        $this->entityManager->expects($this->once())->method('flush');

        $result = $this->processor->process($report, $this->operation);

        $this->assertSame($this->authenticatedUser, $result->getReportedBy());
        $this->assertInstanceOf(\DateTimeImmutable::class, $result->getReportedAt());
        $this->assertEquals('App\\Entity\\Patchnote', $result->getReportableEntity());
    }

    public function testProcessThrowsWhenEntityClassDoesNotExist(): void
    {
        $report = new Report();
        $report->setReportableEntity('NonExistentEntity');
        $report->setReportableId(1);

        $this->expectException(\InvalidArgumentException::class);
        $this->expectExceptionMessage('does not implement ReportableInterface');

        $this->processor->process($report, $this->operation);
    }

    public function testProcessThrowsWhenEntityNotFound(): void
    {
        $report = new Report();
        $report->setReportableEntity('Patchnote');
        $report->setReportableId(999);

        $patchnoteRepo = $this->createMock(EntityRepository::class);
        $patchnoteRepo->method('find')->with(999)->willReturn(null);

        $this->entityManager->method('getRepository')
            ->willReturn($patchnoteRepo);

        $this->expectException(\InvalidArgumentException::class);
        $this->expectExceptionMessage('does not exist');

        $this->processor->process($report, $this->operation);
    }

    public function testProcessThrowsOnDuplicateReport(): void
    {
        $report = new Report();
        $report->setReportableEntity('Patchnote');
        $report->setReportableId(1);

        $patchnoteRepo = $this->createMock(EntityRepository::class);
        $patchnoteRepo->method('find')->with(1)->willReturn(new \App\Entity\Patchnote());

        $existingReport = new Report();
        $reportRepo = $this->createMock(EntityRepository::class);
        $reportRepo->method('findOneBy')->willReturn($existingReport);

        $this->entityManager->method('getRepository')
            ->willReturnCallback(function (string $class) use ($patchnoteRepo, $reportRepo) {
                if ($class === 'App\\Entity\\Patchnote') {
                    return $patchnoteRepo;
                }
                return $reportRepo;
            });

        $this->expectException(\InvalidArgumentException::class);
        $this->expectExceptionMessage('already reported');

        $this->processor->process($report, $this->operation);
    }

    public function testProcessSetsReportedAtTimestamp(): void
    {
        $report = new Report();
        $report->setReportableEntity('Patchnote');
        $report->setReportableId(1);
        $report->setReason('test');

        $patchnoteRepo = $this->createMock(EntityRepository::class);
        $patchnoteRepo->method('find')->willReturn(new \App\Entity\Patchnote());

        $reportRepo = $this->createMock(EntityRepository::class);
        $reportRepo->method('findOneBy')->willReturn(null);

        $this->entityManager->method('getRepository')
            ->willReturnCallback(function (string $class) use ($patchnoteRepo, $reportRepo) {
                if ($class === 'App\\Entity\\Patchnote') {
                    return $patchnoteRepo;
                }
                return $reportRepo;
            });

        $before = new \DateTimeImmutable();
        $result = $this->processor->process($report, $this->operation);
        $after = new \DateTimeImmutable();

        $this->assertGreaterThanOrEqual($before, $result->getReportedAt());
        $this->assertLessThanOrEqual($after, $result->getReportedAt());
    }
}
