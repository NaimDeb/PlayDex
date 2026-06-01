<?php

namespace App\Tests\Unit\State\Provider;

use ApiPlatform\Metadata\CollectionOperationInterface;
use ApiPlatform\Metadata\Delete;
use ApiPlatform\Metadata\Operation;
use App\Entity\FollowedGames;
use App\Entity\Game;
use App\Entity\User;
use App\State\Provider\FollowedGamesProvider;
use Doctrine\ORM\EntityManagerInterface;
use Doctrine\ORM\EntityRepository;
use PHPUnit\Framework\TestCase;
use Symfony\Bundle\SecurityBundle\Security;
use Symfony\Component\HttpKernel\Exception\BadRequestHttpException;
use Symfony\Component\HttpKernel\Exception\NotFoundHttpException;

class FollowedGamesProviderTest extends TestCase
{
    private EntityManagerInterface $entityManager;
    private Security $security;
    private EntityRepository $gameRepository;
    private EntityRepository $followedGamesRepository;
    private FollowedGamesProvider $provider;
    private User $user;

    protected function setUp(): void
    {
        $this->entityManager = $this->createMock(EntityManagerInterface::class);
        $this->security = $this->createMock(Security::class);
        $this->gameRepository = $this->createMock(EntityRepository::class);
        $this->followedGamesRepository = $this->createMock(EntityRepository::class);

        $this->user = new User();
        $this->user->setUsername('gamer');
        $this->security->method('getUser')->willReturn($this->user);

        $this->entityManager->method('getRepository')
            ->willReturnCallback(function (string $class) {
                return match ($class) {
                    Game::class => $this->gameRepository,
                    FollowedGames::class => $this->followedGamesRepository,
                };
            });

        $this->provider = new FollowedGamesProvider($this->entityManager, $this->security);
    }

    public function testProvideReturnsFollowedGamesForCollection(): void
    {
        $fg1 = new FollowedGames();
        $fg2 = new FollowedGames();

        $this->followedGamesRepository->method('findBy')
            ->with(['user' => $this->user])
            ->willReturn([$fg1, $fg2]);

        $operation = $this->createMock(Operation::class);
        $result = $this->provider->provide($operation);

        $this->assertCount(2, $result);
    }

    public function testProvideReturnsEmptyArrayWhenNoFollowedGames(): void
    {
        $this->followedGamesRepository->method('findBy')->willReturn([]);

        $operation = $this->createMock(Operation::class);
        $result = $this->provider->provide($operation);

        $this->assertEquals([], $result);
    }

    public function testProvideThrowsWhenNotAuthenticated(): void
    {
        $security = $this->createMock(Security::class);
        $security->method('getUser')->willReturn(null);

        $provider = new FollowedGamesProvider($this->entityManager, $security);

        $this->expectException(\Exception::class);

        $provider->provide($this->createMock(Operation::class));
    }

    public function testProvideForDeleteReturnsFollowedGame(): void
    {
        $game = new Game();
        $fg = new FollowedGames();

        $this->gameRepository->method('find')->with(1)->willReturn($game);
        $this->followedGamesRepository->method('findOneBy')->willReturn($fg);

        $operation = new Delete();
        $result = $this->provider->provide($operation, ['id' => 1]);

        $this->assertSame($fg, $result);
    }

    public function testProvideForDeleteThrowsWhenGameNotFound(): void
    {
        $this->gameRepository->method('find')->willReturn(null);

        $operation = new Delete();

        $this->expectException(NotFoundHttpException::class);

        $this->provider->provide($operation, ['id' => 999]);
    }
}
