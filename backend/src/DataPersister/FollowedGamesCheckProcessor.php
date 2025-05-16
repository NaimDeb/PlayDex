<?php

namespace App\DataPersister;

use ApiPlatform\Metadata\Operation;
use ApiPlatform\State\ProcessorInterface;
use App\Entity\FollowedGames;
use App\Entity\Game;
use App\Entity\User;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Bundle\SecurityBundle\Security;
use Symfony\Component\HttpKernel\Exception\BadRequestHttpException;
use Symfony\Component\HttpKernel\Exception\NotFoundHttpException;

class FollowedGamesCheckProcessor implements ProcessorInterface
{
    private EntityManagerInterface $entityManager;
    private Security $security;

    public function __construct(EntityManagerInterface $entityManager, Security $security)
    {
        $this->entityManager = $entityManager;
        $this->security = $security;
    }

    public function process(mixed $data, Operation $operation, array $uriVariables = [], array $context = []): void
    {
        /** @var User $user */
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