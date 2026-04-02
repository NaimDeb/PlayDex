<?php

namespace App\Tests\Unit\State\Processor;

use ApiPlatform\Metadata\Operation;
use App\Entity\User;
use App\State\Processor\UserUpdateProcessor;
use Doctrine\ORM\EntityManagerInterface;
use PHPUnit\Framework\TestCase;
use Symfony\Bundle\SecurityBundle\Security;
use Symfony\Component\HttpKernel\Exception\BadRequestHttpException;
use Symfony\Component\PasswordHasher\Hasher\UserPasswordHasherInterface;

class UserUpdateProcessorTest extends TestCase
{
    private EntityManagerInterface $entityManager;
    private Security $security;
    private UserPasswordHasherInterface $passwordHasher;
    private UserUpdateProcessor $processor;
    private Operation $operation;
    private User $currentUser;

    protected function setUp(): void
    {
        $this->entityManager = $this->createMock(EntityManagerInterface::class);
        $this->security = $this->createMock(Security::class);
        $this->passwordHasher = $this->createMock(UserPasswordHasherInterface::class);
        $this->operation = $this->createMock(Operation::class);

        $this->currentUser = new User();
        $this->currentUser->setUsername('original');
        $this->currentUser->setEmail('original@test.com');
        $this->currentUser->setPassword('hashed_old');

        $this->security->method('getUser')->willReturn($this->currentUser);
        $this->entityManager->method('refresh');

        $this->processor = new UserUpdateProcessor(
            $this->entityManager,
            $this->security,
            $this->passwordHasher
        );
    }

    public function testProcessUpdatesUsername(): void
    {
        $data = new User();
        $data->setUsername('newname');

        $result = $this->processor->process($data, $this->operation);

        $this->assertEquals('newname', $result->getUsername());
    }

    public function testProcessUpdatesEmail(): void
    {
        $data = new User();
        $data->setEmail('new@test.com');

        $result = $this->processor->process($data, $this->operation);

        $this->assertEquals('new@test.com', $result->getEmail());
    }

    public function testProcessUpdatesPasswordWithValidCurrentPassword(): void
    {
        $data = new User();
        $data->setNewPassword('newpassword');
        $data->setCurrentPassword('oldpassword');

        $this->passwordHasher->method('isPasswordValid')
            ->with($this->currentUser, 'oldpassword')
            ->willReturn(true);

        $this->passwordHasher->method('hashPassword')
            ->with($this->currentUser, 'newpassword')
            ->willReturn('hashed_new');

        $result = $this->processor->process($data, $this->operation);

        $this->assertEquals('hashed_new', $result->getPassword());
    }

    public function testProcessThrowsWhenCurrentPasswordMissing(): void
    {
        $data = new User();
        $data->setNewPassword('newpassword');

        $this->expectException(BadRequestHttpException::class);
        $this->expectExceptionMessage('mot de passe actuel est requis');

        $this->processor->process($data, $this->operation);
    }

    public function testProcessThrowsWhenCurrentPasswordInvalid(): void
    {
        $data = new User();
        $data->setNewPassword('newpassword');
        $data->setCurrentPassword('wrongpassword');

        $this->passwordHasher->method('isPasswordValid')->willReturn(false);

        $this->expectException(BadRequestHttpException::class);
        $this->expectExceptionMessage('incorrect');

        $this->processor->process($data, $this->operation);
    }

    public function testProcessPersistsCurrentUser(): void
    {
        $data = new User();
        $data->setUsername('updated');

        $this->entityManager->expects($this->once())->method('persist');
        $this->entityManager->expects($this->once())->method('flush');

        $this->processor->process($data, $this->operation);
    }
}
