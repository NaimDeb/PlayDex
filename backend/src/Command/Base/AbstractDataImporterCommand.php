<?php

namespace App\Command\Base;

use ApiConfig;
use App\Config\Api\DataImportDefinition;
use App\Interfaces\Api\DataFetcherInterface;
use App\Interfaces\Api\DataProcessorInterface;
use App\Interfaces\Api\DataStorageInterface;
use App\Service\ProgressBarHandlerService;
use App\Service\DatabaseOperationService;
use Symfony\Component\Console\Command\Command;
use Symfony\Component\Console\Input\InputInterface;
use Symfony\Component\Console\Input\InputOption;
use Symfony\Component\Console\Output\OutputInterface;
use Symfony\Component\Console\Style\SymfonyStyle;
use Symfony\Component\DependencyInjection\ContainerInterface;

/**
 * Abstract base command for importing data from external APIs.
 */
abstract class AbstractDataImporterCommand extends Command
{
    protected DataFetcherInterface $dataFetcher;
    protected DataProcessorInterface $dataProcessor;
    protected DataStorageInterface $dataStorage;
    protected ProgressBarHandlerService $progressHandler;
    protected DatabaseOperationService $dbService;
    protected ContainerInterface $container;

    public function __construct(
        ProgressBarHandlerService $progressHandler,
        DatabaseOperationService $dbService,
        ContainerInterface $container
    ) {
        parent::__construct();
        $this->progressHandler = $progressHandler;
        $this->dbService = $dbService;
        $this->container = $container;
    }

    /**
     * Subclasses must provide the definition for what to import
     */
    abstract protected function getDataImportDefinition(): DataImportDefinition;

    /**
     * Optional: Configure additional options specific to the data type
     */
    protected function configureAdditionalOptions(): void
    {
        // Override in subclasses if needed
    }

    /**
     * Optional: Validate additional options specific to the data type
     */
    protected function validateAdditionalOptions(InputInterface $input, SymfonyStyle $io): ?array
    {
        // Override in subclasses if needed
        return [];
    }

    protected function configure(): void
    {
        $definition = $this->getDataImportDefinition();

        $this->setDescription($definition->getDescription());
        $this->addOption(
            'from',
            null,
            InputOption::VALUE_OPTIONAL,
            'Fetch data from a specific date (UNIX time)',
            null
        );

        // Add options from the data type definition
        foreach ($definition->getConsoleOptions() as $optionName => $optionConfig) {
            $this->addOption(
                $optionName,
                $optionConfig['shortcut'] ?? null,
                $optionConfig['mode'],
                $optionConfig['description'],
                $optionConfig['default'] ?? null
            );
        }

        $this->configureAdditionalOptions();
    }

    protected function execute(InputInterface $input, OutputInterface $output): int
    {
        $io = new SymfonyStyle($input, $output);
        $definition = $this->getDataImportDefinition();

        // Initialize services from container
        $this->initializeServices($definition);

        $io->title(sprintf('Importing %s', $definition->getName()));

        // Validate options
        $options = $this->validateAndGetOptions($input, $io, $definition);
        if (!$options) {
            return Command::FAILURE;
        }

        try {
            // Get total count
            $totalCount = $this->dataFetcher->getCount($options['from'] ?? null);
            $io->text(sprintf('Total %s to import: %s', strtolower($definition->getName()), $totalCount));

            // Initialize progress bar
            $progressBar = $this->createProgressBar($io, $totalCount, $options);

            // Process in batches
            $this->processBatches($io, $totalCount, $progressBar, $options, $definition);

            $progressBar->finish();
            $io->newLine(2);
            $io->success(sprintf('%s successfully imported!', $definition->getName()));

            return Command::SUCCESS;
        } catch (\Exception $e) {
            $io->error(sprintf('Error importing %s: %s', $definition->getName(), $e->getMessage()));
            return Command::FAILURE;
        }
    }

    /**
     * Initialize fetcher, processor, and storage from container
     */
    protected function initializeServices(DataImportDefinition $definition): void
    {
        $this->dataFetcher = $this->container->get($definition->getDataFetcherServiceId());
        $this->dataProcessor = $this->container->get($definition->getDataProcessorServiceId());
        $this->dataStorage = $this->container->get($definition->getDataStorageServiceId());
    }

    /**
     * Validate and extract all options
     */
    protected function validateAndGetOptions(
        InputInterface $input,
        SymfonyStyle $io,
        DataImportDefinition $definition
    ): ?array {
        $from = $input->getOption('from');

        // Validate 'from' parameter
        if ($from !== null && !is_numeric($from)) {
            $io->error('The "from" option must be a valid UNIX timestamp.');
            return null;
        }

        $options = [
            'from' => $from ? (int)$from : null,
        ];

        // Add offset and fetchSize if they exist
        if ($input->hasOption('offset')) {
            $offset = $input->getOption('offset') ? (int)$input->getOption('offset') : 0;
            if ($offset < 0) {
                $io->error('Offset must be a non-negative integer.');
                return null;
            }
            $options['offset'] = $offset;
            if ($offset !== 0) {
                $io->note(sprintf('Using offset: %s', $offset));
            }
        }

        if ($input->hasOption('fetchSize')) {
            $fetchSize = $input->getOption('fetchSize')
                ? (int)$input->getOption('fetchSize')
                : ApiConfig::IGDB_BATCH_SIZE;

            if ($fetchSize <= 0 || $fetchSize > ApiConfig::IGDB_BATCH_SIZE) {
                $io->error(sprintf(
                    'Fetch size must be a positive integer and less than or equal to %d.',
                    ApiConfig::IGDB_BATCH_SIZE
                ));
                return null;
            }
            $options['fetchSize'] = $fetchSize;
            if ($fetchSize !== ApiConfig::IGDB_BATCH_SIZE) {
                $io->note(sprintf('Using fetch size: %s', $fetchSize));
            }
        }

        // Allow subclasses to validate additional options
        $additionalOptions = $this->validateAdditionalOptions($input, $io);
        if ($additionalOptions === null) {
            return null;
        }

        return array_merge($options, $additionalOptions);
    }

