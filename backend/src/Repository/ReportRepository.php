<?php

namespace App\Repository;

use App\Entity\Report;
use App\Entity\User;
use App\Interfaces\Repository\ReportRepositoryInterface;
use Doctrine\Bundle\DoctrineBundle\Repository\ServiceEntityRepository;
use Doctrine\Persistence\ManagerRegistry;

/**
 * @extends ServiceEntityRepository<Report>
 */
class ReportRepository extends ServiceEntityRepository implements ReportRepositoryInterface
{
    public function __construct(ManagerRegistry $registry)
    {
        parent::__construct($registry, Report::class);
    }

    public function countReportsForEntity(string $entityType, int $entityId): int
    {
        return $this->createQueryBuilder('r')
            ->select('COUNT(r.id)')
            ->andWhere('r.reportableEntity = :entityType')
            ->andWhere('r.reportableId = :entityId')
            ->andWhere('r.isDeleted = false')
            ->setParameter('entityType', $entityType)
            ->setParameter('entityId', $entityId)
            ->getQuery()
            ->getSingleScalarResult();
    }

    public function findByReporter(User $user): array
    {
        return $this->createQueryBuilder('r')
            ->where('r.reportedBy = :user')
            ->setParameter('user', $user)
            ->orderBy('r.reportedAt', 'DESC')
            ->getQuery()
            ->getResult();
    }

    public function findByEntityType(string $entityType): array
    {
        return $this->createQueryBuilder('r')
            ->where('r.reportableEntity = :entityType')
            ->andWhere('r.isDeleted = false')
            ->setParameter('entityType', $entityType)
            ->orderBy('r.reportedAt', 'DESC')
            ->getQuery()
            ->getResult();
    }

    public function findByEntity(string $entityType, int $entityId): array
    {
        return $this->createQueryBuilder('r')
            ->where('r.reportableEntity = :entityType')
            ->andWhere('r.reportableId = :entityId')
            ->andWhere('r.isDeleted = false')
            ->setParameter('entityType', $entityType)
            ->setParameter('entityId', $entityId)
            ->orderBy('r.reportedAt', 'DESC')
            ->getQuery()
            ->getResult();
    }

    public function hasUserReported(User $user, string $entityType, int $entityId): bool
    {
        $count = $this->createQueryBuilder('r')
            ->select('COUNT(r.id)')
            ->where('r.reportedBy = :user')
            ->andWhere('r.reportableEntity = :entityType')
            ->andWhere('r.reportableId = :entityId')
            ->setParameter('user', $user)
            ->setParameter('entityType', $entityType)
            ->setParameter('entityId', $entityId)
            ->getQuery()
            ->getSingleScalarResult();

        return $count > 0;
    }

    public function countByEntity(string $entityType, int $entityId): int
    {
        return $this->countReportsForEntity($entityType, $entityId);
    }

    public function findPending(int $limit = 50): array
    {
        return $this->createQueryBuilder('r')
            ->where('r.isDeleted = false')
            ->orderBy('r.reportedAt', 'ASC')
            ->setMaxResults($limit)
            ->getQuery()
            ->getResult();
    }
}
