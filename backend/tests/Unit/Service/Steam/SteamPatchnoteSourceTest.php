<?php

namespace App\Tests\Unit\Service\Steam;

use App\Config\SteamConfig;
use App\Entity\Game;
use App\Service\Steam\SteamPatchnoteSource;
use App\Service\Steam\SteamPollerService;
use PHPUnit\Framework\TestCase;
use Symfony\Contracts\HttpClient\HttpClientInterface;
use Symfony\Contracts\HttpClient\ResponseInterface;

class SteamPatchnoteSourceTest extends TestCase
{
    private SteamPollerService $pollerService;
    private HttpClientInterface $httpClient;
    private SteamPatchnoteSource $source;

    protected function setUp(): void
    {
        $this->pollerService = $this->createMock(SteamPollerService::class);
        $this->httpClient = $this->createMock(HttpClientInterface::class);
        $this->source = new SteamPatchnoteSource($this->pollerService, $this->httpClient);
    }

    public function testSupportsReturnsTrueWhenGameHasSteamId(): void
    {
        $game = $this->createMock(Game::class);
        $game->method('getSteamId')->willReturn(12345);

        $this->assertTrue($this->source->supports($game));
    }

    public function testSupportsReturnsFalseWhenGameHasNoSteamId(): void
    {
        $game = $this->createMock(Game::class);
        $game->method('getSteamId')->willReturn(null);

        $this->assertFalse($this->source->supports($game));
    }

    public function testGetSourceIdentifierReturnsSteam(): void
    {
        $this->assertEquals('steam', $this->source->getSourceIdentifier());
    }

    public function testFetchPatchnotesReturnsEmptyWhenNoSteamId(): void
    {
        $game = $this->createMock(Game::class);
        $game->method('getSteamId')->willReturn(null);

        $result = $this->source->fetchPatchnotes($game);

        $this->assertEquals([], $result);
    }

    public function testFetchPatchnotesFiltersByEventType(): void
    {
        $game = $this->createMock(Game::class);
        $game->method('getSteamId')->willReturn(440);

        $response = $this->createMock(ResponseInterface::class);
        $response->method('toArray')->willReturn([
            'events' => [
                ['event_type' => SteamConfig::EVENT_TYPE_UPDATE, 'gid' => '1', 'event_name' => 'Update', 'event_description' => 'content', 'start_time' => 1609459200],
                ['event_type' => 99, 'gid' => '2', 'event_name' => 'Not Update', 'event_description' => 'skip', 'start_time' => 1609459200],
            ],
        ]);

        $this->httpClient->method('request')->willReturn($response);

        $result = $this->source->fetchPatchnotes($game);

        $this->assertCount(1, $result);
        $this->assertEquals('Update', $result[0]['title']);
    }

    public function testFetchPatchnotesFiltersByDate(): void
    {
        $game = $this->createMock(Game::class);
        $game->method('getSteamId')->willReturn(440);

        $response = $this->createMock(ResponseInterface::class);
        $response->method('toArray')->willReturn([
            'events' => [
                ['event_type' => SteamConfig::EVENT_TYPE_UPDATE, 'gid' => '1', 'event_name' => 'Old', 'event_description' => '', 'start_time' => 1000000],
                ['event_type' => SteamConfig::EVENT_TYPE_UPDATE, 'gid' => '2', 'event_name' => 'New', 'event_description' => '', 'start_time' => 9999999999],
            ],
        ]);

        $this->httpClient->method('request')->willReturn($response);

        $since = new \DateTimeImmutable('@5000000');
        $result = $this->source->fetchPatchnotes($game, $since);

        $this->assertCount(1, $result);
        $this->assertEquals('New', $result[0]['title']);
    }

    public function testFetchRecentPatchnotesDelegatesToPollerService(): void
    {
        $expected = [['appid' => 440, 'gid' => '1', 'title' => 'test', 'content' => '', 'date' => 0]];
        $this->pollerService->method('poll')->willReturn($expected);

        $result = $this->source->fetchRecentPatchnotes();

        $this->assertEquals($expected, $result);
    }

    public function testFetchHistoricalNewsReturnsItems(): void
    {
        $response = $this->createMock(ResponseInterface::class);
        $response->method('toArray')->willReturn([
            'appnews' => [
                'newsitems' => [
                    ['gid' => '123', 'title' => 'Update 1', 'contents' => 'Content 1', 'date' => 1609459200],
                    ['gid' => '456', 'title' => 'Update 2', 'contents' => 'Content 2', 'date' => 1609459300],
                ],
            ],
        ]);

        $this->httpClient->method('request')->willReturn($response);

        $result = $this->source->fetchHistoricalNews(440);

        $this->assertCount(2, $result['items']);
        $this->assertEquals('Update 1', $result['items'][0]['title']);
        $this->assertEquals('Content 1', $result['items'][0]['content']);
        $this->assertEquals(440, $result['items'][0]['appid']);
    }

    public function testFetchHistoricalNewsReturnsFalseHasMoreWhenFewer(): void
    {
        $response = $this->createMock(ResponseInterface::class);
        $response->method('toArray')->willReturn([
            'appnews' => ['newsitems' => [['gid' => '1', 'title' => 'T', 'contents' => '', 'date' => 0]]],
        ]);

        $this->httpClient->method('request')->willReturn($response);

        $result = $this->source->fetchHistoricalNews(440, null, 10);

        $this->assertFalse($result['hasMore']);
    }

    public function testFetchHistoricalNewsHandlesHttpError(): void
    {
        $this->httpClient->method('request')->willThrowException(new \RuntimeException('HTTP error'));

        $result = $this->source->fetchHistoricalNews(440);

        $this->assertEquals([], $result['items']);
        $this->assertFalse($result['hasMore']);
    }
}
