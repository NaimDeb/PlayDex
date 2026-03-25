<?php

namespace App\Tests\Unit\State\Provider;

use ApiPlatform\Metadata\Operation;
use App\Entity\Extension;
use App\Entity\Game;
use App\State\Provider\LatestReleasesProvider;
use Doctrine\ORM\EntityManagerInterface;
use Doctrine\ORM\EntityRepository;
use PHPUnit\Framework\TestCase;

class LatestReleasesProviderTest extends TestCase
{
    private EntityManagerInterface $entityManager;
    private EntityRepository $gameRepository;
    private EntityRepository $extensionRepository;
    private LatestReleasesProvider $provider;
    private Operation $operation;

    protected function setUp(): void
    {
        $this->entityManager = $this->createMock(EntityManagerInterface::class);
        $this->gameRepository = $this->createMock(EntityRepository::class);
        $this->extensionRepository = $this->createMock(EntityRepository::class);
        $this->operation = $this->createMock(Operation::class);

        $this->entityManager->method('getRepository')
            ->willReturnCallback(function (string $class) {
                return match ($class) {
                    Game::class => $this->gameRepository,
                    Extension::class => $this->extensionRepository,
                };
            });

        $this->provider = new LatestReleasesProvider($this->entityManager);
    }

    public function testProvideMergesGamesAndExtensionsSortedByDate(): void
    {
        $game = $this->createMock(Game::class);
        $game->method('getId')->willReturn(1);
        $game->method('getTitle')->willReturn('Game 1');
        $game->method('getReleasedAt')->willReturn(new \DateTimeImmutable('2025-01-01'));
        $game->method('getLastUpdatedAt')->willReturn(null);

        $ext = $this->createMock(Extension::class);
        $ext->method('getId')->willReturn(2);
        $ext->method('getTitle')->willReturn('Extension 1');
        $ext->method('getReleasedAt')->willReturn(new \DateTimeImmutable('2025-06-01'));
        $ext->method('getLastUpdatedAt')->willReturn(null);

        $this->gameRepository->method('findBy')->willReturn([$game]);
        $this->extensionRepository->method('findBy')->willReturn([$ext]);

        $result = $this->provider->provide($this->operation);

        $this->assertCount(2, $result);
        // Extension is newer, should be first
        $this->assertEquals('extension', $result[0]->type);
        $this->assertEquals('game', $result[1]->type);
    }

    public function testProvideReturnsMaxTenItems(): void
    {
        $games = [];
        for ($i = 0; $i < 8; $i++) {
            $game = $this->createMock(Game::class);
            $game->method('getId')->willReturn($i);
            $game->method('getTitle')->willReturn("Game $i");
            $game->method('getReleasedAt')->willReturn(new \DateTimeImmutable("2025-01-0" . ($i + 1)));
            $game->method('getLastUpdatedAt')->willReturn(null);
            $games[] = $game;
        }

        $extensions = [];
        for ($i = 0; $i < 5; $i++) {
            $ext = $this->createMock(Extension::class);
            $ext->method('getId')->willReturn(100 + $i);
            $ext->method('getTitle')->willReturn("Ext $i");
            $ext->method('getReleasedAt')->willReturn(new \DateTimeImmutable("2025-06-0" . ($i + 1)));
            $ext->method('getLastUpdatedAt')->willReturn(null);
            $extensions[] = $ext;
        }

        $this->gameRepository->method('findBy')->willReturn($games);
        $this->extensionRepository->method('findBy')->willReturn($extensions);

        $result = $this->provider->provide($this->operation);

        $this->assertCount(10, $result);
    }

    public function testProvideHandlesEmptyRepositories(): void
    {
        $this->gameRepository->method('findBy')->willReturn([]);
        $this->extensionRepository->method('findBy')->willReturn([]);

        $result = $this->provider->provide($this->operation);

        $this->assertCount(0, $result);
    }
}
