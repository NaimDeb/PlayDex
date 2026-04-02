<?php

namespace App\Tests\Unit\State\Processor;

use ApiPlatform\Metadata\Operation;
use App\Entity\Modification;
use App\Entity\Patchnote;
use App\Service\SoftDeleteService;
use App\State\Processor\PatchnoteDeleteProcessor;
use Doctrine\Common\Collections\ArrayCollection;
use Doctrine\ORM\EntityManagerInterface;
use PHPUnit\Framework\TestCase;
use Symfony\Bundle\SecurityBundle\Security;
use Symfony\Component\HttpKernel\Exception\BadRequestHttpException;

class PatchnoteDeleteProcessorTest extends TestCase
{
    private EntityManagerInterface $entityManager;
    private SoftDeleteService $softDeleteService;
    private Security $security;
    private PatchnoteDeleteProcessor $processor;
    private Operation $operation;

    protected function setUp(): void
    {
        $this->entityManager = $this->createMock(EntityManagerInterface::class);
        $this->softDeleteService = $this->createMock(SoftDeleteService::class);
        $this->security = $this->createMock(Security::class);
        $this->operation = $this->createMock(Operation::class);

        $this->processor = new PatchnoteDeleteProcessor(
            $this->entityManager,
            $this->softDeleteService,
            $this->security
        );
    }

    public function testProcessSoftDeletesPatchnoteAndModifications(): void
    {
        $mod1 = $this->createMock(Modification::class);
        $mod1->expects($this->once())->method('setIsDeleted')->with(true);
        $mod1->method('getId')->willReturn(10);

        $mod2 = $this->createMock(Modification::class);
        $mod2->expects($this->once())->method('setIsDeleted')->with(true);
        $mod2->method('getId')->willReturn(20);

        $patchnote = $this->createMock(Patchnote::class);
        $patchnote->method('isDeleted')->willReturn(false);
        $patchnote->method('getModification')->willReturn(new ArrayCollection([$mod1, $mod2]));

        $this->softDeleteService->expects($this->exactly(2))
            ->method('softDeleteRelatedReports')
            ->willReturnCallback(function (string $entity, int $id) {
                $this->assertEquals('Modification', $entity);
                $this->assertContains($id, [10, 20]);
            });

        $this->softDeleteService->expects($this->once())
            ->method('softDeleteWithReports')
            ->with($patchnote, 'Patchnote', 'createdBy');

        $this->processor->process($patchnote, $this->operation);
    }

    public function testProcessThrowsWhenAlreadyDeleted(): void
    {
        $patchnote = $this->createMock(Patchnote::class);
        $patchnote->method('isDeleted')->willReturn(true);

        $this->expectException(BadRequestHttpException::class);
        $this->expectExceptionMessage('already been deleted');

        $this->processor->process($patchnote, $this->operation);
    }

    public function testProcessWithNonPatchnoteReturnsEarly(): void
    {
        $this->softDeleteService->expects($this->never())->method('softDeleteWithReports');

        $this->processor->process(new \stdClass(), $this->operation);
        $this->assertTrue(true);
    }
}
