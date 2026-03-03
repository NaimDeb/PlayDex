<?php

namespace App\Service;

use App\Config\ApiConfig;
use App\Entity\Game;
use App\Repository\GameRepository;
use App\Service\Storage\IgdbGameStorage;
use Symfony\Contracts\Cache\CacheInterface;
use Symfony\Contracts\Cache\ItemInterface;

class IgdbSearchService
{
    public function __construct(
        private ExternalApiService $externalApiService,
        private CacheInterface $cache,
        private GameRepository $gameRepository,
        private IgdbGameStorage $gameStorage,
    ) {}

    public function search(string $query): array
    {
        $normalizedQuery = mb_strtolower(trim($query));
        $cacheKey = 'igdb_search_' . md5($normalizedQuery);

        $igdbResults = $this->cache->get($cacheKey, function (ItemInterface $item) use ($normalizedQuery) {
            $item->expiresAfter(ApiConfig::IGDB_SEARCH_CACHE_TTL);
            return $this->externalApiService->searchIgdbGames($normalizedQuery);
        });

        if (empty($igdbResults)) {
            return [];
        }

        $igdbIds = array_column($igdbResults, 'id');
        $existingGames = $this->gameRepository->findBy(['apiId' => $igdbIds]);
        $importedMap = [];
        foreach ($existingGames as $game) {
            $importedMap[$game->getApiId()] = $game->getId();
        }

        return array_map(function (array $igdbGame) use ($importedMap) {
            $apiId = $igdbGame['id'];
            return [
                'igdbId' => $apiId,
                'name' => $igdbGame['name'] ?? null,
                'summary' => $igdbGame['summary'] ?? null,
                'coverUrl' => isset($igdbGame['cover']['url'])
                    ? str_replace('t_thumb', 't_cover_big', $igdbGame['cover']['url'])
                    : null,
                'firstReleaseDate' => $igdbGame['first_release_date'] ?? null,
                'genres' => array_map(
                    fn($g) => $g['name'] ?? null,
                    $igdbGame['genres'] ?? []
                ),
                'companies' => array_map(
                    fn($c) => $c['company']['name'] ?? null,
                    $igdbGame['involved_companies'] ?? []
                ),
                'isImported' => isset($importedMap[$apiId]),
                'localId' => $importedMap[$apiId] ?? null,
            ];
        }, $igdbResults);
    }

    public function importGame(int $igdbId): Game
    {
        $existing = $this->gameRepository->findByApiId($igdbId);
        if ($existing) {
            return $existing;
        }

        $gameData = $this->externalApiService->getIgdbGameById($igdbId);
        if (!$gameData) {
            throw new \RuntimeException(sprintf('Game with IGDB ID %d not found.', $igdbId));
        }

        $this->gameStorage->store([$gameData]);

        $game = $this->gameRepository->findByApiId($igdbId);
        if (!$game) {
            throw new \RuntimeException(sprintf('Failed to import game with IGDB ID %d.', $igdbId));
        }

        return $game;
    }
}
