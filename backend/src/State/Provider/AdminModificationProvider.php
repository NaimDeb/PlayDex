<?php

namespace App\State\Provider;

use ApiPlatform\Metadata\CollectionOperationInterface;
use ApiPlatform\Metadata\Operation;
use ApiPlatform\State\ProviderInterface;
use App\Repository\ReportRepository;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Component\DependencyInjection\Attribute\Autowire;

final class AdminModificationProvider implements ProviderInterface
{
    public function __construct(
        private EntityManagerInterface $entityManager,
        private ReportRepository $reportRepository,
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

        // Filter out modifications whose patchnotes are deleted and add report count
        $filteredData = [];
        foreach ($data as $modification) {
            // Check if the modification itself is deleted
            if (method_exists($modification, 'isDeleted') && $modification->isDeleted()) {
                continue;
            }

            // Check if the related patchnote is deleted
            $patchnote = $modification->getPatchnote();
            if ($patchnote && method_exists($patchnote, 'isDeleted') && $patchnote->isDeleted()) {
                continue;
            }

            // Calculate and set report count
            $reportCount = $this->reportRepository->countReportsForEntity(
                'Modification',
                $modification->getId()
            );
            $modification->setReportCount($reportCount);

            $filteredData[] = $modification;
        }

        return $filteredData;
    }
}
