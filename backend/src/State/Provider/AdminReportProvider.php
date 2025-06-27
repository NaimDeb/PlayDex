<?php

namespace App\State\Provider;

use ApiPlatform\Metadata\CollectionOperationInterface;
use ApiPlatform\Metadata\Operation;
use ApiPlatform\State\ProviderInterface;
use App\Entity\Modification;
use App\Entity\Patchnote;
use App\Repository\ModificationRepository;
use App\Repository\PatchnoteRepository;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Component\DependencyInjection\Attribute\Autowire;

final class AdminReportProvider implements ProviderInterface
{
    public function __construct(
        private EntityManagerInterface $entityManager,
        private PatchnoteRepository $patchnoteRepository,
        private ModificationRepository $modificationRepository,
        #[Autowire(service: 'api_platform.doctrine.orm.state.collection_provider')]
        private ProviderInterface $collectionProvider,
    ) {}

    public function provide(Operation $operation, array $uriVariables = [], array $context = []): object|array|null
    {
        // Get data from the default provider
        $data = $this->collectionProvider->provide($operation, $uriVariables, $context);

        if (!$operation instanceof CollectionOperationInterface) {
            return $data;
        }

        // Enrich each report with entity details
        $enrichedData = [];
        foreach ($data as $report) {
            // Skip deleted reports
            if (method_exists($report, 'isDeleted') && $report->isDeleted()) {
                continue;
            }

            // Get the reported entity details
            $entityDetails = $this->getEntityDetails(
                $report->getReportableEntity(),
                $report->getReportableId()
            );

            // Add entity details to the report
            $report->entityDetails = $entityDetails;

            $enrichedData[] = $report;
        }

        return $enrichedData;
    }

    private function getEntityDetails(string $entityType, int $entityId): ?array
    {
        // Extract class name from fully qualified name (e.g., App\Entity\Patchnote -> Patchnote)
        $className = str_contains($entityType, '\\') ? substr(strrchr($entityType, '\\'), 1) : $entityType;

        switch ($className) {
            case 'Patchnote':
                $patchnote = $this->patchnoteRepository->find($entityId);
                if (!$patchnote) return null;

                return [
                    'type' => 'Patchnote',
                    'id' => $patchnote->getId(),
                    'title' => $patchnote->getTitle(),
                    'owner' => $patchnote->getCreatedBy() ? [
                        'id' => $patchnote->getCreatedBy()->getId(),
                        'username' => $patchnote->getCreatedBy()->getUsername(),
                    ] : null,
                    'game' => $patchnote->getGame() ? [
                        'id' => $patchnote->getGame()->getId(),
                        'title' => $patchnote->getGame()->getTitle(),
                    ] : null,
                ];

            case 'Modification':
                $modification = $this->modificationRepository->find($entityId);
                if (!$modification) return null;

                return [
                    'type' => 'Modification',
                    'id' => $modification->getId(),
                    'title' => $modification->getPatchnote() ? $modification->getPatchnote()->getTitle() : 'Patchnote supprimée',
                    'owner' => $modification->getUser() ? [
                        'id' => $modification->getUser()->getId(),
                        'username' => $modification->getUser()->getUsername(),
                    ] : null,
                    'game' => $modification->getPatchnote() && $modification->getPatchnote()->getGame() ? [
                        'id' => $modification->getPatchnote()->getGame()->getId(),
                        'title' => $modification->getPatchnote()->getGame()->getTitle(),
                    ] : null,
                    'patchnote' => $modification->getPatchnote() ? [
                        'id' => $modification->getPatchnote()->getId(),
                        'title' => $modification->getPatchnote()->getTitle(),
                    ] : null,
                ];

            default:
                return [
                    'type' => $className,
                    'id' => $entityId,
                    'title' => 'Entité inconnue',
                    'owner' => null,
                ];
        }
    }
}
