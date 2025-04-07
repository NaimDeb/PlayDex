<?php

namespace App\Command;

use App\Service\DatabaseOperationService;
use App\Service\ExternalApiService;
use App\Service\IgdbDataProcessorService;
use App\Service\ProgressBarHandlerService;
use Symfony\Component\Console\Attribute\AsCommand;
use Symfony\Component\Console\Command\Command;
use Symfony\Component\Console\Input\InputInterface;
use Symfony\Component\Console\Input\InputOption;
use Symfony\Component\Console\Output\OutputInterface;
use Symfony\Component\Console\Style\SymfonyStyle;

// ! You HAVE to use --no-debug to avoid memory leaks

#[AsCommand(
    name: 'app:get-games-from-igdb',
    aliases: ['app:igdb:games'],
    description: 'Fetches the games from IGDB and stores them in the database.',
)]
class GetGamesFromIgdbCommand extends Command
{
    private $externalApiService;
    private $dbService;
    private $progressHandler;
    private $dataProcessor;

    public function __construct(
        ExternalApiService $externalApiService,
        DatabaseOperationService $dbService,
        ProgressBarHandlerService $progressHandler,
        IgdbDataProcessorService $dataProcessor
    ) {
        parent::__construct();
        $this->externalApiService = $externalApiService;
        $this->dbService = $dbService;
        $this->progressHandler = $progressHandler;
        $this->dataProcessor = $dataProcessor;
    }

    protected function configure(): void
    {
        $this
            ->addOption('offset', null, InputOption::VALUE_OPTIONAL, 'Offset for fetching games', 0)
            ->addOption('fetchSize', null, InputOption::VALUE_OPTIONAL, 'Number of games to fetch per request, maximum is 500', 500)
        ;
    }

    protected function execute(InputInterface $input, OutputInterface $output): int
    {
        $io = new SymfonyStyle($input, $output);
        
        // Get input options with validation
        $options = $this->validateAndGetOptions($input, $io);
        if (!$options) {
            return Command::FAILURE;
        }
        
        // Optimize database connection
        $this->dbService->optimizeDatabaseConnection();
        
        // Get total number of games and initialize progress
        $xCount = $this->getGamesCount($io);
        $progressBar = $this->progressHandler->initializeProgressBar($output, $xCount, $options['offset']);
        
        // Process games in batches
        $this->processGameBatches($io, $xCount, $options, $progressBar);

        // Wrap up
        $progressBar->finish();
        $io->newLine(2);
        $io->success('Games succesfully replicated in Database.');

        return Command::SUCCESS;
    }

    /**
     * Validate input options and return them as an array
     */
    private function validateAndGetOptions(InputInterface $input, SymfonyStyle $io): ?array
    {
        $offset = $input->getOption('offset') ? (int)$input->getOption('offset') : 0;
        $fetchSize = $input->getOption('fetchSize') ? (int)$input->getOption('fetchSize') : 500;

        // Display info about non-default options
        if ($offset !== 0) {
            $io->note(sprintf('You passed an offset: %s', $offset));
        }
        if ($fetchSize !== 500) {
            $io->note(sprintf('You passed a fetch size of: %s', $fetchSize));
        }

        // Validate offset
        if ($offset < 0) {
            $io->error('Offset must be a non-negative integer.');
            return null;
        }
        
        // Validate fetch size
        if ($fetchSize <= 0 || $fetchSize > 500) {
            $io->error('Fetch size must be a positive integer and less than or equal to 500.');
            return null;
        }
        
        return [
            'offset' => $offset,
            'fetchSize' => $fetchSize
        ];
    }

    /**
     * Get total count of games from IGDB
     */
    private function getGamesCount(SymfonyStyle $io): int
    {
        $xCount = $this->externalApiService->getNumberOfIgdbGames();
        $io->text(sprintf('Number of games to check : %s', $xCount));
        return $xCount;
    }

    /**
     * Process games in batches
     */
    private function processGameBatches(SymfonyStyle $io, int $xCount, array $options, $progressBar): void
    {
        $offset = $options['offset'];
        $fetchSize = $options['fetchSize'];
        $parallelRequests = 4;

        for ($i = $offset; $i < $xCount; $i += ($fetchSize * $parallelRequests)) {
            // Calculate batch offsets
            $batchOffsets = $this->progressHandler->calculateBatchOffsets($i, $fetchSize, $parallelRequests, $xCount);
            
            if (empty($batchOffsets)) {
                break;
            }

            $startTime = microtime(true);
            
            // Update progress bar message
            $this->progressHandler->updateBatchProgressMessage($progressBar, $i, $fetchSize, count($batchOffsets), $xCount, 'games');
            
            // Fetch and process games
            $allGames = $this->fetchGamesForBatches($batchOffsets, $fetchSize, $progressBar);
            $gamesProcessed = count($allGames);
            
            // Process the fetched games
            $this->processGamesBatch($allGames, $io, $progressBar, $startTime, $gamesProcessed);
            
            // Apply rate limiting
            $this->progressHandler->applyRateLimiting($progressBar, $startTime);
        }
    }

