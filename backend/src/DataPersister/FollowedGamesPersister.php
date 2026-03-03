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
 * Handles the creation of FollowedGames relationships.
 *
 * Responsibilities:
 * - Validates that the authenticated user exists
 * - Retrieves the game by ID from URI variables
 * - Prevents duplicate follow relationships (idempotency)
 * - Associates the user with the game
 * - Persists the relationship to the database
 */
class FollowedGamesPersister extends AbstractDataPersister
{
    public function __construct(
        EntityManagerInterface $entityManager,
        Security $security,
    ) {
        parent::__construct($entityManager, $security);
    }

    public function process(mixed $data, Operation $operation, array $uriVariables = [], array $context = []): FollowedGames
    {
        $user = $this->getAuthenticatedUser();

        $gameId = $uriVariables['id'] ?? null;
        if ($gameId === null) {
            throw new BadRequestHttpException('Game ID is required');
        }

        $game = $this->entityManager->getRepository(Game::class)->find($gameId);
        if (!$game) {
            throw new NotFoundHttpException('Game not found');
        }

        $existingFollowedGame = $this->entityManager->getRepository(FollowedGames::class)->findOneBy(['user' => $user, 'game' => $game]);
        if ($existingFollowedGame) {
            throw new BadRequestHttpException('You are already following this game.');
        }

        if (!$data instanceof FollowedGames) {
            $data = new FollowedGames();
        }

        $data->setGame($game);
        $data->setUser($user);

        $this->persist($data);

        return $data;
    }
}
