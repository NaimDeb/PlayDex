<?php

namespace App\State\Processor;

use ApiPlatform\State\ProcessorInterface;
use App\Entity\User;
use App\Interfaces\Entity\SoftDeletableInterface;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Bundle\SecurityBundle\Security;
use Symfony\Component\HttpKernel\Exception\AccessDeniedHttpException;

abstract class AbstractProcessor implements ProcessorInterface
{
    public function __construct(
        protected EntityManagerInterface $entityManager,
        protected ?Security $security = null,
    ) {}

    protected function getAuthenticatedUser(): User
    {
        $user = $this->security->getUser();
        if (!$user instanceof User) {
            throw new AccessDeniedHttpException('Authentication required');
        }
        return $user;
    }

    protected function persist(object $entity): void
    {
        $this->entityManager->persist($entity);
        $this->entityManager->flush();
    }

    protected function softDelete(SoftDeletableInterface $entity): void
    {
        $entity->setIsDeleted(true);
        $this->persist($entity);
    }
}
