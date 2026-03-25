<?php

namespace App\Tests\Unit\State\Processor;

use ApiPlatform\Metadata\Operation;
use App\Entity\Patchnote;
use App\Entity\User;
use App\State\Processor\PatchnoteProcessor;
use Doctrine\ORM\EntityManagerInterface;
use PHPUnit\Framework\TestCase;
use Symfony\Bundle\SecurityBundle\Security;

class PatchnoteProcessorTest extends TestCase
{
    private EntityManagerInterface $entityManager;
    private Security $security;
    private PatchnoteProcessor $processor;
    private Operation $operation;

    protected function setUp(): void
    {
        $this->entityManager = $this->createMock(EntityManagerInterface::class);
        $this->security = $this->createMock(Security::class);
        $this->operation = $this->createMock(Operation::class);

        $user = new User();
        $user->setUsername('testuser');
        $this->security->method('getUser')->willReturn($user);

        $this->processor = new PatchnoteProcessor($this->entityManager, $this->security);
    }

    public function testProcessSetsCreatedByAndTimestamp(): void
    {
        $patchnote = new Patchnote();
        $patchnote->setTitle('Test Patchnote');

        $this->entityManager->expects($this->once())->method('persist');
        $this->entityManager->expects($this->once())->method('flush');

        $result = $this->processor->process($patchnote, $this->operation);

        $this->assertInstanceOf(User::class, $result->getCreatedBy());
        $this->assertEquals('testuser', $result->getCreatedBy()->getUsername());
        $this->assertInstanceOf(\DateTimeImmutable::class, $result->getCreatedAt());
    }

    public function testProcessPersistsPatchnote(): void
    {
        $patchnote = new Patchnote();
        $patchnote->setTitle('Test');

        $this->entityManager->expects($this->once())->method('persist')->with($patchnote);
        $this->entityManager->expects($this->once())->method('flush');

        $this->processor->process($patchnote, $this->operation);
    }
}
