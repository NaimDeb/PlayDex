<?php

namespace App\Tests\Unit\State\Provider;

use ApiPlatform\Metadata\Operation;
use App\Entity\User;
use App\State\Provider\MeProvider;
use PHPUnit\Framework\TestCase;
use Symfony\Bundle\SecurityBundle\Security;
use Symfony\Component\Security\Core\Exception\AccessDeniedException;

class MeProviderTest extends TestCase
{
    private Security $security;
    private MeProvider $provider;
    private Operation $operation;

    protected function setUp(): void
    {
        $this->security = $this->createMock(Security::class);
        $this->operation = $this->createMock(Operation::class);
        $this->provider = new MeProvider($this->security);
    }

    public function testProvideReturnsAuthenticatedUser(): void
    {
        $user = new User();
        $user->setUsername('testuser');
        $this->security->method('getUser')->willReturn($user);

        $result = $this->provider->provide($this->operation);

        $this->assertSame($user, $result);
    }

    public function testProvideThrowsWhenNotAuthenticated(): void
    {
        $this->security->method('getUser')->willReturn(null);

        $this->expectException(AccessDeniedException::class);

        $this->provider->provide($this->operation);
    }
}
