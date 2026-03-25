<?php

namespace App\Tests\Unit\State\Processor;

use ApiPlatform\Metadata\Operation;
use App\Entity\FollowedGames;
use App\Entity\Game;
use App\Entity\User;
use App\State\Processor\FollowedGamesProcessor;
use Doctrine\ORM\EntityManagerInterface;
use Doctrine\ORM\EntityRepository;
use PHPUnit\Framework\TestCase;
use Symfony\Bundle\SecurityBundle\Security;
use Symfony\Component\HttpKernel\Exception\BadRequestHttpException;
use Symfony\Component\HttpKernel\Exception\NotFoundHttpException;

class FollowedGamesProcessorTest extends TestCase
{
    private EntityManagerInterface $entityManager;
    private Security $security;
    private EntityRepository $gameRepository;
    private EntityRepository $followedGamesRepository;
    private FollowedGamesProcessor $processor;
    private Operation $operation;
    private User $user;

    protected function setUp(): void
    {
        $this->entityManager = $this->createMock(EntityManagerInterface::class);
        $this->security = $this->createMock(Security::class);
        $this->gameRepository = $this->createMock(EntityRepository::class);
        $this->followedGamesRepository = $this->createMock(EntityRepository::class);
        $this->operation = $this->createMock(Operation::class);

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

        $this->processor = new FollowedGamesProcessor($this->entityManager, $this->security);
    }

    public function testProcessCreatesFollowedGame(): void
    {
        $game = new Game();
        $this->gameRepository->method('find')->with(1)->willReturn($game);
        $this->followedGamesRepository->method('findOneBy')->willReturn(null);

        $this->entityManager->expects($this->once())->method('persist');
        $this->entityManager->expects($this->once())->method('flush');

        $result = $this->processor->process(new FollowedGames(), $this->operation, ['id' => 1]);

        $this->assertSame($game, $result->getGame());
        $this->assertSame($this->user, $result->getUser());
    }

    public function testProcessThrowsWhenNoGameId(): void
    {
        $this->expectException(BadRequestHttpException::class);
        $this->expectExceptionMessage('Game ID is required');

        $this->processor->process(new FollowedGames(), $this->operation, []);
    }

    public function testProcessThrowsWhenGameNotFound(): void
    {
        $this->gameRepository->method('find')->willReturn(null);

        $this->expectException(NotFoundHttpException::class);
        $this->expectExceptionMessage('Game not found');

        $this->processor->process(new FollowedGames(), $this->operation, ['id' => 999]);
    }

    public function testProcessThrowsOnDuplicateFollow(): void
    {
        $game = new Game();
        $this->gameRepository->method('find')->with(1)->willReturn($game);
        $this->followedGamesRepository->method('findOneBy')->willReturn(new FollowedGames());

        $this->expectException(BadRequestHttpException::class);
        $this->expectExceptionMessage('already following');

        $this->processor->process(new FollowedGames(), $this->operation, ['id' => 1]);
    }
}
