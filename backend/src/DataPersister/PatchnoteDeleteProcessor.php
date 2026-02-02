<?php

namespace App\DataPersister;

use AbstractDataPersister;
use ApiPlatform\Metadata\Operation;
use App\Entity\Patchnote;
use App\Entity\Report;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Bundle\SecurityBundle\Security;
use Symfony\Component\HttpKernel\Exception\BadRequestHttpException;
use App\Service\SoftDeleteService;

/**
 * Handles deletion (soft-delete) of Patchnote entities.
 *
 * Responsibilities:
 * - Validates that the patchnote exists
 * - Prevents deletion of already-deleted patchnotes
 * - Cascades soft-deletion to related modifications and reports
 * - Marks patchnote as deleted (soft-delete)
 * - Persists changes to the database
 */
class PatchnoteDeleteProcessor extends AbstractDataPersister
{
    public function __construct(
        EntityManagerInterface $entityManager,
        private SoftDeleteService $softDeleteService,
        Security $security
    ) {
        parent::__construct($entityManager, $security);
    }

    public function process(mixed $data, Operation $operation, array $uriVariables = [], array $context = []): void
    {
        if (!$data instanceof Patchnote) {
            return;
        }

        if ($data->isDeleted()) {
            throw new BadRequestHttpException('This patchnote has already been deleted.');
        }

        foreach ($data->getModification() as $modification) {
            $modification->setIsDeleted(true);
            $this->entityManager->persist($modification);
            $this->softDeleteService->softDeleteRelatedReports('Modification', $modification->getId());
        }

        $this->softDeleteService->softDeleteWithReports($data, 'Patchnote', 'createdBy');
    }
}
