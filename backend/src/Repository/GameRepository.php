<?php

namespace App\Repository;

use App\Entity\Game;
use App\Interfaces\Repository\GameRepositoryInterface;
use Doctrine\Bundle\DoctrineBundle\Repository\ServiceEntityRepository;
use Doctrine\Persistence\ManagerRegistry;

/**
 * @extends ServiceEntityRepository<Game>
 */
class GameRepository extends ServiceEntityRepository implements GameRepositoryInterface
{
    public function __construct(ManagerRegistry $registry)
    {
        parent::__construct($registry, Game::class);
    }


    public function findLatest(int $limit = 8): array
    {
        return $this->createQueryBuilder('g')
            ->where('g.releasedAt IS NOT NULL')
            ->orderBy('g.releasedAt', 'DESC')
            ->setMaxResults($limit)
            ->getQuery()
            ->getResult();
    }

    public function findByApiId(int $apiId): ?Game
    {
        return $this->findOneBy(['apiId' => $apiId]);
    }

    public function findBySteamId(int $steamId): ?Game
    {
        return $this->findOneBy(['steamId' => $steamId]);
    }

    public function findByTitle(string $title, int $limit = 10): array
    {
        return $this->createQueryBuilder('g')
            ->where('g.title LIKE :title')
            ->setParameter('title', '%' . $title . '%')
            ->setMaxResults($limit)
            ->getQuery()
            ->getResult();
    }

    public function findPopular(int $limit = 10): array
    {
        return $this->createQueryBuilder('g')
            ->leftJoin('g.followedGames', 'fg')
            ->groupBy('g.id')
            ->orderBy('COUNT(fg.id)', 'DESC')
            ->setMaxResults($limit)
            ->getQuery()
            ->getResult();
    }

    public function findWithRecentPatchnotes(\DateTimeInterface $since, int $limit = 10): array
    {
        return $this->createQueryBuilder('g')
            ->innerJoin('g.patchnotes', 'p')
            ->where('p.createdAt > :since')
            ->andWhere('p.isDeleted = false')
            ->setParameter('since', $since)
            ->groupBy('g.id')
            ->orderBy('MAX(p.createdAt)', 'DESC')
            ->setMaxResults($limit)
            ->getQuery()
            ->getResult();
    }

    public function getAllApiIds(): array
    {
        $result = $this->createQueryBuilder('g')
            ->select('g.apiId')
            ->where('g.apiId IS NOT NULL')
            ->getQuery()
            ->getScalarResult();

        return array_column($result, 'apiId');
    }
}
