<?php

namespace App\State\Processor;

use ApiPlatform\Metadata\Operation;
use App\Entity\Patchnote;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Bundle\SecurityBundle\Security;

class PatchnoteProcessor extends AbstractProcessor
{
    public function __construct(
        EntityManagerInterface $entityManager,
        Security $security,
    ) {
        parent::__construct($entityManager, $security);
    }

    public function process(mixed $data, Operation $operation, array $uriVariables = [], array $context = []): Patchnote
    {
        if ($data instanceof Patchnote) {
            $user = $this->getAuthenticatedUser();
            $data->setCreatedBy($user);
            $data->setCreatedAtValue();
            $this->persist($data);
        }

        return $data;
    }
}
