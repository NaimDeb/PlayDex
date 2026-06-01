<?php

namespace App\Tests\Unit\Service;

use App\Entity\Game;
use App\Repository\GameRepository;
use App\Service\ExternalApiService;
use App\Service\IgdbSearchService;
use App\Service\Storage\IgdbGameStorage;
use PHPUnit\Framework\TestCase;
use Symfony\Contracts\Cache\CacheInterface;
use Symfony\Contracts\Cache\ItemInterface;

class IgdbSearchServiceTest extends TestCase
{
    private ExternalApiService $externalApiService;
    private CacheInterface $cache;
    private GameRepository $gameRepository;
    private IgdbGameStorage $gameStorage;
    private IgdbSearchService $service;

    protected function setUp(): void
    {
        $this->externalApiService = $this->createMock(ExternalApiService::class);
        $this->cache = $this->createMock(CacheInterface::class);
        $this->gameRepository = $this->createMock(GameRepository::class);
        $this->gameStorage = $this->createMock(IgdbGameStorage::class);

        $this->service = new IgdbSearchService(
            $this->externalApiService,
            $this->cache,
            $this->gameRepository,
            $this->gameStorage
        );
    }

    public function testSearchReturnsFormattedResults(): void
    {
        $igdbResults = [
            [
                'id' => 1,
                'name' => 'Test Game',
                'summary' => 'A test game',
                'cover' => ['url' => '//images.igdb.com/t_thumb/abc.jpg'],
                'first_release_date' => 1609459200,
                'genres' => [['name' => 'Action']],
                'involved_companies' => [['company' => ['name' => 'TestCo']]],
            ],
        ];

        $this->cache->method('get')->willReturnCallback(
            function (string $key, callable $callback) use ($igdbResults) {
                return $igdbResults;
            }
        );

        $this->gameRepository->method('findBy')->willReturn([]);

        $result = $this->service->search('test');

        $this->assertCount(1, $result);
        $this->assertEquals(1, $result[0]['igdbId']);
        $this->assertEquals('Test Game', $result[0]['name']);
        $this->assertStringContainsString('t_cover_big', $result[0]['coverUrl']);
        $this->assertFalse($result[0]['isImported']);
        $this->assertNull($result[0]['localId']);
    }

    public function testSearchMarksImportedGames(): void
    {
        $igdbResults = [['id' => 42, 'name' => 'Imported Game']];

        $this->cache->method('get')->willReturnCallback(
            function (string $key, callable $callback) use ($igdbResults) {
                return $igdbResults;
            }
        );

        $game = $this->createMock(Game::class);
        $game->method('getApiId')->willReturn(42);
        $game->method('getId')->willReturn(100);

        $this->gameRepository->method('findBy')->willReturn([$game]);

        $result = $this->service->search('imported');

        $this->assertTrue($result[0]['isImported']);
        $this->assertEquals(100, $result[0]['localId']);
    }

    public function testSearchReturnsEmptyArrayWhenNoResults(): void
    {
        $this->cache->method('get')->willReturnCallback(
            function (string $key, callable $callback) {
                return [];
            }
        );

        $result = $this->service->search('nonexistent');

        $this->assertEquals([], $result);
    }

    public function testImportGameReturnsExistingGame(): void
    {
        $game = new Game();
        $this->gameRepository->method('findByApiId')->with(42)->willReturn($game);

        $this->externalApiService->expects($this->never())->method('getIgdbGameById');

        $result = $this->service->importGame(42);

        $this->assertSame($game, $result);
    }

    public function testImportGameFetchesAndStoresNewGame(): void
    {
        $gameData = ['id' => 42, 'name' => 'New Game'];
        $game = new Game();

        $this->gameRepository->method('findByApiId')
            ->willReturnOnConsecutiveCalls(null, $game);

        $this->externalApiService->method('getIgdbGameById')
            ->with(42)->willReturn($gameData);

        $this->gameStorage->expects($this->once())
            ->method('store')->with([$gameData]);

        $result = $this->service->importGame(42);

        $this->assertSame($game, $result);
    }

    public function testImportGameThrowsWhenIgdbGameNotFound(): void
    {
        $this->gameRepository->method('findByApiId')->willReturn(null);
        $this->externalApiService->method('getIgdbGameById')->willReturn(null);

        $this->expectException(\RuntimeException::class);
        $this->expectExceptionMessage('not found');

        $this->service->importGame(999);
    }
}
