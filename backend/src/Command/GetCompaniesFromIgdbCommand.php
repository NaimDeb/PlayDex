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

#[AsCommand(
    name: 'app:get-companies-from-igdb',
    aliases: ['app:igdb:companies'],
    description: 'Fetches the companies from IGDB and stores them in the database.',
)]
class GetCompaniesFromIgdbCommand extends Command
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
            ->addOption('from', null , InputOption::VALUE_OPTIONAL, 'Fetch games from a specific date (UNIX time)', null)
        ;
    }

    protected function execute(InputInterface $input, OutputInterface $output): int
    {
        $io = new SymfonyStyle($input, $output);


        $options = $this->validateAndGetOptions($input, $io);
        if (!$options) {
            return Command::FAILURE;
        }

        // Get the total number of companies from IGDB
        $io->text('Fetching companies from IGDB...');
        $xCount = $this->externalApiService->getNumberOfIgdbCompanies($options['from']);
        $io->text(sprintf('Number of companies to check: %s', $xCount));
        
        // Initialize progress bar
        $progressBar = $this->progressHandler->initializeProgressBar($output, $xCount);

        // Process companies in batches
        $this->processCompaniesInBatches($io, $xCount, $progressBar, $options['from']);

        $progressBar->finish();
        $io->success('Companies successfully replicated in Database.');

        return Command::SUCCESS;
    }

    /**
     * Process companies in batches of 500
     */
    private function processCompaniesInBatches(SymfonyStyle $io, int $totalCount, $progressBar, ?int $from): void
    {
        // Process first batch
        $io->text('Fetching first 500 companies from IGDB...');
        $companies = $this->externalApiService->getIgdbCompanies(500, $from);
        $this->storeIntoDatabase($companies, $progressBar);

        // Process remaining batches if any
        if ($totalCount > 500) {
            $this->processRemainingBatches($io, $totalCount, $progressBar, $from);
        }
    }

    /**
     * Process remaining batches after the initial 500 companies
     */
    private function processRemainingBatches(SymfonyStyle $io, int $totalCount, $progressBar, ?int $from): void
    {
        for ($i = 500; $i < $totalCount; $i += 500) {
            $companies = $this->externalApiService->getIgdbCompanies(500, $from, $i);
            $this->storeIntoDatabase($companies, $progressBar);
            usleep(250000); // Rate limiting
        }
    }

    /**
     * Store companies into the database
     */
    private function storeIntoDatabase(array $companies, $progressBar = null): void
    {
        // Increase memory limit
        $this->dbService->setMemoryLimit();

        // Get database connection
        $connection = $this->dbService->getConnection();

        // Prepare SQL statement
        $sql = 'INSERT INTO company (api_id, name) 
            VALUES (:apiId, :name) 
            ON DUPLICATE KEY UPDATE 
            name = VALUES(name)';
        $stmt = $this->dbService->prepareInsertStatement($connection, $sql);

        // Execute transaction
        $this->dbService->executeTransaction(
            $connection, 
            $stmt, 
            $companies, 
            [$this->dataProcessor, 'processCompanies'], 
            $progressBar
        );
    }

    /**
     * Validate input options and return them as an array
     */
    private function validateAndGetOptions(InputInterface $input, SymfonyStyle $io): ?array
    {
        $from = $input->getOption('from');

        if ($from && !is_numeric($from)) {
            $io->error('The "from" option must be a valid UNIX timestamp.');
            return null;
        }



        return [
            'from' => $from,
        ];
    }
}