<?php

namespace App\State\Processor;

use ApiPlatform\Metadata\Operation;
use App\Entity\Modification;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Bundle\SecurityBundle\Security;

class ModificationProcessor extends AbstractProcessor
{
    public function __construct(
        EntityManagerInterface $entityManager,
        Security $security,
    ) {
        parent::__construct($entityManager, $security);
    }

    public function process(mixed $data, Operation $operation, array $uriVariables = [], array $context = []): Modification
    {
        if ($data instanceof Modification) {
            $user = $this->getAuthenticatedUser();
            $data->setUser($user);
            $data->setCreatedAtValue();

            $this->persist($data);
        }

        return $data;
    }
}
