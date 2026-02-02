<?php

namespace App\DataPersister;

use AbstractDataPersister;
use ApiPlatform\Metadata\Operation;
use App\Entity\Patchnote;
use App\Entity\Report;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Bundle\SecurityBundle\Security;
use Symfony\Component\HttpKernel\Exception\BadRequestHttpException;
use App\Service\WarningService;

/**
 * Handles deletion (soft-delete) of Patchnote entities.
 *
 * Responsibilities:
 * - Validates that the patchnote exists
 * - Prevents deletion of already-deleted patchnotes
 * - Creates warning records for associated modifications and reports
 * - Marks patchnote as deleted (soft-delete)
 * - Persists changes to the database
 */
class PatchnoteDeleteProcessor extends AbstractDataPersister
{
    public function __construct(
        EntityManagerInterface $entityManager,
        private WarningService $warningService,
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

        $data->setIsDeleted(true);

        foreach ($data->getModification() as $modification) {
            $modification->setIsDeleted(true);
            $this->entityManager->persist($modification);

            $reports = $this->entityManager->getRepository(Report::class)->findBy([
                'reportableEntity' => 'Modification',
                'reportableId' => $modification->getId(),
                'isDeleted' => false
            ]);

            foreach ($reports as $report) {
                $report->setIsDeleted(true);
                $this->entityManager->persist($report);
            }
        }

        $reports = $this->entityManager->getRepository(Report::class)->findBy([
            'reportableEntity' => 'Patchnote',
            'reportableId' => $data->getId(),
            'isDeleted' => false
        ]);

        foreach ($reports as $report) {
            $report->setIsDeleted(true);
            $this->entityManager->persist($report);
        }

        $this->entityManager->persist($data);
        $this->entityManager->flush();

        $author = $data->getCreatedBy();
        $admin = $this->security->getUser();

        if ($author && $author !== $admin) {
            $this->warningService->warnUserForDeletion(
                target: $author,
                admin: $admin,
            );
        }
    }
}
