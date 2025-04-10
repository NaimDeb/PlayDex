<?php

namespace App\State\Provider;

use ApiPlatform\Metadata\Operation;
use ApiPlatform\State\ProviderInterface;
use ApiPlatform\Symfony\Security\Exception\AccessDeniedException;
use App\Repository\FollowedGamesRepository;
use Symfony\Bundle\SecurityBundle\Security;

class FollowedGamesProvider implements ProviderInterface
{
    public function __construct(private FollowedGamesRepository $gameRepository, private Security $security) {}

    public function provide(Operation $operation, array $uriVariables = [], array $context = []): object|array|null
    {

        $user = $this->security->getUser();

        if (!$user) {
            throw new AccessDeniedException('Not authenticated');
        }

        

        /** @var ?Game $game */
        $game = $this->gameRepository->findBy(['id' => $uriVariables['id']]);
        return $game ? $game->getExtensions() : [];
    }
}
