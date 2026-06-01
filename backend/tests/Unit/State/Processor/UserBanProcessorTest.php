<?php

namespace App\Tests\Unit\State\Processor;

use ApiPlatform\Metadata\Operation;
use App\Entity\User;
use App\State\Processor\UserBanProcessor;
use Doctrine\ORM\EntityManagerInterface;
use Doctrine\ORM\EntityRepository;
use PHPUnit\Framework\TestCase;
use Symfony\Bundle\SecurityBundle\Security;

class UserBanProcessorTest extends TestCase
{
    private EntityManagerInterface $entityManager;
    private Security $security;
    private EntityRepository $userRepository;
    private UserBanProcessor $processor;
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

        $this->processor = new UserBanProcessor($this->entityManager, $this->security);
    }

    public function testProcessBansUserWithReasonAndDuration(): void
    {
        $userToBan = new User();
        $userToBan->setUsername('target');

        $this->userRepository->method('find')->with(1)->willReturn($userToBan);

        $data = new User();
        $data->setBanReason('spam');
        $banUntil = new \DateTimeImmutable('+1 week');
        $data->setBannedUntil($banUntil);

        $this->entityManager->expects($this->once())->method('persist');
        $this->entityManager->expects($this->once())->method('flush');

        $result = $this->processor->process($data, $this->operation, ['id' => 1]);

        $this->assertTrue($result->isBanned());
        $this->assertEquals('spam', $result->getBanReason());
        $this->assertEquals($banUntil, $result->getBannedUntil());
    }

    public function testProcessBansUserPermanently(): void
    {
        $userToBan = new User();
        $this->userRepository->method('find')->with(1)->willReturn($userToBan);

        $data = new User();
        $data->setBanReason('permanent ban');

        $result = $this->processor->process($data, $this->operation, ['id' => 1]);

        $this->assertTrue($result->isBanned());
        $this->assertEquals('permanent ban', $result->getBanReason());
        $this->assertNull($result->getBannedUntil());
    }

    public function testProcessThrowsWhenNoUserId(): void
    {
        $data = new User();
        $data->setBanReason('test');

        $this->expectException(\InvalidArgumentException::class);
        $this->expectExceptionMessage('User ID is required');

        $this->processor->process($data, $this->operation, []);
    }

    public function testProcessThrowsWhenUserNotFound(): void
    {
        $this->userRepository->method('find')->willReturn(null);

        $data = new User();
        $data->setBanReason('test');

        $this->expectException(\InvalidArgumentException::class);
        $this->expectExceptionMessage('User not found');

        $this->processor->process($data, $this->operation, ['id' => 999]);
    }

    public function testProcessThrowsWhenNoBanReason(): void
    {
        $userToBan = new User();
        $this->userRepository->method('find')->with(1)->willReturn($userToBan);

        $data = new User();
        // No ban reason set

        $this->expectException(\InvalidArgumentException::class);
        $this->expectExceptionMessage('Ban reason is required');

        $this->processor->process($data, $this->operation, ['id' => 1]);
    }

    public function testProcessPersistsUserToBan(): void
    {
        $userToBan = new User();
        $this->userRepository->method('find')->with(1)->willReturn($userToBan);

        $data = new User();
        $data->setBanReason('test reason');

        $this->entityManager->expects($this->once())->method('persist')->with($userToBan);
        $this->entityManager->expects($this->once())->method('flush');

        $this->processor->process($data, $this->operation, ['id' => 1]);
    }
}
