<?php

namespace App\Tests\Unit\State\Processor;

use ApiPlatform\Metadata\Operation;
use App\Entity\Report;
use App\State\Processor\ReportDeleteProcessor;
use Doctrine\ORM\EntityManagerInterface;
use PHPUnit\Framework\TestCase;
use Symfony\Component\HttpKernel\Exception\BadRequestHttpException;

class ReportDeleteProcessorTest extends TestCase
{
    private EntityManagerInterface $entityManager;
    private ReportDeleteProcessor $processor;
    private Operation $operation;

    protected function setUp(): void
    {
        $this->entityManager = $this->createMock(EntityManagerInterface::class);
        $this->operation = $this->createMock(Operation::class);
        $this->processor = new ReportDeleteProcessor($this->entityManager);
    }

    public function testProcessSoftDeletesReport(): void
    {
        $report = new Report();

        $this->entityManager->expects($this->once())->method('persist');
        $this->entityManager->expects($this->once())->method('flush');

        $this->processor->process($report, $this->operation);

        $this->assertTrue($report->isDeleted());
    }

    public function testProcessThrowsWhenAlreadyDeleted(): void
    {
        $report = new Report();
        $report->setIsDeleted(true);

        $this->expectException(BadRequestHttpException::class);
        $this->expectExceptionMessage('already been deleted');

        $this->processor->process($report, $this->operation);
    }

    public function testProcessWithNonReportReturnsEarly(): void
    {
        $data = new \stdClass();

        $this->entityManager->expects($this->never())->method('persist');

        $this->processor->process($data, $this->operation);
        $this->assertTrue(true);
    }
}
