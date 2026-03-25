<?php

namespace App\Tests\Unit\State\Processor;

use ApiPlatform\Metadata\Operation;
use App\Entity\Modification;
use App\Service\SoftDeleteService;
use App\State\Processor\ModificationDeleteProcessor;
use Doctrine\ORM\EntityManagerInterface;
use PHPUnit\Framework\TestCase;
use Symfony\Bundle\SecurityBundle\Security;
use Symfony\Component\HttpKernel\Exception\BadRequestHttpException;

class ModificationDeleteProcessorTest extends TestCase
{
    private EntityManagerInterface $entityManager;
    private SoftDeleteService $softDeleteService;
    private Security $security;
    private ModificationDeleteProcessor $processor;
    private Operation $operation;

    protected function setUp(): void
    {
        $this->entityManager = $this->createMock(EntityManagerInterface::class);
        $this->softDeleteService = $this->createMock(SoftDeleteService::class);
        $this->security = $this->createMock(Security::class);
        $this->operation = $this->createMock(Operation::class);

        $this->processor = new ModificationDeleteProcessor(
            $this->entityManager,
            $this->softDeleteService,
            $this->security
        );
    }

    public function testProcessSoftDeletesModification(): void
    {
        $modification = new Modification();

        $this->softDeleteService->expects($this->once())
            ->method('softDeleteWithReports')
            ->with($modification, 'Modification', 'user');

        $this->processor->process($modification, $this->operation);
    }

    public function testProcessThrowsWhenAlreadyDeleted(): void
    {
        $modification = new Modification();
        $modification->setIsDeleted(true);

        $this->expectException(BadRequestHttpException::class);
        $this->expectExceptionMessage('already been deleted');

        $this->processor->process($modification, $this->operation);
    }

    public function testProcessWithNonModificationReturnsEarly(): void
    {
        $this->softDeleteService->expects($this->never())->method('softDeleteWithReports');

        $this->processor->process(new \stdClass(), $this->operation);
        $this->assertTrue(true);
    }
}
