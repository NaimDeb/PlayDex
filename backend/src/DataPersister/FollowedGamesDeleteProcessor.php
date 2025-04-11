<?php

namespace App\DataPersister;

use ApiPlatform\Metadata\Operation;
use ApiPlatform\State\ProcessorInterface;
use App\Entity\FollowedGames;
use App\Entity\Game;
use App\Entity\Patchnote;
use App\Entity\User;

use Doctrine\ORM\EntityManagerInterface;
use Symfony\Bundle\SecurityBundle\Security;
use Symfony\Component\HttpKernel\Exception\BadRequestHttpException;
use Symfony\Component\HttpKernel\Exception\NotFoundHttpException;

class FollowedGamesDeleteProcessor implements ProcessorInterface
{
    public function __construct(
        private readonly EntityManagerInterface $entityManager,
        private readonly Security $security,
    ) {}

    public function process(mixed $data, Operation $operation, array $uriVariables = [], array $context = []): void
{
    if ($data instanceof FollowedGames) {

        /**
         * @var User $user
         */
        $user = $this->security->getUser();

        $gameId = $uriVariables['id'] ?? null;
        if ($gameId === null) {
            throw new BadRequestHttpException('Game ID is required');
        }

        $game = $this->entityManager->getRepository(Game::class)->find($gameId);
        if (!$game) {
            throw new NotFoundHttpException('Game not found');
        }

        // Find the followed game entry for this specific user and game
        $existingFollowedGame = $this->entityManager->getRepository(FollowedGames::class)
            ->findOneBy(['user' => $user, 'game' => $game]);
        
        if ($existingFollowedGame) {
            // Remove the followed game from the database
            $this->entityManager->remove($existingFollowedGame);
            $this->entityManager->flush();
        } else {
            throw new NotFoundHttpException('You are not following this game.');
        }
    }
}
}