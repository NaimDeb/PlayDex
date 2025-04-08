<?php

namespace App\DataPersister;

use ApiPlatform\Metadata\Operation;
use ApiPlatform\State\ProcessorInterface;
use App\Entity\Modification;
use App\Entity\Patchnote;
use App\Entity\User;
use App\Entity\UserDetails;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Bundle\SecurityBundle\Security;
use Symfony\Component\PasswordHasher\Hasher\UserPasswordHasherInterface;

class ModificationPersister implements ProcessorInterface
{
    public function __construct(
        private readonly EntityManagerInterface $entityManager,
        private readonly Security $security,
    ) {}

    public function process(mixed $data, Operation $operation, array $uriVariables = [], array $context = []): Modification
    {
        if ($data instanceof Modification) {


            $user = $this->security->getUser();

            if (!$user) {
                throw new \Symfony\Component\Security\Core\Exception\AccessDeniedException('Not authenticated');
            }


            // Roles
            $data->setUser($user);

            // initialise createdAt
            $data->setCreatedAt(new \DateTimeImmutable());



            // Todo : all the complicated things to do :(


            $this->entityManager->persist($data);
            $this->entityManager->flush();
        }

        return $data;
    }
}