<?php

namespace App\Tests\Unit\State\Processor;

use ApiPlatform\Metadata\Operation;
use App\Entity\User;
use App\State\Processor\UserUnbanProcessor;
use Doctrine\ORM\EntityManagerInterface;
use Doctrine\ORM\EntityRepository;
use PHPUnit\Framework\TestCase;
use Symfony\Bundle\SecurityBundle\Security;

class UserUnbanProcessorTest extends TestCase
{
    private EntityManagerInterface $entityManager;
    private Security $security;
    private EntityRepository $userRepository;
    private UserUnbanProcessor $processor;
    private Operation $operation;

    protected function setUp(): void
    {
        $this->entityManager = $this->createMock(EntityManagerInterface::class);
        $this->security = $this->createMock(Security::class);
        $this->userRepository = $this->createMock(EntityRepository::class);
        $this->operation = $this->createMock(Operation::class);

        $this->entityManager->method('getRepository')
            ->with(User::class)
            ->willReturn($this->userRepository);

        $this->processor = new UserUnbanProcessor($this->entityManager, $this->security);
    }

    public function testProcessUnbansUser(): void
    {
        $user = new User();
        $user->setIsBanned(true);
        $user->setBanReason('spam');
        $user->setBannedUntil(new \DateTimeImmutable('+1 week'));

        $this->userRepository->method('find')->with(1)->willReturn($user);
        $this->entityManager->expects($this->once())->method('persist');
        $this->entityManager->expects($this->once())->method('flush');

        $result = $this->processor->process(new User(), $this->operation, ['id' => 1]);

        $this->assertFalse($result->isBanned());
        $this->assertNull($result->getBanReason());
        $this->assertNull($result->getBannedUntil());
    }

    public function testProcessThrowsWhenNoUserId(): void
    {
        $this->expectException(\InvalidArgumentException::class);
        $this->expectExceptionMessage('User ID is required');

        $this->processor->process(new User(), $this->operation, []);
    }

    public function testProcessThrowsWhenUserNotFound(): void
    {
        $this->userRepository->method('find')->willReturn(null);

        $this->expectException(\InvalidArgumentException::class);
        $this->expectExceptionMessage('User not found');

        $this->processor->process(new User(), $this->operation, ['id' => 999]);
    }
}
