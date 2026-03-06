<?php

namespace App\Tests\Unit\State\Processor;

use App\Entity\Patchnote;
use App\Entity\User;
use App\State\Processor\DiffMatchPatchProcessor;
use Doctrine\ORM\EntityManagerInterface;
use PHPUnit\Framework\TestCase;
use Symfony\Bundle\SecurityBundle\Security;
use Symfony\Component\HttpFoundation\RequestStack;
use Symfony\Component\HttpKernel\Exception\ConflictHttpException;

class DiffMatchPatchProcessorTest extends TestCase
{
    private EntityManagerInterface $entityManager;
    private Security $security;
    private RequestStack $requestStack;
    private DiffMatchPatchProcessor $processor;

    protected function setUp(): void
    {
        $this->entityManager = $this->createMock(EntityManagerInterface::class);
        $this->security = $this->createMock(Security::class);
        $this->requestStack = $this->createMock(RequestStack::class);
        
        $this->processor = new DiffMatchPatchProcessor(
            $this->entityManager,
            $this->security,
            $this->requestStack
        );
    }

    public function testOptimisticLockingSuccess(): void
    {
        $user = new User();
        $user->setUsername('testuser');

        $oldPatchnote = new Patchnote();
        $oldPatchnote->setVersion(1);
        $oldPatchnote->setContent('Old content');

        $modifiedPatchnote = new Patchnote();
        $modifiedPatchnote->setVersion(1);
        $modifiedPatchnote->setContent('New content');
        $modifiedPatchnote->setTitle('Test');

        $this->security->method('getUser')->willReturn($user);

        $repository = $this->createMock(\App\Repository\PatchnoteRepository::class);
        $repository->method('findOneBy')->willReturn($oldPatchnote);

        $this->entityManager->method('getRepository')->willReturn($repository);
        $this->entityManager->expects($this->once())->method('flush');

        $this->processor->process($modifiedPatchnote, $this->createMock(\ApiPlatform\Metadata\Operation::class));

        $this->assertEquals(2, $oldPatchnote->getVersion());
    }

    public function testOptimisticLockingConflict(): void
    {
        $user = new User();
        $user->setUsername('testuser');

        $oldPatchnote = new Patchnote();
        $oldPatchnote->setVersion(2);
        $oldPatchnote->setContent('Old content');

        $modifiedPatchnote = new Patchnote();
        $modifiedPatchnote->setVersion(1);
        $modifiedPatchnote->setContent('New content');

        $this->security->method('getUser')->willReturn($user);

        $repository = $this->createMock(\App\Repository\PatchnoteRepository::class);
        $repository->method('findOneBy')->willReturn($oldPatchnote);

        $this->entityManager->method('getRepository')->willReturn($repository);

        $this->expectException(ConflictHttpException::class);
        $this->expectExceptionMessage('La patchnote a été modifiée par quelqu\'un d\'autre.');

        $this->processor->process($modifiedPatchnote, $this->createMock(\ApiPlatform\Metadata\Operation::class));
    }
}
