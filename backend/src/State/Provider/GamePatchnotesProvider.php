<?php

namespace App\State\Provider;

use ApiPlatform\Metadata\Operation;
use ApiPlatform\State\ProviderInterface;
use App\Repository\GameRepository;

class GamePatchnotesProvider implements ProviderInterface
{
    public function __construct(private GameRepository $gameRepository)
    {
    }

    public function provide(Operation $operation, array $uriVariables = [], array $context = []): object|array|null
    {

        /** @var ?Game $game */
        $game = $this->gameRepository->find($uriVariables['id']);

        return $game ? $game->getPatchnotes() : [];
    }
}