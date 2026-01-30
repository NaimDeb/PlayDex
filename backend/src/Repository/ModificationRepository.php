<?php

namespace App\Repository;

use App\Entity\Modification;
use App\Entity\Patchnote;
use App\Entity\User;
use App\Interfaces\Repository\ModificationRepositoryInterface;
use Doctrine\Bundle\DoctrineBundle\Repository\ServiceEntityRepository;
use Doctrine\Persistence\ManagerRegistry;

/**
 * @extends ServiceEntityRepository<Modification>
 */
class ModificationRepository extends ServiceEntityRepository implements ModificationRepositoryInterface
{
    public function __construct(ManagerRegistry $registry)
    {
        parent::__construct($registry, Modification::class);
    }

    public function findByPatchnote(Patchnote $patchnote): array
    {
        return $this->createQueryBuilder('m')
            ->where('m.patchnote = :patchnote')
            ->andWhere('m.isDeleted = false')
            ->setParameter('patchnote', $patchnote)
            ->orderBy('m.createdAt', 'DESC')
            ->getQuery()
            ->getResult();
    }

    public function findByUser(User $user): array
    {
        return $this->createQueryBuilder('m')
            ->where('m.user = :user')
            ->setParameter('user', $user)
            ->orderBy('m.createdAt', 'DESC')
            ->getQuery()
            ->getResult();
    }

    public function findRecent(\DateTimeInterface $since, int $limit = 10): array
    {
        return $this->createQueryBuilder('m')
            ->where('m.createdAt > :since')
            ->andWhere('m.isDeleted = false')
            ->setParameter('since', $since)
            ->orderBy('m.createdAt', 'DESC')
            ->setMaxResults($limit)
            ->getQuery()
            ->getResult();
    }

    public function countByPatchnote(Patchnote $patchnote): int
    {
        return $this->createQueryBuilder('m')
            ->select('COUNT(m.id)')
            ->where('m.patchnote = :patchnote')
            ->andWhere('m.isDeleted = false')
            ->setParameter('patchnote', $patchnote)
            ->getQuery()
            ->getSingleScalarResult();
    }

    public function countByUser(User $user): int
    {
        return $this->createQueryBuilder('m')
            ->select('COUNT(m.id)')
            ->where('m.user = :user')
            ->setParameter('user', $user)
            ->getQuery()
            ->getSingleScalarResult();
    }
}
