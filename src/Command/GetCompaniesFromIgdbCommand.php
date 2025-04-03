<?php
// Done


namespace App\Command;

use App\Entity\Company;
use App\Service\ExternalApiService;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Component\Console\Attribute\AsCommand;
use Symfony\Component\Console\Command\Command;
use Symfony\Component\Console\Helper\ProgressBar;
use Symfony\Component\Console\Input\InputInterface;
use Symfony\Component\Console\Output\OutputInterface;
use Symfony\Component\Console\Style\SymfonyStyle;
use Symfony\Component\HttpKernel\Profiler\Profiler;

#[AsCommand(
    name: 'GetCompaniesFromIgdb',
    description: 'Fetches the companies from IGDB and stores them in the database.',
)]
class GetCompaniesFromIgdbCommand extends Command
{
    private $externalApiService;
    private $entityManager;

    public function __construct(ExternalApiService $externalApiService, EntityManagerInterface $entityManager)
    {
        parent::__construct();
        $this->externalApiService = $externalApiService;
        $this->entityManager = $entityManager;
    }

    protected function execute(InputInterface $input, OutputInterface $output): int
    {
        $io = new SymfonyStyle($input, $output);

        // Get and store x-count
        $io->text('Fetching companies from IGDB...');
        $xCount = $this->externalApiService->getNumberOfIgdbCompanies();
        $io->text(sprintf('Number of companies to check: %s', $xCount));


        $progressBar = new ProgressBar($io, $xCount);

        $progressBar->start();

        // Get the first 500 companies
        $io->text('Fetching first 500 companies from IGDB...');
        $companies = $this->externalApiService->getIgdbCompanies(500);

        // Store into database
        $io->text('Storing companies into database...');
        $this->storeIntoDatabase($companies, $progressBar);

        // In case there's more than 500 companies, we need to do multiple requests
        if ($xCount > 500) {
            for ($i = 500; $i < $xCount; $i += 500) {
                $companies = $this->externalApiService->getIgdbCompanies(500, $i);
                $this->storeIntoDatabase($companies, $progressBar);
                usleep(250000);
            }
        }

        $progressBar->finish();
        $io->success('Companies successfully replicated in Database.');

        return Command::SUCCESS;
    }

    private function storeIntoDatabase(array $companies, $progressBar = null)
    {
        // Increase memory limit
        ini_set('memory_limit', '1024M');


        // Get the DBAL connection
        $connection = $this->entityManager->getConnection();


        // Prepare the statement once
        $sql = 'INSERT INTO company (api_id, name) 
            VALUES (:apiId, :name) 
            ON DUPLICATE KEY UPDATE 
            name = VALUES(name)';

        $stmt = $connection->prepare($sql);

        // Begin transaction
        $connection->beginTransaction();

        try {
            foreach ($companies as $company) {
                $stmt->executeQuery([
                    'apiId' => $company['id'],
                    'name' => $company['name']
                ]);

                if ($progressBar) {
                    $progressBar->advance();
                }
            }



            // Commit the transaction
            $connection->commit();
            // Force garbage collection
            gc_collect_cycles();
        } catch (\Exception $e) {
            $connection->rollBack();
            throw $e;
        }
    }
}
