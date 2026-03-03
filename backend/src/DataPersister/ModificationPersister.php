<?php

namespace App\DataPersister;


use ApiPlatform\Metadata\Operation;
use App\Entity\Modification;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Bundle\SecurityBundle\Security;

/**
 * Handles the creation of Modification entities (changes to patchnotes).
 *
 * Responsibilities:
 * - Validates incoming Modification data
 * - Associates the modification with the authenticated user
 * - Sets creation timestamp
 * - Persists the modification to the database
 * - TODO: Implement complex validation and diff calculation logic
 */
class ModificationPersister extends AbstractDataPersister
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
