<?php

namespace App\Command;

use App\Entity\Company;
use App\Entity\Game;
use App\Entity\Genre;
use App\Service\ExternalApiService;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Component\Console\Attribute\AsCommand;
use Symfony\Component\Console\Command\Command;
use Symfony\Component\Console\Input\InputArgument;
use Symfony\Component\Console\Input\InputInterface;
use Symfony\Component\Console\Input\InputOption;
use Symfony\Component\Console\Output\OutputInterface;
use Symfony\Component\Console\Style\SymfonyStyle;
use Symfony\Component\Console\Helper\ProgressBar;

use function PHPSTORM_META\type;

// ! You HAVE to use --no-debug to avoid memory leaks

#[AsCommand(
    name: 'GetGamesFromIgdb',
    description: 'Fetches the games from IGDB and stores them in the database.',
)]
class GetGamesFromIgdbCommand extends Command
{
    private $externalApiService;
    private $entityManager;

    public function __construct(ExternalApiService $externalApiService, EntityManagerInterface $entityManager)
    {
        parent::__construct();

        $this->externalApiService = $externalApiService;
        $this->entityManager = $entityManager;
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
        $offset = $input->getOption('offset') ? (int)$input->getOption('offset') : 0;
        $fetchSize = $input->getOption('fetchSize') ? (int)$input->getOption('fetchSize') : 500;

        // Disable Doctrine SQL logging to save memory
        $connection = $this->entityManager->getConnection();
        $connection->getConfiguration()->setMiddlewares([]);

        if ($input->getOption('offset') !== 0) {
            $io->note(sprintf('You passed an offset: %s', $input->getOption('offset')));
        }
        if ($input->getOption('fetchSize') !== 500) {
            $io->note(sprintf('You passed a fetch size of: %s', $input->getOption('fetchSize')));
        }

        // Check if the offset is valid
        if ($offset < 0) {
            $io->error('Offset must be a non-negative integer.');
            return Command::FAILURE;
        }
        // Check if the fetch size is valid
        if ($fetchSize <= 0 || $fetchSize > 500) {
            $io->error('Fetch size must be a positive integer and less than or equal to 500.');
            return Command::FAILURE;
        }

        // Get and store x-count
        $xCount = $this->externalApiService->getNumberOfIgdbGames();
        $io->text(sprintf('Number of games to check : %s', $xCount));

        // Update your progress bar initialization
        $progressBar = new ProgressBar($output, $xCount - $offset);
        $progressBar->start();
        $progressBar->setFormat(
            "%status%\n%current%/%max% [%bar%] %percent:3s%%\n  %elapsed:6s%/%estimated:-6s%  %memory:6s%"
        );
        $progressBar->setBarCharacter('<fg=green>■</>');
        $progressBar->setEmptyBarCharacter("<fg=red>■</>");

        $parallelRequests = 4; // Number of maximum parallel requests/second to IGDB

        // Main loop to fetch and process games
        for ($i = 0 + $offset; $i < $xCount; $i += ($fetchSize * $parallelRequests)) {
            // Calculate the offsets for the parallel requests
            $batchOffsets = [];
            for ($j = 0; $j < $parallelRequests; $j++) {
                $currentOffset = $i + ($j * $fetchSize);
                if ($currentOffset < $xCount) {
                    $batchOffsets[] = $currentOffset;
                }
            }

            if (empty($batchOffsets)) {
                break;
            }

            $startTime = microtime(true);

            // Update status message before starting API calls
            $progressBar->setMessage(sprintf(
                'Fetching games %d to %d...',
                $i,
                min($i + ($fetchSize * count($batchOffsets)), $xCount)
            ), 'status');
            $progressBar->display();

            // Collect all games from multiple API calls
            $allGames = [];
            $gamesProcessed = 0;

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
                $gamesProcessed += count($batchGames);

                // Brief pause between API calls to avoid rate limiting
                usleep(50000); // 0.05 seconds
            }

            // Update with actual count of games fetched
            $progressBar->setMessage(sprintf('Processing %d games...', count($allGames)), 'status');
            $progressBar->display();

            try {
                $this->storeGamesIntoDatabase($allGames, $io);

                unset($allGames, $batchGames);

                $memoryUsage = round(memory_get_usage() / 1024 / 1024);
                $elapsedTime = microtime(true) - $startTime;
                $rate = $gamesProcessed / $elapsedTime;

                // Show processing stats
                $progressBar->setMessage(sprintf(
                    'Batch complete | Memory: %dMB | Speed: %.1f games/sec',
                    $memoryUsage,
                    $rate
                ), 'status');

                if ($memoryUsage > 900) {
                    $progressBar->setMessage('Clearing memory...', 'status');
                    $this->entityManager->clear();
                    gc_collect_cycles();
                    $this->entityManager->getConnection()->close();
                    $this->entityManager->getConnection()->connect();
                }
            } catch (\Exception $e) {
                $progressBar->setMessage('<error>Error processing batch</error>', 'status');
                $io->error("Error processing batch: " . $e->getMessage());
                die();
            }

            // Advance the progress bar with actual number of games processed
            $progressBar->advance($gamesProcessed);

            // Calculate remaining time to maintain rate limit
            $timeElapsed = microtime(true) - $startTime;
            $waitTime = max(0, 1 - $timeElapsed); // Ensure we take at least 1 second per batch

            if ($waitTime > 0) {
                $progressBar->setMessage('Rate limiting...', 'status');
                usleep($waitTime * 1000000);
            }
        }