    /**
     * Create progress bar with appropriate settings
     */
    protected function createProgressBar(SymfonyStyle $io, int $totalCount, array $options)
    {
        // Use simpler progress bar if offset/fetchSize not involved
        if (!isset($options['offset']) && !isset($options['fetchSize'])) {
            return $this->progressHandler->createSimpleProgressBar($io, $totalCount);
        }

        return $this->progressHandler->initializeProgressBar(
            $io,
            $totalCount,
            $options['offset'] ?? 0
        );
    }

    /**
     * Process data in batches
     */
    protected function processBatches(
        SymfonyStyle $io,
        int $totalCount,
        $progressBar,
        array $options,
        DataImportDefinition $definition
    ): void {
        // Check if this is a simple batch operation or advanced with offset/fetchSize
        if (!isset($options['fetchSize'])) {
            $this->processSimpleBatches($io, $totalCount, $progressBar, $options);
        } else {
            $this->processAdvancedBatches($io, $totalCount, $progressBar, $options);
        }
    }

    /**
     * Process data in simple batches (standard batch size)
     */
    protected function processSimpleBatches(
        SymfonyStyle $io,
        int $totalCount,
        $progressBar,
        array $options
    ): void {
        $from = $options['from'] ?? null;

        // Process first batch
        $io->text(sprintf('Fetching first %d items...', ApiConfig::IGDB_BATCH_SIZE));
        $data = $this->dataFetcher->fetchBatch(ApiConfig::IGDB_BATCH_SIZE, 0, $from);
        $this->processBatchData($data, $progressBar);

        // Process remaining batches
        if ($totalCount > ApiConfig::IGDB_BATCH_SIZE) {
            for ($offset = ApiConfig::IGDB_BATCH_SIZE; $offset < $totalCount; $offset += ApiConfig::IGDB_BATCH_SIZE) {
                $data = $this->dataFetcher->fetchBatch(ApiConfig::IGDB_BATCH_SIZE, $offset, $from);
                $this->processBatchData($data, $progressBar);
                usleep(ApiConfig::IGDB_RATE_LIMIT_DELAY_US);
            }
        }
    }

    /**
     * Process data in advanced batches (with custom offset/fetchSize)
     */
    protected function processAdvancedBatches(
        SymfonyStyle $io,
        int $totalCount,
        $progressBar,
        array $options
    ): void {
        $offset = $options['offset'] ?? 0;
        $fetchSize = $options['fetchSize'];
        $from = $options['from'] ?? null;
        $parallelRequests = ApiConfig::IGDB_PARALLEL_REQUESTS;

        $this->dbService->optimizeDatabaseConnection();

        for ($i = $offset; $i < $totalCount; $i += ($fetchSize * $parallelRequests)) {
            $batchOffsets = $this->progressHandler->calculateBatchOffsets(
                $i,
                $fetchSize,
                $parallelRequests,
                $totalCount
            );

            if (empty($batchOffsets)) {
                break;
            }

            $startTime = microtime(true);

            $this->progressHandler->updateBatchProgressMessage(
                $progressBar,
                $i,
                $fetchSize,
                count($batchOffsets),
                $totalCount,
                strtolower($this->dataFetcher->getSourceName())
            );

            // Fetch all batches
            $allData = [];
            foreach ($batchOffsets as $index => $batchOffset) {
                $progressBar->setMessage(sprintf(
                    'Requesting batch %d/%d (offset %d)...',
                    $index + 1,
                    count($batchOffsets),
                    $batchOffset
                ), 'status');
                $progressBar->display();

                $batchData = $this->dataFetcher->fetchBatch($fetchSize, $batchOffset, $from);
                $allData = array_merge($allData, $batchData);
                usleep(ApiConfig::IGDB_RATE_LIMIT_DELAY_US);
            }

            $progressBar->setMessage(sprintf('Processing %d items...', count($allData)), 'status');
            $progressBar->display();

            $this->processBatchData($allData, $progressBar);

            $memoryUsage = round(memory_get_usage() / 1024 / 1024);
            $this->progressHandler->updateWithProcessingStats(
                $progressBar,
                count($allData),
                $startTime,
                $memoryUsage,
                strtolower($this->dataFetcher->getSourceName())
            );

            $this->dbService->manageMemoryUsage($progressBar, $memoryUsage);
            $progressBar->advance(count($allData));

            $this->progressHandler->applyRateLimiting($progressBar, $startTime);
        }
    }

    /**
     * Process a single batch of data
     */
    protected function processBatchData(array $data, $progressBar = null): void
    {
        if (empty($data)) {
            return;
        }

        try {
            // Process the data
            $processedData = $this->dataProcessor->processBatch($data);

            // Store in database
            $this->dataStorage->store($processedData, $progressBar);

            // Update progress
            if ($progressBar) {
                $progressBar->advance(count($data));
            }

            unset($data, $processedData);
            gc_collect_cycles();
        } catch (\Exception $e) {
            throw new \RuntimeException(sprintf(
                'Error processing batch: %s',
                $e->getMessage()
            ), 0, $e);
        }
    }
}
