<?php

declare(strict_types=1);

namespace App\Tests\Unit\Service\Steam;

use App\Entity\Game;
use App\Interfaces\Service\PatchnoteSourceInterface;
use App\Service\Steam\SteamPatchnoteSource;
use App\Service\Steam\SteamPollerService;
use PHPUnit\Framework\TestCase;
use Symfony\Component\HttpClient\MockHttpClient;
use Symfony\Component\HttpClient\Response\MockResponse;

/**
 * Tests de l'ingestion Steam (récupération des patch notes).
 *
 * On mocke le client HTTP (MockHttpClient) : aucun appel réseau réel,
 * tests déterministes et exécutables sans base de données.
 */
class SteamPatchnoteSourceTest extends TestCase
{
    private function createSource(MockHttpClient $http): SteamPatchnoteSource
    {
        // Le poller (pont Node.js) n'est pas utilisé par les méthodes HTTP testées ici.
        $poller = $this->createMock(SteamPollerService::class);

        return new SteamPatchnoteSource($poller, $http);
    }

    public function testImplementsInterface(): void
    {
        $source = $this->createSource(new MockHttpClient());
        $this->assertInstanceOf(PatchnoteSourceInterface::class, $source);
    }

    public function testSourceIdentifierIsSteam(): void
    {
        $source = $this->createSource(new MockHttpClient());
        $this->assertSame('steam', $source->getSourceIdentifier());
    }

    public function testSupportsOnlyGamesWithSteamId(): void
    {
        $source = $this->createSource(new MockHttpClient());

        $withSteam = (new Game())->setSteamId(440);
        $withoutSteam = new Game();

        $this->assertTrue($source->supports($withSteam));
        $this->assertFalse($source->supports($withoutSteam));
    }

    public function testFetchHistoricalNewsParsesItems(): void
    {
        $payload = [
            'appnews' => [
                'newsitems' => [
                    ['gid' => '111', 'title' => 'Patch 1.0', 'contents' => 'Notes 1.0', 'date' => 1700000000],
                    ['gid' => '222', 'title' => 'Patch 1.1', 'contents' => 'Notes 1.1', 'date' => 1700100000],
                ],
            ],
        ];
        $http = new MockHttpClient([new MockResponse(json_encode($payload))]);
        $source = $this->createSource($http);

        $result = $source->fetchHistoricalNews(440, null, 2);

        $this->assertCount(2, $result['items']);
        $this->assertSame('111', $result['items'][0]['gid']);
        $this->assertSame('Patch 1.0', $result['items'][0]['title']);
        $this->assertSame('Notes 1.0', $result['items'][0]['content']); // mappé depuis "contents"
        $this->assertSame(1700000000, $result['items'][0]['date']);
        $this->assertSame(440, $result['items'][0]['appid']);
    }

    public function testFetchHistoricalNewsHasMoreWhenPageFull(): void
    {
        // 2 items demandés, 2 reçus => il reste probablement des pages.
        $payload = ['appnews' => ['newsitems' => [
            ['gid' => '1', 'title' => 'a', 'contents' => 'x', 'date' => 1],
            ['gid' => '2', 'title' => 'b', 'contents' => 'y', 'date' => 2],
        ]]];
        $source = $this->createSource(new MockHttpClient([new MockResponse(json_encode($payload))]));

        $result = $source->fetchHistoricalNews(440, null, 2);

        $this->assertTrue($result['hasMore']);
    }

    public function testFetchHistoricalNewsNoMoreWhenPageNotFull(): void
    {
        // 2 demandés, 1 reçu => dernière page.
        $payload = ['appnews' => ['newsitems' => [
            ['gid' => '1', 'title' => 'a', 'contents' => 'x', 'date' => 1],
        ]]];
        $source = $this->createSource(new MockHttpClient([new MockResponse(json_encode($payload))]));

        $result = $source->fetchHistoricalNews(440, null, 2);

        $this->assertFalse($result['hasMore']);
        $this->assertCount(1, $result['items']);
    }

    public function testFetchHistoricalNewsHandlesHttpError(): void
    {
        // Réponse 500 => toArray() lève, le service doit renvoyer un résultat vide sans planter.
        $source = $this->createSource(new MockHttpClient([new MockResponse('', ['http_code' => 500])]));

        $result = $source->fetchHistoricalNews(440);

        $this->assertSame([], $result['items']);
        $this->assertFalse($result['hasMore']);
    }

    public function testFetchPatchnotesKeepsOnlyUpdateEvents(): void
    {
        // event_type 12 = update (gardé) ; autre type = ignoré.
        $payload = [
            'events' => [
                ['event_type' => 12, 'gid' => 'a', 'event_name' => 'Update', 'event_description' => 'desc', 'start_time' => 1700000000],
                ['event_type' => 28, 'gid' => 'b', 'event_name' => 'Sale', 'event_description' => 'promo', 'start_time' => 1700000500],
            ],
        ];
        $source = $this->createSource(new MockHttpClient([new MockResponse(json_encode($payload))]));

        $game = (new Game())->setSteamId(440);
        $patchnotes = $source->fetchPatchnotes($game);

        $this->assertCount(1, $patchnotes);
        $this->assertSame('a', $patchnotes[0]['gid']);
        $this->assertSame('Update', $patchnotes[0]['title']);
    }

    public function testFetchPatchnotesReturnsEmptyWithoutSteamId(): void
    {
        $source = $this->createSource(new MockHttpClient());
        $this->assertSame([], $source->fetchPatchnotes(new Game()));
    }
}
