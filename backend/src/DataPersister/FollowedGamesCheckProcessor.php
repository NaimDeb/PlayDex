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
 * Checks if the authenticated user is already following a game.
 *
 * Responsibilities:
 * - Validates that the authenticated user exists
 * - Retrieves the game by ID from URI variables
 * - Checks if the user already follows the game
 * - Returns early if no duplicate follow exists (idempotency check)
 */
class FollowedGamesCheckProcessor extends AbstractDataPersister
{
    public function __construct(EntityManagerInterface $entityManager, Security $security)
    {
        parent::__construct($entityManager, $security);
    }

    public function process(mixed $data, Operation $operation, array $uriVariables = [], array $context = []): void
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

        $followedGame = $this->entityManager->getRepository(FollowedGames::class)
            ->findOneBy(['user' => $user, 'game' => $game]);

        if ($followedGame) {
            $followedGame->setLastCheckedAt(new \DateTimeImmutable());
            $this->entityManager->flush();
        } else {
            throw new NotFoundHttpException('You are not following this game.');
        }
    }
}