    /**
     * Fetch games for all batches in the current iteration
     */
    private function fetchGamesForBatches(array $batchOffsets, int $fetchSize, $progressBar): array
    {
        $allGames = [];
        
        // Make separate API calls in sequence (one for each offset)
        foreach ($batchOffsets as $index => $batchOffset) {
            // Update progress message for each API call
            $progressBar->setMessage(sprintf(
                'Requesting batch %d/%d (offset %d)...',
                $index + 1,
                count($batchOffsets),
                $batchOffset
            ), 'status');
            $progressBar->display();

            $batchGames = $this->externalApiService->getIgdbGames($fetchSize, $batchOffset);
            $allGames = array_merge($allGames, $batchGames);

            // Brief pause between API calls to avoid rate limiting
            usleep(50000); // 0.05 seconds
        }
        
        // Update progress bar with processing message
        $progressBar->setMessage(sprintf('Processing %d games...', count($allGames)), 'status');
        $progressBar->display();
        
        return $allGames;
    }

    /**
     * Process a batch of games
     */
    private function processGamesBatch(array $allGames, SymfonyStyle $io, $progressBar, float $startTime, int $gamesProcessed): void
    {
        try {
            $this->storeGamesIntoDatabase($allGames, $io);

            unset($allGames);

            $memoryUsage = round(memory_get_usage() / 1024 / 1024);
            
            // Show processing stats
            $this->progressHandler->updateWithProcessingStats($progressBar, $gamesProcessed, $startTime, $memoryUsage, 'games');

            // Manage memory usage
            $this->dbService->manageMemoryUsage($progressBar, $memoryUsage);
            
            // Advance the progress bar
            $progressBar->advance($gamesProcessed);
            
        } catch (\Exception $e) {
            $this->handleProcessingError($e, $progressBar, $io);
        }
    }

    /**
     * Handle errors during batch processing
     */
    private function handleProcessingError(\Exception $e, $progressBar, SymfonyStyle $io): void
    {
        $progressBar->setMessage('<error>Error processing batch</error>', 'status');
        $io->error("Error processing batch: " . $e->getMessage());
        die();
    }

    /**
     * Store games into the database with optimized SQL performance
     */
    private function storeGamesIntoDatabase(array $games, $io = null): void
    {
        // Increase memory limit
        $this->dbService->setMemoryLimit('512M');

        // Get database connection
        $connection = $this->dbService->getConnection();
        $connection->beginTransaction();

        try {
            // Extract all necessary IDs and perform the database operations
            $this->processGamesTransaction($games, $connection, $io);
            
            // Commit the transaction
            $connection->commit();
            
            // Cleanup
            $this->cleanupAfterTransaction();
        } catch (\Exception $e) {
            // Roll back on any error
            $connection->rollBack();
            $this->dbService->logDatabaseError($e, $io);
            throw $e;
        }
    }

    /**
     * Process the games transaction
     */
    private function processGamesTransaction(array $games, $connection, $io = null): void
    {
        // 1. Extract identifiers
        [$gameApiIds, $allGenreApiIds, $allCompanyApiIds, $gameIdMap] = $this->dataProcessor->extractGameIdentifiers($games);
        
        // 2. Bulk fetch existing records
        [$gameIdMap, $genreIdMap, $companyIdMap] = $this->dataProcessor->fetchExistingGameRecords(
            $gameApiIds, 
            $allGenreApiIds, 
            $allCompanyApiIds, 
            $gameIdMap, 
            $connection
        );
        
        // 3. Insert/update games
        [$gameIdMap, $newGameIds] = $this->dataProcessor->insertOrUpdateGames($games, $gameIdMap, $connection);
        
        // 4. Handle relationships
        $this->updateGameRelationships($games, $gameIdMap, $genreIdMap, $companyIdMap, $connection, $io);
    }
    
