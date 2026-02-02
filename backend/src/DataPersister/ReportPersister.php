<?php

namespace App\DataPersister;

use AbstractDataPersister;
use ApiPlatform\Metadata\Operation;
use App\Entity\Report;
use App\Interfaces\ReportableInterface;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Bundle\SecurityBundle\Security;

/**
 * Handles the creation of Report entities for moderation purposes.
 *
 * Responsibilities:
 * - Validates that the authenticated user exists
 * - Validates the reportable entity class (must implement ReportableInterface)
 * - Ensures the target entity exists
 * - Prevents duplicate reports from the same user
 * - Associates the report with the reporting user
 * - Persists the report to the database
 */
class ReportPersister extends AbstractDataPersister
{
    public function __construct(
        EntityManagerInterface $entityManager,
        Security $security,
    ) {
        parent::__construct($entityManager, $security);
    }

    public function process(mixed $data, Operation $operation, array $uriVariables = [], array $context = []): Report
    {
        if (!$data instanceof Report) {
            return $data;
        }

        $user = $this->getAuthenticatedUser();

        $reportableEntityClass = "App\\Entity\\" . $data->getReportableEntity();
        if (!class_exists($reportableEntityClass) || !in_array(ReportableInterface::class, class_implements($reportableEntityClass))) {
            throw new \InvalidArgumentException("{$reportableEntityClass} does not implement ReportableInterface.");
        }

        $repository = $this->entityManager->getRepository($reportableEntityClass);
        $reportableId = $data->getReportableId();
        $entity = $repository->find($reportableId);

        if (!$entity) {
            throw new \InvalidArgumentException('The entity with the ID: ' . $reportableId . ' does not exist.');
        }

        $existingReport = $this->entityManager->getRepository(Report::class)->findOneBy([
            'reportedBy' => $user,
            'reportableId' => $reportableId,
            'reportableEntity' => $data->getReportableEntity(),
        ]);

        if ($existingReport) {
            throw new \InvalidArgumentException('You have already reported this entity.');
        }

        $data->setReportedBy($user);
        $data->setReportedAt(new \DateTimeImmutable());
        $data->setReportableEntity($reportableEntityClass);

        $this->persist($data);

        return $data;
    }
}
