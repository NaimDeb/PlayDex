<?php

namespace App\Repository;

use App\Entity\FollowedGames;
use App\Entity\Game;
use App\Entity\User;
use App\Interfaces\Repository\FollowedGamesRepositoryInterface;
use Doctrine\Bundle\DoctrineBundle\Repository\ServiceEntityRepository;
use Doctrine\Persistence\ManagerRegistry;

/**
 * @extends ServiceEntityRepository<FollowedGames>
 */
class FollowedGamesRepository extends ServiceEntityRepository implements FollowedGamesRepositoryInterface
{
    public function __construct(ManagerRegistry $registry)
    {
        parent::__construct($registry, FollowedGames::class);
    }

    public function findByUser(User $user): array
    {
        return $this->createQueryBuilder('fg')
            ->where('fg.user = :user')
            ->setParameter('user', $user)
            ->getQuery()
            ->getResult();
    }

    public function findByGame(Game $game): array
    {
        return $this->createQueryBuilder('fg')
            ->where('fg.game = :game')
            ->setParameter('game', $game)
            ->getQuery()
            ->getResult();
    }

    public function isFollowing(User $user, Game $game): bool
    {
        return $this->findByUserAndGame($user, $game) !== null;
    }

    public function findByUserAndGame(User $user, Game $game): ?FollowedGames
    {
        return $this->findOneBy([
            'user' => $user,
            'game' => $game,
        ]);
    }

    public function countFollowers(Game $game): int
    {
        return $this->createQueryBuilder('fg')
            ->select('COUNT(fg.id)')
            ->where('fg.game = :game')
            ->setParameter('game', $game)
            ->getQuery()
            ->getSingleScalarResult();
    }

    public function countFollowedByUser(User $user): int
    {
        return $this->createQueryBuilder('fg')
            ->select('COUNT(fg.id)')
            ->where('fg.user = :user')
            ->setParameter('user', $user)
            ->getQuery()
            ->getSingleScalarResult();
    }
}
