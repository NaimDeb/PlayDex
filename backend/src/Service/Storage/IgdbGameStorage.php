<?php

namespace App\Service\Storage;

use App\Interfaces\Api\DataStorageInterface;
use App\Service\DatabaseOperationService;
use App\Service\IgdbDataProcessorService;

/**
 * Stores IGDB games in the database with optimized transaction handling
 */
class IgdbGameStorage implements DataStorageInterface
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
            [$gameApiIds, $allGenreApiIds, $allCompanyApiIds, $gameIdMap] =
                $this->dataProcessor->extractGameIdentifiers($data);

            // Bulk fetch existing records
            [$gameIdMap, $genreIdMap, $companyIdMap] =
                $this->dataProcessor->fetchExistingGameRecords(
                    $gameApiIds,
                    $allGenreApiIds,
                    $allCompanyApiIds,
                    $gameIdMap,
                    $connection
                );

            // Insert/update games
            [$gameIdMap, $newGameIds] =
                $this->dataProcessor->insertOrUpdateGames($data, $gameIdMap, $connection);

            // Handle relationships (genres and companies)
            $this->updateGameRelationships($data, $gameIdMap, $genreIdMap, $companyIdMap, $connection);

            $connection->commit();
            gc_collect_cycles();
        } catch (\Exception $e) {
            $connection->rollBack();
            throw $e;
        }
    }

    /**
     * Update game relationships with genres and companies
     */
    private function updateGameRelationships(
        array $data,
        array $gameIdMap,
        array $genreIdMap,
        array $companyIdMap,
        $connection
    ): void {
        // Fetch existing relationships
        $existingGenreRelations = [];
        $existingCompanyRelations = [];

        if (!empty($gameIdMap)) {
            $gameDbIds = array_values($gameIdMap);
            $placeholders = implode(',', array_fill(0, count($gameDbIds), '?'));

            $existingGenreQuery = $connection->prepare(
                "SELECT game_id, genre_id FROM genre_game WHERE game_id IN ($placeholders)"
            );
            $existingGenreRelations = $existingGenreQuery->executeQuery($gameDbIds)->fetchAllAssociative();

            $existingCompanyQuery = $connection->prepare(
                "SELECT game_id, company_id FROM company_game WHERE game_id IN ($placeholders)"
            );
            $existingCompanyRelations = $existingCompanyQuery->executeQuery($gameDbIds)->fetchAllAssociative();
        }

        // Calculate relationship changes
        [$genresToAdd, $companiesToAdd, $genresToRemove, $companiesToRemove] =
            $this->dataProcessor->calculateGameRelationshipChanges(
                $data,
                $gameIdMap,
                $genreIdMap,
                $companyIdMap,
                $existingGenreRelations,
                $existingCompanyRelations
            );

        // Execute removals
        foreach ($genresToRemove as $relation) {
            $connection->executeQuery(
                "DELETE FROM genre_game WHERE game_id = ? AND genre_id = ?",
                [$relation['game_id'], $relation['genre_id']]
            );
        }

        foreach ($companiesToRemove as $relation) {
            $connection->executeQuery(
                "DELETE FROM company_game WHERE game_id = ? AND company_id = ?",
                [$relation['game_id'], $relation['company_id']]
            );
        }

        // Execute additions
        if (!empty($genresToAdd)) {
            $uniqueGenresToAdd = [];
            foreach ($genresToAdd as $relation) {
                $key = $relation['game_id'] . '-' . $relation['genre_id'];
                $uniqueGenresToAdd[$key] = $relation;
            }
            $this->dbService->insertRelationships($uniqueGenresToAdd, 'genre_game', 'game_id', 'genre_id', $connection);
        }

        if (!empty($companiesToAdd)) {
            $uniqueCompaniesToAdd = [];
            foreach ($companiesToAdd as $relation) {
                $key = $relation['game_id'] . '-' . $relation['company_id'];
                $uniqueCompaniesToAdd[$key] = $relation;
            }
            $this->dbService->insertRelationships($uniqueCompaniesToAdd, 'company_game', 'game_id', 'company_id', $connection);
        }
    }

    public function getTableName(): string
    {
        return 'game';
    }
}
