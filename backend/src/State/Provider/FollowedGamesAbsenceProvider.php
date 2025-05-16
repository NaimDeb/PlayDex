<?php

namespace App\State\Provider;

use ApiPlatform\Metadata\Delete;
use ApiPlatform\Metadata\Operation;
use ApiPlatform\State\ProviderInterface;
use ApiPlatform\Symfony\Security\Exception\AccessDeniedException;
use App\Entity\FollowedGames;
use App\Entity\Game;
use App\Entity\Patchnote;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Bundle\SecurityBundle\Security;
use Symfony\Component\HttpKernel\Exception\BadRequestHttpException;
use Symfony\Component\HttpKernel\Exception\NotFoundHttpException;

class FollowedGamesAbsenceProvider implements ProviderInterface
{
    public function __construct(private EntityManagerInterface $entityManager, private Security $security) {}

    public function provide(Operation $operation, array $uriVariables = [], array $context = []): object|array|null
    {
        $user = $this->security->getUser();

        if (!$user) {
            throw new AccessDeniedException('Not authenticated');
        }

        // Get all FollowedGames for the user
        $followedGames = $this->entityManager->getRepository(FollowedGames::class)
            ->findBy(['user' => $user]);

        if (!$followedGames) {
            return [];
        }

        // Filter: only those where game.updatedAt > followedGame.lastCheckedAt
        $result = [];
        foreach ($followedGames as $followedGame) {
            /** @var ?Game $game */
            $game = $followedGame->getGame();
            if (!$game) {
                continue;
            }
            $gameUpdatedAt = $game->getLastUpdatedAt();
            $lastCheckedAt = $followedGame->getLastCheckedAt();

            // Check patchnotes for this game
            $patchnotes = $this->entityManager->getRepository(Patchnote::class)
                ->findBy(['game' => $game]);
            $newPatchnoteCount = 0;
            foreach ($patchnotes as $patchnote) {
                $patchnoteCreatedAt = $patchnote->getCreatedAt();
                if ($patchnoteCreatedAt && (!$lastCheckedAt || $patchnoteCreatedAt > $lastCheckedAt)) {
                    $newPatchnoteCount++;
                }
            }

            // If there are new patchnotes, add to result
            if ($newPatchnoteCount > 0) {
                $result[] = [
                    'followedGame' => $followedGame,
                    'newCount' => $newPatchnoteCount,
                ];
                continue; // skip further checks for this game
            }

            // If never checked, or game updated after last check
            if ($gameUpdatedAt && (!$lastCheckedAt || $gameUpdatedAt > $lastCheckedAt)) {
                $result[] = [
                    'followedGame' => $followedGame,
                    'newCount' => 0,
                ];
            }
        }

        return $result;
    }
}
