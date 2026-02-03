<?php

namespace App\Service\Storage;

use App\Interfaces\Api\DataStorageInterface;
use App\Service\DatabaseOperationService;
use App\Service\IgdbDataProcessorService;

/**
 * Stores IGDB companies in the database
 */
class IgdbCompanyStorage implements DataStorageInterface
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

        $this->dbService->setMemoryLimit();
        $connection = $this->dbService->getConnection();

        $sql = 'INSERT INTO company (api_id, name) 
                VALUES (:apiId, :name) 
                ON DUPLICATE KEY UPDATE 
                name = VALUES(name)';

        $stmt = $this->dbService->prepareInsertStatement($connection, $sql);

        $this->dbService->executeTransaction(
            $connection,
            $stmt,
            $data,
            [$this->dataProcessor, 'processCompanies'],
            $progressBar
        );
    }

    public function getTableName(): string
    {
        return 'company';
    }
}
