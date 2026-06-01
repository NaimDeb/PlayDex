<?php

namespace App\Tests\Unit\State\Processor;

use ApiPlatform\Metadata\Operation;
use App\Entity\User;
use App\State\Processor\UserProcessor;
use Doctrine\ORM\EntityManagerInterface;
use PHPUnit\Framework\TestCase;
use Symfony\Bundle\SecurityBundle\Security;
use Symfony\Component\PasswordHasher\Hasher\UserPasswordHasherInterface;

class UserProcessorTest extends TestCase
{
    private EntityManagerInterface $entityManager;
    private Security $security;
    private UserPasswordHasherInterface $passwordHasher;
    private UserProcessor $processor;
    private Operation $operation;

    protected function setUp(): void
    {
        $this->entityManager = $this->createMock(EntityManagerInterface::class);
        $this->security = $this->createMock(Security::class);
        $this->passwordHasher = $this->createMock(UserPasswordHasherInterface::class);
        $this->operation = $this->createMock(Operation::class);

        $this->processor = new UserProcessor(
            $this->entityManager,
            $this->security,
            $this->passwordHasher
        );
    }

    public function testProcessHashesPasswordAndSetsDefaults(): void
    {
        $user = new User();
        $user->setPlainPassword('testpassword');

        $this->passwordHasher->expects($this->once())
            ->method('hashPassword')
            ->with($user, 'testpassword')
            ->willReturn('hashed_password');

        $this->entityManager->expects($this->once())->method('persist');
        $this->entityManager->expects($this->once())->method('flush');

        $result = $this->processor->process($user, $this->operation);

        $this->assertEquals('hashed_password', $result->getPassword());
        $this->assertEquals(['ROLE_USER'], $result->getRoles());
        $this->assertEquals(0, $result->getReputation());
        $this->assertInstanceOf(\DateTimeImmutable::class, $result->getCreatedAt());
    }

    public function testProcessWithoutPlainPasswordSkipsHashing(): void
    {
        $user = new User();
        $user->setPassword('existing_hash');

        $this->passwordHasher->expects($this->never())->method('hashPassword');

        $result = $this->processor->process($user, $this->operation);

        $this->assertEquals('existing_hash', $result->getPassword());
        $this->assertEquals(['ROLE_USER'], $result->getRoles());
        $this->assertEquals(0, $result->getReputation());
    }

    public function testProcessPersistsEntity(): void
    {
        $user = new User();
        $user->setPlainPassword('test');

        $this->passwordHasher->method('hashPassword')->willReturn('hashed');
        $this->entityManager->expects($this->once())->method('persist')->with($user);
        $this->entityManager->expects($this->once())->method('flush');

        $this->processor->process($user, $this->operation);
    }
}
