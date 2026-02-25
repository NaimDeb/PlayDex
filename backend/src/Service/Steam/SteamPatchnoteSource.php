<?php

declare(strict_types=1);

namespace App\Service\Steam;

use App\Config\SteamConfig;
use App\Entity\Game;
use App\Interfaces\Service\PatchnoteSourceInterface;
use Symfony\Contracts\HttpClient\HttpClientInterface;

class SteamPatchnoteSource implements PatchnoteSourceInterface
{
    public function __construct(
        private readonly SteamPollerService $pollerService,
        private readonly HttpClientInterface $httpClient,
    ) {
    }

    public function supports(Game $game): bool
    {
        return $game->getSteamId() !== null;
    }

    public function getSourceIdentifier(): string
    {
        return 'steam';
    }

    /**
     * Fetch patchnotes for a specific game via the community events HTTP API.
     *
     * @return array<int, array{appid: int, gid: string, title: string, content: string, date: int}>
     */
    public function fetchPatchnotes(Game $game, ?\DateTimeInterface $since = null): array
    {
        $steamId = $game->getSteamId();
        if ($steamId === null) {
            return [];
        }

        return $this->fetchCommunityEvents($steamId, $since);
    }

    /**
     * Fetch all recent patchnotes across all apps via the Node.js poller.
     *
     * @return array<int, array{appid: int, gid: string, title: string, content: string, date: int}>
     */
    public function fetchRecentPatchnotes(): array
    {
        return $this->pollerService->poll();
    }

    /**
     * Fetch a single page of historical news for a Steam app via the GetNewsForApp API.
     *
     * @return array{items: array<int, array{appid: int, gid: string, title: string, content: string, date: int}>, hasMore: bool}
     */
    public function fetchHistoricalNews(int $appId, ?int $endDate = null, int $count = SteamConfig::HISTORY_FETCH_COUNT): array
    {
        $query = [
            'appid' => $appId,
            'count' => $count,
            'maxlength' => 0,
            'feeds' => SteamConfig::HISTORY_NEWS_FEED,
        ];

        if ($endDate !== null) {
            $query['enddate'] = $endDate;
        }

        try {
            $response = $this->httpClient->request('GET', SteamConfig::NEWS_API_URL, [
                'query' => $query,
            ]);
            $data = $response->toArray();
        } catch (\Throwable) {
            return ['items' => [], 'hasMore' => false];
        }

        $newsItems = $data['appnews']['newsitems'] ?? [];
        $patchnotes = [];

        foreach ($newsItems as $item) {
            $patchnotes[] = [
                'appid' => $appId,
                'gid' => (string) ($item['gid'] ?? ''),
                'title' => $item['title'] ?? '',
                'content' => $item['contents'] ?? '',
                'date' => (int) ($item['date'] ?? 0),
            ];
        }

        return ['items' => $patchnotes, 'hasMore' => count($newsItems) >= $count];
    }

    /**
     * Fetch community events for a single app via HTTP (no Node.js dependency).
     *
     * @return array<int, array{appid: int, gid: string, title: string, content: string, date: int}>
     */
    private function fetchCommunityEvents(int $appId, ?\DateTimeInterface $since = null): array
    {
        try {
            $response = $this->httpClient->request('GET', SteamConfig::COMMUNITY_EVENTS_URL, [
                'query' => [
                    'appid' => $appId,
                    'count' => 20,
                    'l' => 'english',
                ],
            ]);

            $data = $response->toArray();
        } catch (\Throwable) {
            return [];
        }

        $events = $data['events'] ?? [];
        $patchnotes = [];

        foreach ($events as $event) {
            if (($event['event_type'] ?? null) !== SteamConfig::EVENT_TYPE_UPDATE) {
                continue;
            }

            $eventDate = $event['start_time'] ?? 0;

            if ($since !== null && $eventDate < $since->getTimestamp()) {
                continue;
            }

            $patchnotes[] = [
                'appid' => $appId,
                'gid' => (string) ($event['gid'] ?? ''),
                'title' => $event['event_name'] ?? '',
                'content' => $event['event_description'] ?? '',
                'date' => (int) $eventDate,
            ];
        }

        return $patchnotes;
    }
}
