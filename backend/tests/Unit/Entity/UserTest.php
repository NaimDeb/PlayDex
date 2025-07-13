<?php

namespace App\Tests\Unit\Entity;

use App\Entity\User;
use PHPUnit\Framework\TestCase;

class UserTest extends TestCase
{
    private User $user;

    protected function setUp(): void
    {
        $this->user = new User();
    }

    public function testUserCreation(): void
    {
        $this->assertInstanceOf(User::class, $this->user);
        $this->assertNull($this->user->getId());
    }

    public function testSetAndGetEmail(): void
    {
        $email = 'test@example.com';
        $this->user->setEmail($email);

        $this->assertEquals($email, $this->user->getEmail());
    }

    public function testSetAndGetUsername(): void
    {
        $username = 'testuser';
        $this->user->setUsername($username);

        $this->assertEquals($username, $this->user->getUsername());
    }

    public function testSetAndGetPassword(): void
    {
        $password = 'hashedpassword';
        $this->user->setPassword($password);

        $this->assertEquals($password, $this->user->getPassword());
    }

    public function testDefaultRoles(): void
    {
        $roles = $this->user->getRoles();

        $this->assertContains('ROLE_USER', $roles);
        $this->assertCount(1, $roles);
    }

    public function testSetRoles(): void
    {
        $roles = ['ROLE_USER', 'ROLE_ADMIN'];
        $this->user->setRoles($roles);

        $this->assertEquals($roles, $this->user->getRoles());
    }

    public function testUserIdentifier(): void
    {
        $email = 'test@example.com';
        $this->user->setEmail($email);

        $this->assertEquals($email, $this->user->getUserIdentifier());
    }

    public function testBanFunctionality(): void
    {
        $this->assertFalse($this->user->isBanned());

        $this->user->setIsBanned(true);
        $this->assertTrue($this->user->isBanned());

        $banDate = new \DateTimeImmutable('+1 week');
        $this->user->setBannedUntil($banDate);
        $this->assertEquals($banDate, $this->user->getBannedUntil());
    }

    public function testSetAndGetReputation(): void
    {
        $reputation = 100;
        $this->user->setReputation($reputation);

        $this->assertEquals($reputation, $this->user->getReputation());
    }

    public function testCreatedAtIsSetOnCreation(): void
    {
        $this->user->setCreatedAt(new \DateTimeImmutable());

        $this->assertInstanceOf(\DateTimeImmutable::class, $this->user->getCreatedAt());
    }
}
