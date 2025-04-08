<?php

namespace App\Service;

use Doctrine\DBAL\Connection;
use Symfony\Component\Console\Helper\ProgressBar;

class IgdbDataProcessorService
{
    /**
     * Extract game identifiers from API data
     */
    public function extractGameIdentifiers(array $games): array
    {
        $gameApiIds = array_column($games, 'id');
        $gameIdMap = []; // Will map API IDs to database IDs

        // Extract all genre and company IDs from games
        $allGenreApiIds = [];
        $allCompanyApiIds = [];
        
        foreach ($games as $game) {
            if (isset($game['genres'])) {
                foreach ($game['genres'] as $genre) {
                    $allGenreApiIds[] = $genre['id'];
                }
            }

            if (isset($game['involved_companies'])) {
                foreach ($game['involved_companies'] as $involvedCompany) {
                    if (isset($involvedCompany['company']) && isset($involvedCompany['company']['id'])) {
                        $allCompanyApiIds[] = $involvedCompany['company']['id'];
                    }
                }
            }
        }
        
        return [$gameApiIds, $allGenreApiIds, $allCompanyApiIds, $gameIdMap];
    }

    /**
     * Extract extension identifiers from API data
     */
    public function extractExtensionIdentifiers(array $extensions): array
    {
        $extensionApiIds = array_column($extensions, 'id');
        $extensionIdMap = []; // Will map API IDs to database IDs

        // Extract all game IDs from extensions
        $allGameApiIds = [];
        foreach ($extensions as $extension) {
            if (isset($extension['parent_game'])) {
                $allGameApiIds[] = $extension['parent_game'];
            }
        }
        
        return [$extensionApiIds, $allGameApiIds, $extensionIdMap];
    }

    /**
     * Fetch existing game records from the database
     */
    public function fetchExistingGameRecords(array $gameApiIds, array $allGenreApiIds, array $allCompanyApiIds, array $gameIdMap, Connection $connection): array
    {
        // Look up existing games
        if (!empty($gameApiIds)) {
            $placeholders = implode(',', array_fill(0, count($gameApiIds), '?'));

            if (!empty($placeholders)) {
                $existingGamesQuery = $connection->prepare("SELECT id, api_id FROM game WHERE api_id IN ($placeholders)");
                $existingGames = $existingGamesQuery->executeQuery(array_values($gameApiIds))->fetchAllAssociative();

                // Create mapping of API ID to database ID
                foreach ($existingGames as $game) {
                    $gameIdMap[$game['api_id']] = $game['id'];
                }
            }
        }

        // Get genre ID mappings
        $genreIdMap = $this->fetchEntityIdMappings($allGenreApiIds, 'genre', $connection);

        // Get company ID mappings
        $companyIdMap = $this->fetchEntityIdMappings($allCompanyApiIds, 'company', $connection);
        
        return [$gameIdMap, $genreIdMap, $companyIdMap];
    }

    /**
     * Fetch entity ID mappings by API IDs
     */
    private function fetchEntityIdMappings(array $apiIds, string $table, Connection $connection): array
    {
        $idMap = [];
        
        if (!empty($apiIds)) {
            $apiIds = array_unique($apiIds);

            if (!empty($apiIds)) {
                $placeholders = implode(',', array_fill(0, count($apiIds), '?'));
                
                // Convert all API IDs to integers to avoid SQL errors
                foreach ($apiIds as $key => $value) {
                    $apiIds[$key] = (int)$value;
                }

                $sql = "SELECT id, api_id FROM $table WHERE api_id IN ($placeholders)";
                $stmt = $connection->prepare($sql);
                $result = $stmt->executeQuery(array_values($apiIds));
                $entities = $result->fetchAllAssociative();

                foreach ($entities as $entity) {
                    $idMap[$entity['api_id']] = $entity['id'];
                }
            }
        }
        
        return $idMap;
    }

