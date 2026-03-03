<?php

namespace App\Service;

use App\Entity\Report;
use App\Interfaces\Entity\SoftDeletableInterface;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Bundle\SecurityBundle\Security;

/**
 * Handles soft-deletion operations with cascading report deletion and user warnings.
 *
 * Responsibilities:
 * - Soft-delete entities and their related reports
 * - Warn users when their content is deleted by admins
 * - Manage cascading deletions for reportable entities
 */
class SoftDeleteService
{
    public function __construct(
        private EntityManagerInterface $entityManager,
        private Security $security,
        private WarningService $warningService
    ) {}

    /**
     * Soft-delete an entity with cascading report deletion.
     *
     * @param SoftDeletableInterface $entity The entity to soft-delete
     * @param string $entityClass The entity class name (for report lookup)
     * @param string|null $authorPropertyName Property name to get the author (e.g., 'createdBy', 'user')
     */
    public function softDeleteWithReports(
        SoftDeletableInterface $entity,
        string $entityClass,
        ?string $authorPropertyName = null
    ): void {
        $entity->setIsDeleted(true);

        $this->softDeleteRelatedReports($entityClass, $entity->getId());
        $this->entityManager->persist($entity);
        $this->entityManager->flush();

        if ($authorPropertyName) {
            $this->warnAuthorIfDeleted($entity, $authorPropertyName);
        }
    }

    /**
     * Soft-delete related reports for an entity.
     *
     * @param string $reportableEntity The reportable entity class name
     * @param int $reportableId The entity ID
     */
    public function softDeleteRelatedReports(string $reportableEntity, int $reportableId): void
    {
        $reports = $this->entityManager->getRepository(Report::class)->findBy([
            'reportableEntity' => $reportableEntity,
            'reportableId' => $reportableId,
            'isDeleted' => false
        ]);

        foreach ($reports as $report) {
            $report->setIsDeleted(true);
            $this->entityManager->persist($report);
        }
    }

    /**
     * Warn the author if they are not the one deleting the entity.
     *
     * @param SoftDeletableInterface $entity The deleted entity
     * @param string $authorPropertyName Property name to get the author
     */
    private function warnAuthorIfDeleted(SoftDeletableInterface $entity, string $authorPropertyName): void
    {
        $getter = 'get' . ucfirst($authorPropertyName);
        if (!method_exists($entity, $getter)) {
            return;
        }

        $author = $entity->$getter();
        $admin = $this->security->getUser();

        if ($author && $author !== $admin) {
            $this->warningService->warnUserForDeletion(
                target: $author,
                admin: $admin,
            );
        }
    }
}
