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
    name: 'app:get-extensions-from-igdb',
    aliases: ['app:igdb:extensions'],
    description: 'Fetches the extensions/DLCs from IGDB and stores them in the database.',
)]
class GetExtensionsFromIgdbCommand extends Command
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
            ->addOption('offset', null, InputOption::VALUE_OPTIONAL, 'Offset for fetching extensions', 0)
            ->addOption('fetchSize', null, InputOption::VALUE_OPTIONAL, 'Number of extensions to fetch per request, maximum is 500', 500)
        ;
    }

    protected function execute(InputInterface $input, OutputInterface $output): int
    {
        $io = new SymfonyStyle($input, $output);

        // Validate input options
        $options = $this->validateAndGetOptions($input, $io);
        if (!$options) {
            return Command::FAILURE;
        }

        // Optimize database connection
        $this->dbService->optimizeDatabaseConnection();

        // Get total count of extensions
        $xCount = $this->getExtensionsCount($io);

        // Set up progress bar
        $progressBar = $this->progressHandler->initializeProgressBar($output, $xCount, $options['offset']);

        // Process extensions in batches
        $this->processExtensionBatches($io, $xCount, $options, $progressBar);

        // Finish up
        $progressBar->finish();
        $io->newLine(2);
        $io->success('Extensions successfully replicated in Database.');

        return Command::SUCCESS;
    }

    /**
     * Validate and get input options
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
     * Get the total count of extensions from IGDB
     */
    private function getExtensionsCount(SymfonyStyle $io): int
    {
        $xCount = $this->externalApiService->getNumberOfIgdbExtensions();
        $io->text(sprintf('Number of extensions to check : %s', $xCount));
        return $xCount;
    }

    /**
     * Process extensions in batches
     */
    private function processExtensionBatches(SymfonyStyle $io, int $xCount, array $options, $progressBar): void
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
            $this->progressHandler->updateBatchProgressMessage($progressBar, $i, $fetchSize, count($batchOffsets), $xCount, 'extensions');

            // Fetch and process extensions
            $allExtensions = $this->fetchExtensionsForBatches($batchOffsets, $fetchSize, $progressBar);
            $extensionsProcessed = count($allExtensions);

            // Process the fetched extensions
            $this->processExtensionsBatch($allExtensions, $io, $progressBar, $startTime, $extensionsProcessed);

            // Apply rate limiting
            $this->progressHandler->applyRateLimiting($progressBar, $startTime);
        }
    }

    /**
     * Fetch extensions for all batches in the current iteration
     */
    private function fetchExtensionsForBatches(array $batchOffsets, int $fetchSize, $progressBar): array
    {
        $allExtensions = [];

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

            // Brief pause between API calls to avoid rate limiting
            usleep(50000); // 0.05 seconds
        }

        // Update progress bar with processing message
        $progressBar->setMessage(sprintf('Processing %d extensions...', count($allExtensions)), 'status');
        $progressBar->display();

        return $allExtensions;
    }

    /**
     * Process a batch of extensions
     */
    private function processExtensionsBatch(array $allExtensions, SymfonyStyle $io, $progressBar, float $startTime, int $extensionsProcessed): void
    {
        try {
            $this->storeExtensionsIntoDatabase($allExtensions, $io);

            unset($allExtensions);

            $memoryUsage = round(memory_get_usage() / 1024 / 1024);
            
            // Show processing stats
            $this->progressHandler->updateWithProcessingStats($progressBar, $extensionsProcessed, $startTime, $memoryUsage, 'extensions');

            // Manage memory usage
            $this->dbService->manageMemoryUsage($progressBar, $memoryUsage);

            // Advance the progress bar
            $progressBar->advance($extensionsProcessed);
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
     * Store extensions into the database with optimized SQL performance
     */
    private function storeExtensionsIntoDatabase(array $extensions, SymfonyStyle $io = null): void
    {
        // Increase memory limit
        $this->dbService->setMemoryLimit('512M');

        // Get database connection
        $connection = $this->dbService->getConnection();
        $connection->beginTransaction();

        try {
            // Extract identifiers and process the database operations
            $this->processExtensionsTransaction($extensions, $connection, $io);

            // Commit the transaction
            $connection->commit();

            // Cleanup
            $this->cleanupAfterTransaction();
        } catch (\Exception $e) {
            // Roll back on any error
            $connection->rollBack();
            $this->dbService->logDatabaseError($e, $io, $extensions);
            throw $e;
        }
    }

    /**
     * Process the extensions transaction
     */
    private function processExtensionsTransaction(array $extensions, $connection, $io = null): void
    {
        // 1. Extract identifiers
        [$extensionApiIds, $allGameApiIds, $extensionIdMap] = $this->dataProcessor->extractExtensionIdentifiers($extensions);

        // 2. Bulk fetch existing records
        [$extensionIdMap, $gameIdMap] = $this->dataProcessor->fetchExistingExtensionRecords(
            $extensionApiIds,
            $allGameApiIds,
            $extensionIdMap,
            $connection
        );

        // 3. Insert/update extensions
        [$extensionIdMap, $newExtensionIds] = $this->dataProcessor->insertOrUpdateExtensions(
            $extensions,
            $extensionIdMap,
            $gameIdMap,
            $connection
        );
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