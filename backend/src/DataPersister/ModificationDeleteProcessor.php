<?php

namespace App\DataPersister;

use AbstractDataPersister;
use ApiPlatform\Metadata\Operation;
use App\Entity\Modification;
use App\Entity\Report;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Bundle\SecurityBundle\Security;
use Symfony\Component\HttpKernel\Exception\BadRequestHttpException;
use App\Service\WarningService;

/**
 * Handles deletion (soft-delete) of Modification entities.
 *
 * Responsibilities:
 * - Validates that the modification exists
 * - Prevents deletion of already-deleted modifications
 * - Creates warning records for associated reports
 * - Marks modification as deleted (soft-delete)
 * - Persists changes to the database
 */
class ModificationDeleteProcessor extends AbstractDataPersister
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
        if (!$data instanceof Modification) {
            return;
        }

        if ($data->isDeleted()) {
            throw new BadRequestHttpException('This modification has already been deleted.');
        }

        $data->setIsDeleted(true);

        $reports = $this->entityManager->getRepository(Report::class)->findBy([
            'reportableEntity' => 'Modification',
            'reportableId' => $data->getId(),
            'isDeleted' => false
        ]);

        foreach ($reports as $report) {
            $report->setIsDeleted(true);
            $this->entityManager->persist($report);
        }

        $this->entityManager->persist($data);
        $this->entityManager->flush();

        $author = $data->getUser();
        $admin = $this->security->getUser();

        if ($author && $author !== $admin) {
            $this->warningService->warnUserForDeletion(
                target: $author,
                admin: $admin,
            );
        }
    }
}
