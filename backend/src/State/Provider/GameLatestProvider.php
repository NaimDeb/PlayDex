<?php

namespace App\State\Provider;

use ApiPlatform\Metadata\Operation;
use ApiPlatform\State\ProviderInterface;
use App\Repository\GameRepository;

class GameLatestProvider implements ProviderInterface
{
    public function __construct(private GameRepository $gameRepository) {}

    public function provide(Operation $operation, array $uriVariables = [], array $context = []): object|array|null
    {
        // Fetch the 8 latest games ordered by releasedAt descending
        /**
         * @var Game[] $latestGames
         */
        $latestGames = $this->gameRepository->findLatest(8);

        return $latestGames;
    }
}
