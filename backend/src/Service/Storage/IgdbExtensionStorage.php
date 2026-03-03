<?php

namespace App\Service\Storage;

use App\Interfaces\Api\DataStorageInterface;
use App\Service\DatabaseOperationService;
use App\Service\IgdbDataProcessorService;

/**
 * Stores IGDB extensions/DLCs in the database with optimized transaction handling
 */
class IgdbExtensionStorage implements DataStorageInterface
{
    private DatabaseOperationService $dbService;
    private IgdbDataProcessorService $dataProcessor;

    public function __construct(
        DatabaseOperationService $dbService,
        IgdbDataProcessorService $dataProcessor
    ) {
        $this->dbService = $dbService;
        $this->dataProcessor = $dataProcessor;
    }

    public function store(array $data, $progressBar = null): void
    {
        if (empty($data)) {
            return;
        }

        $this->dbService->setMemoryLimit('512M');
        $connection = $this->dbService->getConnection();
        $connection->beginTransaction();

        try {
            // Extract identifiers
            [$extensionApiIds, $allGameApiIds, $extensionIdMap] =
                $this->dataProcessor->extractExtensionIdentifiers($data);

            // Bulk fetch existing records
            [$extensionIdMap, $gameIdMap] =
                $this->dataProcessor->fetchExistingExtensionRecords(
                    $extensionApiIds,
                    $allGameApiIds,
                    $extensionIdMap,
                    $connection
                );

            // Insert/update extensions
            [$extensionIdMap, $newExtensionIds] =
                $this->dataProcessor->insertOrUpdateExtensions(
                    $data,
                    $extensionIdMap,
                    $gameIdMap,
                    $connection
                );

            $connection->commit();
            gc_collect_cycles();
        } catch (\Exception $e) {
            $connection->rollBack();
            throw $e;
        }
    }

    public function getTableName(): string
    {
        return 'extension';
    }
}
