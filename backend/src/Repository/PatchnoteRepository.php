<?php

namespace App\Repository;

use App\Entity\Game;
use App\Entity\Patchnote;
use App\Entity\User;
use App\Interfaces\Repository\PatchnoteRepositoryInterface;
use Doctrine\Bundle\DoctrineBundle\Repository\ServiceEntityRepository;
use Doctrine\Persistence\ManagerRegistry;

/**
 * @extends ServiceEntityRepository<Patchnote>
 */
class PatchnoteRepository extends ServiceEntityRepository implements PatchnoteRepositoryInterface
{
    public function __construct(ManagerRegistry $registry)
    {
        parent::__construct($registry, Patchnote::class);
    }

    public function findActiveByGame(Game $game): array
    {
        return $this->createQueryBuilder('p')
            ->where('p.game = :game')
            ->andWhere('p.isDeleted = false')
            ->setParameter('game', $game)
            ->orderBy('p.releasedAt', 'DESC')
            ->getQuery()
            ->getResult();
    }

    public function findByUser(User $user): array
    {
        return $this->createQueryBuilder('p')
            ->where('p.createdBy = :user')
            ->setParameter('user', $user)
            ->orderBy('p.createdAt', 'DESC')
            ->getQuery()
            ->getResult();
    }

    public function findRecentForUser(User $user, \DateTimeInterface $since): array
    {
        return $this->createQueryBuilder('p')
            ->innerJoin('p.game', 'g')
            ->innerJoin('g.followedGames', 'fg')
            ->where('fg.user = :user')
            ->andWhere('p.isDeleted = false')
            ->andWhere('p.createdAt > :since')
            ->setParameter('user', $user)
            ->setParameter('since', $since)
            ->orderBy('p.createdAt', 'DESC')
            ->getQuery()
            ->getResult();
    }

    public function findByGameOrderedByReleaseDate(Game $game, int $limit = 10): array
    {
        return $this->createQueryBuilder('p')
            ->where('p.game = :game')
            ->andWhere('p.isDeleted = false')
            ->setParameter('game', $game)
            ->orderBy('p.releasedAt', 'DESC')
            ->setMaxResults($limit)
            ->getQuery()
            ->getResult();
    }

    public function findByExternalId(string $externalId): ?Patchnote
    {
        return $this->findOneBy(['externalId' => $externalId]);
    }

    public function countByGame(Game $game): int
    {
        return $this->createQueryBuilder('p')
            ->select('COUNT(p.id)')
            ->where('p.game = :game')
            ->andWhere('p.isDeleted = false')
            ->setParameter('game', $game)
            ->getQuery()
            ->getSingleScalarResult();
    }
}
