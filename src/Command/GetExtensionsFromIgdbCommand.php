<?php

namespace App\Command;

use App\Service\ExternalApiService;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Component\Console\Attribute\AsCommand;
use Symfony\Component\Console\Command\Command;
use Symfony\Component\Console\Input\InputInterface;
use Symfony\Component\Console\Input\InputOption;
use Symfony\Component\Console\Output\OutputInterface;
use Symfony\Component\Console\Style\SymfonyStyle;
use Symfony\Component\Console\Helper\ProgressBar;

// ! You HAVE to use --no-debug to avoid memory leaks

#[AsCommand(
    name: 'app:get-extensions-from-igdb',
    description: 'Fetches the extensions/DLCs from IGDB and stores them in the database.',
)]
class GetExtensionsFromIgdbCommand extends Command
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
            ->addOption('offset', null, InputOption::VALUE_OPTIONAL, 'Offset for fetching extensions', 0)
            ->addOption('fetchSize', null, InputOption::VALUE_OPTIONAL, 'Number of extensions to fetch per request, maximum is 500', 500)
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
        $xCount = $this->externalApiService->getNumberOfIgdbExtensions();
        $io->text(sprintf('Number of extensions to check : %s', $xCount));

        // Update your progress bar initialization
        $progressBar = new ProgressBar($output, $xCount - $offset);
        $progressBar->start();
        $progressBar->setFormat(
            "%status%\n%current%/%max% [%bar%] %percent:3s%%\n  %elapsed:6s%/%estimated:-6s%  %memory:6s%"
        );
        $progressBar->setBarCharacter('<fg=green>■</>');
        $progressBar->setEmptyBarCharacter("<fg=red>■</>");

        $parallelRequests = 4; // Number of maximum parallel requests/second to IGDB

        // Main loop to fetch and process extensions
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
                'Fetching extensions %d to %d...',
                $i,
                min($i + ($fetchSize * count($batchOffsets)), $xCount)
            ), 'status');
            $progressBar->display();

            // Collect all extensions from multiple API calls
            $allExtensions = [];
            $extensionsProcessed = 0;

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

                $batchExtensions = $this->externalApiService->getIgdbExtensions($fetchSize, $batchOffset);
                $allExtensions = array_merge($allExtensions, $batchExtensions);
                $extensionsProcessed += count($batchExtensions);

                // Brief pause between API calls to avoid rate limiting
                usleep(50000); // 0.05 seconds
            }

            // Update with actual count of extensions fetched
            $progressBar->setMessage(sprintf('Processing %d extensions...', count($allExtensions)), 'status');
            $progressBar->display();

            try {
                $this->storeExtensionsIntoDatabase($allExtensions, $io);

                unset($allExtensions, $batchExtensions);

                $memoryUsage = round(memory_get_usage() / 1024 / 1024);
                $elapsedTime = microtime(true) - $startTime;
                $rate = $extensionsProcessed / $elapsedTime;

                // Show processing stats
                $progressBar->setMessage(sprintf(
                    'Batch complete | Memory: %dMB | Speed: %.1f extensions/sec',
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

            // Advance the progress bar with actual number of extensions processed
            $progressBar->advance($extensionsProcessed);

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

        $io->success('Extensions successfully replicated in Database.');

        return Command::SUCCESS;
    }

    /**
     * Store extensions into the database with optimized SQL performance
     * @param array $extensions Array of extension data from IGDB API
     * @param SymfonyStyle|null $io Console output helper
     * @return void
     */
    private function storeExtensionsIntoDatabase(array $extensions, $io = null)
    {
        ini_set('memory_limit', '512M');

        $connection = $this->entityManager->getConnection();
        // Begin transaction for atomic operations
        $connection->beginTransaction();

        try {
            // 1. EXTRACT IDENTIFIERS
            // Extract all IDs we need to look up (extension, game)
            $extensionApiIds = array_column($extensions, 'id');
            $extensionIdMap = []; // Will map API IDs to database IDs

            // Extract all game IDs from extensions
            $allGameApiIds = [];
            foreach ($extensions as $extension) {
                if (isset($extension['game']) && isset($extension['game']['id'])) {
                    $allGameApiIds[] = $extension['game']['id'];
                }
            }

            // 2. BULK FETCH EXISTING RECORDS
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

            // 3. INSERT/UPDATE EXTENSIONS
            // Prepare statement for extension insertion/update
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

            // Process each extension
            $newExtensionIds = []; // Track newly inserted extension IDs

            foreach ($extensions as $extension) {
                $releasedAt = isset($extension['first_release_date'])
                    ? date('Y-m-d H:i:s', $extension['first_release_date'])
                    : null;

                $imageUrl = isset($extension['cover']['url'])
                    ? 'https:' . $extension['cover']['url']
                    : null;

                // Get game ID if available
                $gameId = null;
                if (isset($extension['game']) && isset($extension['game']['id']) && isset($gameIdMap[$extension['game']['id']])) {
                    $gameId = $gameIdMap[$extension['game']['id']];
                }

                // Insert or update the extension
                $extensionStmt->executeQuery([
                    'apiId' => $extension['id'],
                    'title' => $extension['name'],
                    'description' => $extension['summary'] ?? null,
                    'releasedAt' => $releasedAt,
                    'imageUrl' => $imageUrl,
                    'gameId' => $gameId,
                    'lastUpdatedAt' => date('Y-m-d H:i:s')
                ]);

                // Get extension ID (either existing or newly created)
                if (!isset($extensionIdMap[$extension['id']])) {
                    $extensionIdMap[$extension['id']] = $connection->lastInsertId();
                    $newExtensionIds[] = $extensionIdMap[$extension['id']]; // Track new IDs
                }
            }

            // Commit the transaction
            $connection->commit();

            // Unset variables to free memory
            unset($extensionApiIds, $extensionIdMap, $allGameApiIds, $gameIdMap);
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
