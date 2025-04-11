<?php

namespace App\State\Provider;

use ApiPlatform\Metadata\Delete;
use ApiPlatform\Metadata\Operation;
use ApiPlatform\State\ProviderInterface;
use ApiPlatform\Symfony\Security\Exception\AccessDeniedException;
use App\Entity\FollowedGames;
use App\Entity\Game;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Bundle\SecurityBundle\Security;
use Symfony\Component\HttpKernel\Exception\BadRequestHttpException;
use Symfony\Component\HttpKernel\Exception\NotFoundHttpException;

class FollowedGamesProvider implements ProviderInterface
{
    public function __construct(private EntityManagerInterface $entityManager, private Security $security) {}

    public function provide(Operation $operation, array $uriVariables = [], array $context = []): object|array|null
    {

        $user = $this->security->getUser();

        if (!$user) {
            throw new AccessDeniedException('Not authenticated');
        }

        // For DELETE operation, validate the specific followed game entry
        if ($operation instanceof Delete) {
            $gameId = $uriVariables['id'] ?? null;
            if (!$gameId) {
                throw new BadRequestHttpException('Game ID is required');
            }

            $game = $this->entityManager->getRepository(Game::class)->find($gameId);
            if (!$game) {
                throw new NotFoundHttpException('Game not found');
            }

            // Find if the user is following this specific game
            $followedGame = $this->entityManager->getRepository(FollowedGames::class)
                ->findOneBy(['user' => $user, 'game' => $game]);

            if (!$followedGame) {
                throw new NotFoundHttpException('You are not following this game');
            }

            return $followedGame;
        }

        // Todo : Maybe a DTO for those, we don't need the full game object


        /** @var ?Game $game */
        $games = $this->entityManager->getRepository(FollowedGames::class)->findBy(['user' => $user]);

        if (!$games) {
            throw new AccessDeniedException('You don\'t follow any games');
        }

        return $games;
    }
}
