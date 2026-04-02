<?php

namespace App\Tests\Unit\State\Processor;

use ApiPlatform\Metadata\Operation;
use App\Entity\User;
use App\State\Processor\UserDeleteProcessor;
use Doctrine\ORM\EntityManagerInterface;
use PHPUnit\Framework\TestCase;
use Symfony\Component\HttpKernel\Exception\BadRequestHttpException;

class UserDeleteProcessorTest extends TestCase
{
    private EntityManagerInterface $entityManager;
    private UserDeleteProcessor $processor;
    private Operation $operation;

    protected function setUp(): void
    {
        $this->entityManager = $this->createMock(EntityManagerInterface::class);
        $this->operation = $this->createMock(Operation::class);
        $this->processor = new UserDeleteProcessor($this->entityManager);
    }

    public function testProcessSoftDeletesUser(): void
    {
        $user = new User();
        $user->setIsDeleted(false);

        $this->entityManager->expects($this->once())->method('persist');
        $this->entityManager->expects($this->once())->method('flush');

        $this->processor->process($user, $this->operation);

        $this->assertTrue($user->isDeleted());
    }

    public function testProcessThrowsWhenAlreadyDeleted(): void
    {
        $user = new User();
        $user->setIsDeleted(true);

        $this->expectException(BadRequestHttpException::class);
        $this->expectExceptionMessage('already been deleted');

        $this->processor->process($user, $this->operation);
    }

    public function testProcessWithNonUserReturnsEarly(): void
    {
        $data = new \stdClass();

        $this->entityManager->expects($this->never())->method('persist');

        $this->processor->process($data, $this->operation);
        $this->assertTrue(true);
    }
}
