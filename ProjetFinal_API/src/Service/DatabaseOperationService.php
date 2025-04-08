<?php

namespace App\Service;

use Doctrine\DBAL\Connection;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Component\Console\Helper\ProgressBar;

class DatabaseOperationService
{
    private $entityManager;

    public function __construct(EntityManagerInterface $entityManager)
    {
        $this->entityManager = $entityManager;
    }

    /**
     * Increase memory limit for database operations
     */
    public function setMemoryLimit(string $limit = '1024M'): void
    {
        ini_set('memory_limit', $limit);
    }

    /**
     * Get database connection
     */
    public function getConnection(): Connection
    {
        return $this->entityManager->getConnection();
    }

    /**
     * Optimize database connection to save memory
     */
    public function optimizeDatabaseConnection(): void
    {
        $connection = $this->getConnection();
        $connection->getConfiguration()->setMiddlewares([]);
    }

    /**
     * Prepare a SQL insert statement
     */
    public function prepareInsertStatement(Connection $connection, string $sql)
    {
        return $connection->prepare($sql);
    }

    /**
     * Execute a transaction with a prepared statement
     */
    public function executeTransaction(Connection $connection, $stmt, array $data, callable $processor, $progressBar = null): void
    {
        // Begin transaction
        $connection->beginTransaction();

        try {
            // Process data using the provided callback
            $processor($stmt, $data, $progressBar);

            // Commit the transaction
            $connection->commit();

            // Force garbage collection
            gc_collect_cycles();
        } catch (\Exception $e) {
            $connection->rollBack();
            throw $e;
        }
    }

    /**
     * Clean up and manage memory
     */
    public function manageMemoryUsage(ProgressBar $progressBar = null, int $memoryUsage = 0): void
    {
        if ($memoryUsage > 900) {
            if ($progressBar) {
                $progressBar->setMessage('Clearing memory...', 'status');
            }

            $this->entityManager->clear();
            gc_collect_cycles();
            $this->entityManager->getConnection()->close();
            $this->entityManager->getConnection()->connect();
        }
    }

    /**
     * Insert relationships in batches
     */
    public function insertRelationships(array $relations, string $table, string $field1, string $field2, Connection $connection): void
    {
        $chunks = array_chunk(array_values($relations), 100);

        foreach ($chunks as $chunk) {
            $values = [];
            $params = [];

            foreach ($chunk as $relation) {
                $values[] = "(?, ?)";
                $params[] = $relation[$field1];
                $params[] = $relation[$field2];
            }

            // Use INSERT IGNORE to skip duplicates without error
            $sql = "INSERT IGNORE INTO $table ($field1, $field2) VALUES " . implode(', ', $values);
            $connection->executeQuery($sql, $params);
        }
    }

    /**
     * Log database errors
     * 
     * @param \Exception $e The exception that occurred
     * @param SymfonyStyle|null $io The IO interface for console output
     * @param array $data Optional data that was being processed when error occurred
     */
    public function logDatabaseError(\Exception $e, $io = null, array $data = []): void
    {
        if ($io) {
            $io->error("Database error: " . $e->getMessage());
            $io->error("Stack trace: " . $e->getTraceAsString());

            // Debugging information if available
            if (!empty($data)) {
                $currentItem = end($data);
                if (isset($currentItem['id'])) {
                    $io->error("Error occurred while processing item with API ID: " . $currentItem['id']);
                }
            }
        }

        // Optionally log to file or other logging services
        error_log("Database error: " . $e->getMessage());
    }
}
