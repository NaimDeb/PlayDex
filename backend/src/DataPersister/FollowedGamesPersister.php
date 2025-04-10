<?php

namespace App\DataPersister;

use ApiPlatform\Metadata\Operation;
use ApiPlatform\State\ProcessorInterface;
use App\Entity\FollowedGames;
use App\Entity\Patchnote;
use App\Entity\User;

use Doctrine\ORM\EntityManagerInterface;
use Symfony\Bundle\SecurityBundle\Security;

class FollowedGamesPersister implements ProcessorInterface
{
    public function __construct(
        private readonly EntityManagerInterface $entityManager,
        private readonly Security $security,
    ) {}

    public function process(mixed $data, Operation $operation, array $uriVariables = [], array $context = []): Patchnote
    {
        if ($data instanceof FollowedGames) {

            /**
             * @var User $user
             */
            $user = $this->security->getUser();

            if (!$user) {
                throw new \Symfony\Component\Security\Core\Exception\AccessDeniedException('Not authenticated');
            }


            $userList = $user->getFollowedGames();

            

            // Roles
            $data->setCreatedBy($user);

            // initialise createdAt
            $data->setCreatedAt(new \DateTimeImmutable());



            $this->entityManager->persist($data);
            $this->entityManager->flush();
        }

        return $data;
    }
}