<?php

namespace App\Tests\Unit\State\Processor;

use ApiPlatform\Metadata\Operation;
use App\Entity\FollowedGames;
use App\Entity\Game;
use App\Entity\User;
use App\State\Processor\FollowedGamesCheckProcessor;
use Doctrine\ORM\EntityManagerInterface;
use Doctrine\ORM\EntityRepository;
use PHPUnit\Framework\TestCase;
use Symfony\Bundle\SecurityBundle\Security;
use Symfony\Component\HttpKernel\Exception\BadRequestHttpException;
use Symfony\Component\HttpKernel\Exception\NotFoundHttpException;

class FollowedGamesCheckProcessorTest extends TestCase
{
    private EntityManagerInterface $entityManager;
    private Security $security;
    private EntityRepository $gameRepository;
    private EntityRepository $followedGamesRepository;
    private FollowedGamesCheckProcessor $processor;
    private Operation $operation;

    protected function setUp(): void
    {
        $this->entityManager = $this->createMock(EntityManagerInterface::class);
        $this->security = $this->createMock(Security::class);
        $this->gameRepository = $this->createMock(EntityRepository::class);
        $this->followedGamesRepository = $this->createMock(EntityRepository::class);
        $this->operation = $this->createMock(Operation::class);

        $user = new User();
        $user->setUsername('gamer');
        $this->security->method('getUser')->willReturn($user);

        $this->entityManager->method('getRepository')
            ->willReturnCallback(function (string $class) {
                return match ($class) {
                    Game::class => $this->gameRepository,
                    FollowedGames::class => $this->followedGamesRepository,
                };
            });

        $this->processor = new FollowedGamesCheckProcessor($this->entityManager, $this->security);
    }

    public function testProcessUpdatesLastCheckedAt(): void
    {
        $game = new Game();
        $followedGame = new FollowedGames();

        $this->gameRepository->method('find')->with(1)->willReturn($game);
        $this->followedGamesRepository->method('findOneBy')->willReturn($followedGame);

        $this->entityManager->expects($this->once())->method('flush');

        $before = new \DateTimeImmutable();
        $this->processor->process(new FollowedGames(), $this->operation, ['id' => 1]);
        $after = new \DateTimeImmutable();

        $lastChecked = $followedGame->getLastCheckedAt();
        $this->assertInstanceOf(\DateTimeImmutable::class, $lastChecked);
        $this->assertGreaterThanOrEqual($before, $lastChecked);
        $this->assertLessThanOrEqual($after, $lastChecked);
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

    public function testProcessThrowsWhenNotFollowing(): void
    {
        $game = new Game();
        $this->gameRepository->method('find')->with(1)->willReturn($game);
        $this->followedGamesRepository->method('findOneBy')->willReturn(null);

        $this->expectException(NotFoundHttpException::class);
        $this->expectExceptionMessage('not following');

        $this->processor->process(new FollowedGames(), $this->operation, ['id' => 1]);
    }
}
