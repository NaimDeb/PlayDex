<?php

namespace App\Repository;

use App\Entity\User;
use App\Entity\Warning;
use App\Interfaces\Repository\WarningRepositoryInterface;
use Doctrine\Bundle\DoctrineBundle\Repository\ServiceEntityRepository;
use Doctrine\Persistence\ManagerRegistry;

/**
 * @extends ServiceEntityRepository<Warning>
 */
class WarningRepository extends ServiceEntityRepository implements WarningRepositoryInterface
{
    public function __construct(ManagerRegistry $registry)
    {
        parent::__construct($registry, Warning::class);
    }

    public function findByUser(User $user): array
    {
        return $this->createQueryBuilder('w')
            ->where('w.reportedUserId = :user')
            ->setParameter('user', $user)
            ->orderBy('w.id', 'DESC')
            ->getQuery()
            ->getResult();
    }

    public function findByAdmin(User $admin): array
    {
        return $this->createQueryBuilder('w')
            ->where('w.warnedBy = :admin')
            ->setParameter('admin', $admin)
            ->orderBy('w.id', 'DESC')
            ->getQuery()
            ->getResult();
    }

    public function countByUser(User $user): int
    {
        return $this->createQueryBuilder('w')
            ->select('COUNT(w.id)')
            ->where('w.reportedUserId = :user')
            ->setParameter('user', $user)
            ->getQuery()
            ->getSingleScalarResult();
    }

    public function findRecentByUser(User $user, \DateTimeInterface $since): array
    {
        return $this->createQueryBuilder('w')
            ->where('w.reportedUserId = :user')
            ->andWhere('w.id > :sinceId')
            ->setParameter('user', $user)
            ->setParameter('sinceId', 0)
            ->orderBy('w.id', 'DESC')
            ->getQuery()
            ->getResult();
    }
}
