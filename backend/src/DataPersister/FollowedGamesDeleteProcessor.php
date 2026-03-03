<?php

namespace App\DataPersister;


use ApiPlatform\Metadata\Operation;
use App\Entity\FollowedGames;
use App\Entity\Game;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Bundle\SecurityBundle\Security;
use Symfony\Component\HttpKernel\Exception\BadRequestHttpException;
use Symfony\Component\HttpKernel\Exception\NotFoundHttpException;

/**
 * Handles deletion of FollowedGames relationships.
 *
 * Responsibilities:
 * - Validates that the authenticated user exists
 * - Retrieves the game by ID from URI variables
 * - Validates the followed game relationship exists
 * - Removes the follow relationship
 * - Persists changes to the database
 */
class FollowedGamesDeleteProcessor extends AbstractDataPersister
{
    public function __construct(
        EntityManagerInterface $entityManager,
        Security $security,
    ) {
        parent::__construct($entityManager, $security);
    }

    public function process(mixed $data, Operation $operation, array $uriVariables = [], array $context = []): void
    {
        if ($data instanceof FollowedGames) {
            $user = $this->getAuthenticatedUser();

            $gameId = $uriVariables['id'] ?? null;
            if ($gameId === null) {
                throw new BadRequestHttpException('Game ID is required');
            }

            $game = $this->entityManager->getRepository(Game::class)->find($gameId);
            if (!$game) {
                throw new NotFoundHttpException('Game not found');
            }

            $existingFollowedGame = $this->entityManager->getRepository(FollowedGames::class)
                ->findOneBy(['user' => $user, 'game' => $game]);

            if ($existingFollowedGame) {
                $this->entityManager->remove($existingFollowedGame);
                $this->entityManager->flush();
            } else {
                throw new NotFoundHttpException('You are not following this game.');
            }
        }
    }
}
