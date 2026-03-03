<?php

namespace App\DataPersister;


use ApiPlatform\Metadata\Operation;
use App\Entity\Patchnote;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Bundle\SecurityBundle\Security;

/**
 * Handles the creation and initialization of Patchnote entities.
 *
 * Responsibilities:
 * - Validates incoming Patchnote data
 * - Associates the patchnote with the authenticated user (creator)
 * - Sets creation timestamp
 * - Persists the patchnote to the database
 */
class PatchnotePersister extends AbstractDataPersister
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