        // Finish the progress bar
        $progressBar->finish();
        $io->newLine(2);

        $io->success('Games succesfully replicated in Database.');

        return Command::SUCCESS;
    }

    /**
     * Store games into the database with optimized SQL performance
     * @param array $games Array of game data from IGDB API
     * @param SymfonyStyle|null $io Console output helper
     * @return void
     */
    private function storeGamesIntoDatabase(array $games, $io = null)
    {
        ini_set('memory_limit', '512M');

        $connection = $this->entityManager->getConnection();
        // $io->text('Starting database transaction for ' . count($games) . ' games');

        // Begin transaction for atomic operations
        $connection->beginTransaction();

        try {
            // 1. EXTRACT IDENTIFIERS
            // Extract all IDs we need to look up (game, genre, company)
            // $io->text('Extracting identifiers...');
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

            // 2. BULK FETCH EXISTING RECORDS
            // Find existing games in a single query
            if (!empty($gameApiIds)) {
                // $io->text('Looking up ' . count($gameApiIds) . ' existing games...');
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

            // Get genre ID mappings in one query
            $genreIdMap = [];
            if (!empty($allGenreApiIds)) {
                // $io->text('Looking up ' . count(array_unique($allGenreApiIds)) . ' genres...');
                $allGenreApiIds = array_unique($allGenreApiIds);

                // Only proceed if we still have genres after deduplication
                if (!empty($allGenreApiIds)) {
                    $placeholders = implode(',', array_fill(0, count($allGenreApiIds), '?'));
                    foreach ($allGenreApiIds as $key => $value) {
                        $allGenreApiIds[$key] = (int)$value;
                        // $io->text('Value : ' . $value);
                    }

                    $sql = "SELECT id, api_id FROM genre WHERE api_id IN ($placeholders)";
                    $stmt = $connection->prepare($sql);
                    $result = $stmt->executeQuery(array_values($allGenreApiIds));
                    $genres = $result->fetchAllAssociative();

                    foreach ($genres as $genre) {
                        $genreIdMap[$genre['api_id']] = $genre['id'];
                    }
                } else {
                    // $io->text('No unique genres to look up after deduplication');
                }
            }

            // Get company ID mappings in one query
            $companyIdMap = [];
            if (!empty($allCompanyApiIds)) {
                // $io->text('Looking up ' . count(array_unique($allCompanyApiIds)) . ' companies...');
                $allCompanyApiIds = array_unique($allCompanyApiIds);

                // Only proceed if we still have companies after deduplication
                if (!empty($allCompanyApiIds)) {
                    $placeholders = implode(',', array_fill(0, count($allCompanyApiIds), '?'));
                    $companiesQuery = $connection->prepare("SELECT id, api_id FROM company WHERE api_id IN ($placeholders)");
                    $companies = $companiesQuery->executeQuery(array_values($allCompanyApiIds))->fetchAllAssociative();

                    foreach ($companies as $company) {
                        $companyIdMap[$company['api_id']] = $company['id'];
                    }
                }
            }

            // 3. INSERT/UPDATE GAMES
            // Prepare statement for game insertion/update
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

            // Process each game
            // $io->text('Processing ' . count($games) . ' games...');
            $newGameIds = []; // Track newly inserted game IDs

            foreach ($games as $index => $game) {
                if ($index > 0 && $index % 50 == 0) {
                    // $io->text("Processed $index games so far");
                }

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

                $gameId = $gameIdMap[$game['id']];
            }

            // 4. HANDLE RELATIONSHIPS
            // Now that we have all game IDs, get existing relationships in one go
            $existingGenreRelations = [];
            $existingCompanyRelations = [];
            $gameDbIds = array_values($gameIdMap);

            if (!empty($gameDbIds)) {
                // $io->text('Fetching existing relationships for ' . count($gameDbIds) . ' games...');
                $placeholders = implode(',', array_fill(0, count($gameDbIds), '?'));

                // Only proceed if we have placeholders
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

            // 5. UPDATE RELATIONSHIPS
            // Process genre and company relationships
            // $io->text('Updating relationships...');
            $genresToAdd = [];
            $companiesToAdd = [];
            $genresToRemove = [];
            $companiesToRemove = [];

            foreach ($games as $game) {
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

            // 6. EXECUTE RELATIONSHIP CHANGES
            // Execute batch removals first
            if (!empty($genresToRemove)) {
                // $io->text('Removing ' . count($genresToRemove) . ' genre relationships...');
                foreach ($genresToRemove as $relation) {
                    $connection->executeQuery(
                        "DELETE FROM genre_game WHERE game_id = ? AND genre_id = ?",
                        [$relation['game_id'], $relation['genre_id']]
                    );
                }
            }

            if (!empty($companiesToRemove)) {
                // $io->text('Removing ' . count($companiesToRemove) . ' company relationships...');
                foreach ($companiesToRemove as $relation) {
                    $connection->executeQuery(
                        "DELETE FROM company_game WHERE game_id = ? AND company_id = ?",
                        [$relation['game_id'], $relation['company_id']]
                    );
                }
            }

            // Execute batch additions in chunks to avoid packet size issues
            if (!empty($genresToAdd)) {
                // $io->text('Adding ' . count($genresToAdd) . ' genre relationships...');

                // First, de-duplicate the array using a composite key
                $uniqueGenresToAdd = [];
                foreach ($genresToAdd as $relation) {
                    $key = $relation['game_id'] . '-' . $relation['genre_id'];
                    $uniqueGenresToAdd[$key] = $relation;
                }
                // $io->text('After de-duplication: ' . count($uniqueGenresToAdd) . ' unique genre relationships');

                $chunks = array_chunk(array_values($uniqueGenresToAdd), 100);

                foreach ($chunks as $chunk) {
                    $values = [];
                    $params = [];

                    foreach ($chunk as $relation) {
                        $values[] = "(?, ?)";
                        $params[] = $relation['game_id'];
                        $params[] = $relation['genre_id'];
                    }

                    // Use INSERT IGNORE to skip duplicates without error
                    $sql = "INSERT IGNORE INTO genre_game (game_id, genre_id) VALUES " . implode(', ', $values);
                    $connection->executeQuery($sql, $params);
                }
            }

            if (!empty($companiesToAdd)) {
                // $io->text('Adding ' . count($companiesToAdd) . ' company relationships...');

                // First, de-duplicate the array using a composite key
                $uniqueCompaniesToAdd = [];
                foreach ($companiesToAdd as $relation) {
                    $key = $relation['game_id'] . '-' . $relation['company_id'];
                    $uniqueCompaniesToAdd[$key] = $relation;
                }
                // $io->text('After de-duplication: ' . count($uniqueCompaniesToAdd) . ' unique company relationships');

                $chunks = array_chunk(array_values($uniqueCompaniesToAdd), 100);

                foreach ($chunks as $chunk) {
                    $values = [];
                    $params = [];

                    foreach ($chunk as $relation) {
                        $values[] = "(?, ?)";
                        $params[] = $relation['game_id'];
                        $params[] = $relation['company_id'];
                    }

                    // Use INSERT IGNORE to skip duplicates without error
                    $sql = "INSERT IGNORE INTO company_game (game_id, company_id) VALUES " . implode(', ', $values);
                    $connection->executeQuery($sql, $params);
                }
            }

            // Commit the transaction
            $connection->commit();
            // $io->text('Transaction committed successfully');

            // Unset variables to free memory
            unset($gameApiIds, $gameIdMap, $allGenreApiIds, $allCompanyApiIds, $genreIdMap, $companyIdMap, $existingGenreRelations, $existingCompanyRelations, $genresToAdd, $genresToRemove, $companiesToAdd, $companiesToRemove, $uniqueGenresToAdd, $uniqueCompaniesToAdd);

            // $io->text('Garbage collection completed');
        } catch (\Exception $e) {
            // Roll back on any error
            $connection->rollBack();

            // Detailed error logging
            $io->error("Database error: " . $e->getMessage());
            $io->error("Stack trace: " . $e->getTraceAsString());

            // Pass the exception up
            throw $e;
        }
    }
}
