<?php

namespace App\Tests\Unit\State\Processor;

use ApiPlatform\Metadata\Operation;
use App\Entity\Modification;
use App\Entity\User;
use App\State\Processor\ModificationProcessor;
use Doctrine\ORM\EntityManagerInterface;
use PHPUnit\Framework\TestCase;
use Symfony\Bundle\SecurityBundle\Security;

class ModificationProcessorTest extends TestCase
{
    private EntityManagerInterface $entityManager;
    private Security $security;
    private ModificationProcessor $processor;
    private Operation $operation;

    protected function setUp(): void
    {
        $this->entityManager = $this->createMock(EntityManagerInterface::class);
        $this->security = $this->createMock(Security::class);
        $this->operation = $this->createMock(Operation::class);

        $user = new User();
        $user->setUsername('editor');
        $this->security->method('getUser')->willReturn($user);

        $this->processor = new ModificationProcessor($this->entityManager, $this->security);
    }

    public function testProcessSetsUserAndTimestamp(): void
    {
        $modification = new Modification();

        $this->entityManager->expects($this->once())->method('persist');
        $this->entityManager->expects($this->once())->method('flush');

        $result = $this->processor->process($modification, $this->operation);

        $this->assertInstanceOf(User::class, $result->getUser());
        $this->assertEquals('editor', $result->getUser()->getUsername());
        $this->assertInstanceOf(\DateTimeImmutable::class, $result->getCreatedAt());
    }

    public function testProcessPersistsModification(): void
    {
        $modification = new Modification();

        $this->entityManager->expects($this->once())->method('persist')->with($modification);
        $this->entityManager->expects($this->once())->method('flush');

        $this->processor->process($modification, $this->operation);
    }
}