    /**
     * Update game relationships with genres and companies
     */
    private function updateGameRelationships(
        array $games, 
        array $gameIdMap, 
        array $genreIdMap, 
        array $companyIdMap, 
        $connection, 
        $io = null
    ): void {
        // 1. Fetch existing relationships
        [$existingGenreRelations, $existingCompanyRelations] = $this->fetchExistingRelationships(
            array_values($gameIdMap),
            $connection
        );
        
        // 2. Calculate relationship changes
        [$genresToAdd, $companiesToAdd, $genresToRemove, $companiesToRemove] = 
            $this->dataProcessor->calculateGameRelationshipChanges(
                $games,
                $gameIdMap,
                $genreIdMap,
                $companyIdMap,
                $existingGenreRelations,
                $existingCompanyRelations
            );
        
        // 3. Execute relationship changes
        $this->executeRelationshipChanges(
            $genresToAdd,
            $companiesToAdd,
            $genresToRemove,
            $companiesToRemove,
            $connection,
            $io
        );
    }

    /**
     * Fetch existing relationships for games
     */
    private function fetchExistingRelationships(array $gameDbIds, $connection): array
    {
        $existingGenreRelations = [];
        $existingCompanyRelations = [];

        if (!empty($gameDbIds)) {
            $placeholders = implode(',', array_fill(0, count($gameDbIds), '?'));

            if (!empty($placeholders)) {
                // Get genre relationships
                $existingGenreQuery = $connection->prepare(
                    "SELECT game_id, genre_id FROM genre_game WHERE game_id IN ($placeholders)"
                );
                $existingGenreResults = $existingGenreQuery->executeQuery(array_values($gameDbIds))->fetchAllAssociative();

                // Get company relationships
                $existingCompanyQuery = $connection->prepare(
                    "SELECT game_id, company_id FROM company_game WHERE game_id IN ($placeholders)"
                );
                $existingCompanyResults = $existingCompanyQuery->executeQuery(array_values($gameDbIds))->fetchAllAssociative();
            }
        }
        
        return [$existingGenreRelations, $existingCompanyRelations];
    }

    /**
     * Execute relationship changes in the database
     */
    private function executeRelationshipChanges(
        array $genresToAdd, 
        array $companiesToAdd, 
        array $genresToRemove, 
        array $companiesToRemove, 
        $connection, 
        $io = null
    ): void {
        // Execute batch removals first
        $this->executeRelationshipRemovals($genresToRemove, $companiesToRemove, $connection);
        
        // Execute batch additions
        $this->executeRelationshipAdditions($genresToAdd, $companiesToAdd, $connection, $io);
    }

    /**
     * Execute removals of relationships
     */
    private function executeRelationshipRemovals(array $genresToRemove, array $companiesToRemove, $connection): void
    {
        if (!empty($genresToRemove)) {
            foreach ($genresToRemove as $relation) {
                $connection->executeQuery(
                    "DELETE FROM genre_game WHERE game_id = ? AND genre_id = ?",
                    [$relation['game_id'], $relation['genre_id']]
                );
            }
        }

        if (!empty($companiesToRemove)) {
            foreach ($companiesToRemove as $relation) {
                $connection->executeQuery(
                    "DELETE FROM company_game WHERE game_id = ? AND company_id = ?",
                    [$relation['game_id'], $relation['company_id']]
                );
            }
        }
    }

    /**
     * Execute additions of relationships
     */
    private function executeRelationshipAdditions(array $genresToAdd, array $companiesToAdd, $connection, $io = null): void
    {
        if (!empty($genresToAdd)) {
            // First, de-duplicate the array using a composite key
            $uniqueGenresToAdd = [];
            foreach ($genresToAdd as $relation) {
                $key = $relation['game_id'] . '-' . $relation['genre_id'];
                $uniqueGenresToAdd[$key] = $relation;
            }

            $this->dbService->insertRelationships($uniqueGenresToAdd, 'genre_game', 'game_id', 'genre_id', $connection);
        }

        if (!empty($companiesToAdd)) {
            // First, de-duplicate the array using a composite key
            $uniqueCompaniesToAdd = [];
            foreach ($companiesToAdd as $relation) {
                $key = $relation['game_id'] . '-' . $relation['company_id'];
                $uniqueCompaniesToAdd[$key] = $relation;
            }

            $this->dbService->insertRelationships($uniqueCompaniesToAdd, 'company_game', 'game_id', 'company_id', $connection);
        }
    }

    /**
     * Clean up after transaction is committed
     */
    private function cleanupAfterTransaction(): void
    {
        // Unset variables to free memory
        gc_collect_cycles();
    }
}