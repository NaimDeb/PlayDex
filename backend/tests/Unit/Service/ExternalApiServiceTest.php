<?php

namespace App\Tests\Unit\Service;

use App\Service\ExternalApiService;
use PHPUnit\Framework\TestCase;
use Symfony\Component\DependencyInjection\ParameterBag\ParameterBagInterface;
use Symfony\Contracts\HttpClient\HttpClientInterface;
use Symfony\Contracts\HttpClient\ResponseInterface;

class ExternalApiServiceTest extends TestCase
{
    private HttpClientInterface $httpClient;
    private ParameterBagInterface $params;
    private ExternalApiService $service;

    protected function setUp(): void
    {
        $this->httpClient = $this->createMock(HttpClientInterface::class);
        $this->params = $this->createMock(ParameterBagInterface::class);

        $this->params->method('get')->willReturnCallback(function (string $key) {
            return match ($key) {
                'IGDB_ACCESS_TOKEN' => 'test_token',
                'TWITCH_CLIENT_ID' => 'test_client_id',
                'STEAM_API_KEY' => 'test_steam_key',
                default => null,
            };
        });

        $this->service = new ExternalApiService($this->httpClient, $this->params);
    }

    public function testSearchIgdbGamesCallsApiWithCorrectBody(): void
    {
        $response = $this->createMock(ResponseInterface::class);
        $response->method('getContent')->willReturn(json_encode([
            ['id' => 1, 'name' => 'Zelda'],
        ]));

        $this->httpClient->expects($this->once())
            ->method('request')
            ->with(
                'POST',
                $this->stringContains('/games'),
                $this->callback(function (array $options) {
                    return str_contains($options['body'], 'search "zelda"');
                })
            )
            ->willReturn($response);

        $result = $this->service->searchIgdbGames('zelda');

        $this->assertCount(1, $result);
        $this->assertEquals('Zelda', $result[0]['name']);
    }

    public function testSearchIgdbGamesReturnsEmptyOnEmptyResponse(): void
    {
        $response = $this->createMock(ResponseInterface::class);
        $response->method('getContent')->willReturn('');

        $this->httpClient->method('request')->willReturn($response);

        $result = $this->service->searchIgdbGames('nonexistent');

        $this->assertEquals([], $result);
    }

    public function testGetIgdbGameByIdReturnsFirstResult(): void
    {
        $response = $this->createMock(ResponseInterface::class);
        $response->method('getContent')->willReturn(json_encode([
            ['id' => 42, 'name' => 'Found Game'],
        ]));

        $this->httpClient->method('request')->willReturn($response);

        $result = $this->service->getIgdbGameById(42);

        $this->assertEquals(42, $result['id']);
        $this->assertEquals('Found Game', $result['name']);
    }

    public function testGetIgdbGameByIdReturnsNullWhenEmpty(): void
    {
        $response = $this->createMock(ResponseInterface::class);
        $response->method('getContent')->willReturn(json_encode([]));

        $this->httpClient->method('request')->willReturn($response);

        $result = $this->service->getIgdbGameById(999);

        $this->assertNull($result);
    }

    public function testGetIgdbGamesWithFromFilter(): void
    {
        $response = $this->createMock(ResponseInterface::class);
        $response->method('getContent')->willReturn(json_encode([]));

        $this->httpClient->expects($this->once())
            ->method('request')
            ->with(
                'POST',
                $this->stringContains('/games'),
                $this->callback(function (array $options) {
                    return str_contains($options['body'], 'updated_at >= 1609459200');
                })
            )
            ->willReturn($response);

        $this->service->getIgdbGames(10, 0, 1609459200);
    }
}