    /**
     * Insert or update games in the database
     */
    public function insertOrUpdateGames(array $games, array $gameIdMap, Connection $connection): array
    {
        $gameStmt = $connection->prepare('
            INSERT INTO game (api_id, title, description, released_at, image_url, last_updated_at) 
            VALUES (:apiId, :title, :description, :releasedAt, :imageUrl, :lastUpdatedAt) 
            ON DUPLICATE KEY UPDATE 
            title = :title,
            description = :description,
            released_at = :releasedAt,
            image_url = :imageUrl,
            last_updated_at = :lastUpdatedAt
        ');

        $newGameIds = []; // Track newly inserted game IDs

        foreach ($games as $game) {
            $releasedAt = isset($game['first_release_date'])
                ? date('Y-m-d H:i:s', $game['first_release_date'])
                : null;

            $imageUrl = isset($game['cover']['url'])
                ? 'https:' . $game['cover']['url']
                : null;

            // Insert or update the game
            $gameStmt->executeQuery([
                'apiId' => $game['id'],
                'title' => $game['name'],
                'description' => $game['summary'] ?? null,
                'releasedAt' => $releasedAt,
                'imageUrl' => $imageUrl,
                'lastUpdatedAt' => date('Y-m-d H:i:s')
            ]);

            // Get game ID (either existing or newly created)
            if (!isset($gameIdMap[$game['id']])) {
                $gameIdMap[$game['id']] = $connection->lastInsertId();
                $newGameIds[] = $gameIdMap[$game['id']]; // Track new IDs
            }
        }
        
        return [$gameIdMap, $newGameIds];
    }

    /**
     * Process companies in a transaction
     */
    public function processCompanies($stmt, array $companies, $progressBar = null): void
    {
        foreach ($companies as $company) {
            $stmt->execute([
                'apiId' => $company['id'],
                'name' => $company['name']
            ]);

            if ($progressBar) {
                $progressBar->advance();
            }
        }
    }

    /**
 * Fetch existing extension records from the database
 * 
 * @param array $extensionApiIds The API IDs of extensions
 * @param array $allGameApiIds The API IDs of related games
 * @param array $extensionIdMap The current mapping of extension API IDs to database IDs
 * @param Connection $connection The database connection
 * @return array Array of [extensionIdMap, gameIdMap]
 */
public function fetchExistingExtensionRecords(
    array $extensionApiIds, 
    array $allGameApiIds, 
    array $extensionIdMap, 
    Connection $connection
): array {
    // Find existing extensions in a single query
    if (!empty($extensionApiIds)) {
        $placeholders = implode(',', array_fill(0, count($extensionApiIds), '?'));

        if (!empty($placeholders)) {
            $existingExtensionsQuery = $connection->prepare("SELECT id, api_id FROM extension WHERE api_id IN ($placeholders)");
            $existingExtensions = $existingExtensionsQuery->executeQuery(array_values($extensionApiIds))->fetchAllAssociative();

            // Create mapping of API ID to database ID
            foreach ($existingExtensions as $extension) {
                $extensionIdMap[$extension['api_id']] = $extension['id'];
            }
        }
    }

    // Get game ID mappings in one query
    $gameIdMap = [];
    if (!empty($allGameApiIds)) {
        $allGameApiIds = array_unique($allGameApiIds);

        // Only proceed if we still have games after deduplication
        if (!empty($allGameApiIds)) {
            $placeholders = implode(',', array_fill(0, count($allGameApiIds), '?'));
            
            // Convert all game API IDs to integers to avoid SQL errors
            foreach ($allGameApiIds as $key => $value) {
                $allGameApiIds[$key] = (int)$value;
            }

            $sql = "SELECT id, api_id FROM game WHERE api_id IN ($placeholders)";
            $stmt = $connection->prepare($sql);
            $result = $stmt->executeQuery(array_values($allGameApiIds));
            $games = $result->fetchAllAssociative();

            foreach ($games as $game) {
                $gameIdMap[$game['api_id']] = $game['id'];
            }
        }
    }
    
    return [$extensionIdMap, $gameIdMap];
}

/**
 * Insert or update extensions in the database
 * 
 * @param array $extensions The extensions to insert or update
 * @param array $extensionIdMap Mapping of extension API IDs to database IDs
 * @param array $gameIdMap Mapping of game API IDs to database IDs
 * @param Connection $connection The database connection
 * @return array Array of [extensionIdMap, newExtensionIds]
 */
public function insertOrUpdateExtensions(
    array $extensions, 
    array $extensionIdMap, 
    array $gameIdMap, 
    Connection $connection
): array {
    $extensionStmt = $connection->prepare('
        INSERT INTO extension (api_id, title, description, released_at, image_url, game_id, last_updated_at) 
        VALUES (:apiId, :title, :description, :releasedAt, :imageUrl, :gameId, :lastUpdatedAt) 
        ON DUPLICATE KEY UPDATE 
        title = :title,
        description = :description,
        released_at = :releasedAt,
        image_url = :imageUrl,
        game_id = :gameId,
        last_updated_at = :lastUpdatedAt
    ');

    $newExtensionIds = []; // Track newly inserted extension IDs

    foreach ($extensions as $extension) {
        $releasedAt = isset($extension['first_release_date'])
            ? date('Y-m-d', $extension['first_release_date'])
            : null;

        $imageUrl = isset($extension['cover']['url'])
            ? 'https:' . $extension['cover']['url']
            : null;

        $gameId = isset($extension['parent_game']) && isset($gameIdMap[$extension['parent_game']])
            ? $gameIdMap[$extension['parent_game']]
            : null;

        // If the game Id is not found, skip this extension
        if ($gameId === null) {
            continue;
        }

        // Insert or update the extension
        $extensionStmt->executeQuery([
            'apiId' => $extension['id'],
            'title' => $extension['name'],
            'description' => $extension['summary'] ?? null,
            'releasedAt' => $releasedAt,
            'imageUrl' => $imageUrl,
            'gameId' => $gameId,
            'lastUpdatedAt' => date('Y-m-d')
        ]);

        // Get extension ID (either existing or newly created)
        if (!isset($extensionIdMap[$extension['id']])) {
            $extensionIdMap[$extension['id']] = $connection->lastInsertId();
            $newExtensionIds[] = $extensionIdMap[$extension['id']]; // Track new IDs
        }
    }
    
    return [$extensionIdMap, $newExtensionIds];
}

/**
 * Calculate relationships that need to be added or removed for games
 * 
 * @param array $games Array of game data
 * @param array $gameIdMap Mapping of game API IDs to database IDs
 * @param array $genreIdMap Mapping of genre API IDs to database IDs
 * @param array $companyIdMap Mapping of company API IDs to database IDs
 * @param array $existingGenreRelations Existing genre relationships
 * @param array $existingCompanyRelations Existing company relationships
 * @return array Array of [genresToAdd, companiesToAdd, genresToRemove, companiesToRemove]
 */
public function calculateGameRelationshipChanges(
    array $games, 
    array $gameIdMap, 
    array $genreIdMap, 
    array $companyIdMap, 
    array $existingGenreRelations, 
    array $existingCompanyRelations
): array {
    $genresToAdd = [];
    $companiesToAdd = [];
    $genresToRemove = [];
    $companiesToRemove = [];

    foreach ($games as $game) {
        if (!isset($gameIdMap[$game['id']])) {
            continue; // Skip if game ID not found
        }
        
        $gameId = $gameIdMap[$game['id']];
        $existingGameGenres = $existingGenreRelations[$gameId] ?? [];
        $existingGameCompanies = $existingCompanyRelations[$gameId] ?? [];

        // Process genre relationships
        $gameGenreIds = [];
        if (isset($game['genres'])) {
            foreach ($game['genres'] as $genre) {
                if (isset($genreIdMap[$genre['id']])) {
                    $gameGenreIds[] = $genreIdMap[$genre['id']];
                }
            }

            // Calculate genres to add/remove
            $genresToAddForGame = array_diff($gameGenreIds, $existingGameGenres);
            $genresToRemoveForGame = array_diff($existingGameGenres, $gameGenreIds);

            // Add to batch operations
            foreach ($genresToAddForGame as $genreId) {
                $genresToAdd[] = [
                    'game_id' => $gameId,
                    'genre_id' => $genreId
                ];
            }

            foreach ($genresToRemoveForGame as $genreId) {
                $genresToRemove[] = [
                    'game_id' => $gameId,
                    'genre_id' => $genreId
                ];
            }
        }

        // Process company relationships
        $gameCompanyIds = [];
        if (isset($game['involved_companies'])) {
            foreach ($game['involved_companies'] as $involvedCompany) {
                if (isset($involvedCompany['company'], $involvedCompany['company']['id'])) {
                    $companyApiId = $involvedCompany['company']['id'];
                    if (isset($companyIdMap[$companyApiId])) {
                        $gameCompanyIds[] = $companyIdMap[$companyApiId];
                    }
                }
            }

            // Calculate companies to add/remove
            $companiesToAddForGame = array_diff($gameCompanyIds, $existingGameCompanies);
            $companiesToRemoveForGame = array_diff($existingGameCompanies, $gameCompanyIds);

            // Add to batch operations
            foreach ($companiesToAddForGame as $companyId) {
                $companiesToAdd[] = [
                    'game_id' => $gameId,
                    'company_id' => $companyId
                ];
            }

            foreach ($companiesToRemoveForGame as $companyId) {
                $companiesToRemove[] = [
                    'game_id' => $gameId,
                    'company_id' => $companyId
                ];
            }
        }
    }
    
    return [$genresToAdd, $companiesToAdd, $genresToRemove, $companiesToRemove];
}

/**
 * Process genres in a transaction
 * 
 * @param \PDOStatement $stmt The prepared statement
 * @param array $genres Array of genre data from IGDB API
 * @param \Symfony\Component\Console\Helper\ProgressBar|null $progressBar Progress bar
 */
public function processGenres($stmt, array $genres, $progressBar = null): void
{
    foreach ($genres as $genre) {
        $stmt->execute([
            'apiId' => $genre['id'],
            'name' => $genre['name']
        ]);

        if ($progressBar) {
            $progressBar->advance();
        }
    }
}
}