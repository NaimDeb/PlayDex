<?php

namespace App\Command;

use App\Config\Api\DataImportRegistry;
use App\Entity\UpdateHistory;
use App\Repository\UpdateHistoryRepository;
use Symfony\Component\Console\Attribute\AsCommand;
use Symfony\Component\Console\Command\Command;
use Symfony\Component\Console\Input\ArrayInput;
use Symfony\Component\Console\Input\InputInterface;
use Symfony\Component\Console\Input\InputOption;
use Symfony\Component\Console\Output\OutputInterface;
use Symfony\Component\Console\Style\SymfonyStyle;
use Symfony\Component\Scheduler\Attribute\AsCronTask;

#[AsCommand(
    name: 'app:get-igdb-data',
    description: 'Executes all IGDB import commands in the correct order',
)]
#[AsCronTask(expression: '0 0 * * *', timezone: 'UTC')]
class GetIgdbDataCommand extends Command
{
    private UpdateHistoryRepository $updateHistoryRepository;
    private DataImportRegistry $igdbRegistry;

    public function __construct(
        UpdateHistoryRepository $updateHistoryRepository,
        DataImportRegistry $igdbRegistry
    ) {
        parent::__construct();
        $this->updateHistoryRepository = $updateHistoryRepository;
        $this->igdbRegistry = $igdbRegistry;
    }

    protected function configure(): void
    {
        $this->setDescription('Executes all IGDB import commands in sequence');
        $this->addOption('force', null, InputOption::VALUE_NONE, 'Force execution of all commands');
        $this->addOption('skip', null, InputOption::VALUE_OPTIONAL, 'Skip specific data types by key, separated by commas');
        $this->addOption('only', null, InputOption::VALUE_OPTIONAL, 'Run only specific data types by key, separated by commas');
    }

    protected function execute(InputInterface $input, OutputInterface $output): int
    {
        $io = new SymfonyStyle($input, $output);
        $io->title(sprintf('Starting %s Data Import Process', $this->igdbRegistry->getProviderName()));

        $latestUpdateDate = $this->updateHistoryRepository->getLatestUpdateDate();
        $io->info(sprintf('Latest update date: %s', $latestUpdateDate ?? 'No previous updates found.'));

        // Build the list of commands to execute
        $commandsToExecute = $this->getCommandsToExecute($input, $io);

        if (empty($commandsToExecute)) {
            $io->warning('No data types selected for import.');
            return Command::SUCCESS;
        }

        $application = $this->getApplication();

        foreach ($commandsToExecute as $dataKey => $definition) {
            $commandName = $this->getCommandNameForDataType($dataKey);

            if (!$commandName) {
                $io->warning(sprintf('No command found for data type: %s', $dataKey));
                continue;
            }

            $io->section(sprintf('Importing: %s', $definition->getName()));

            try {
                $command = $application->find($commandName);
                $arguments = [
                    'command' => $commandName,
                    '--from' => !$input->getOption('force') ? $latestUpdateDate : null,
                ];

                $commandInput = new ArrayInput($arguments);
                $returnCode = $command->run($commandInput, $output);

                if ($returnCode !== Command::SUCCESS) {
                    $io->error(sprintf('Command %s failed with return code %d', $commandName, $returnCode));
                    return Command::FAILURE;
                }

                $io->success(sprintf('Successfully imported: %s', $definition->getName()));
            } catch (\Exception $e) {
                $io->error(sprintf('Error executing %s: %s', $commandName, $e->getMessage()));
                return Command::FAILURE;
            }
        }

        // Update the latest update date
        $io->info('Updating the latest update date...');
        $updateHistory = new UpdateHistory();
        $entityManager = $this->updateHistoryRepository->getEntityManager();
        $entityManager->persist($updateHistory);
        $entityManager->flush();

        $io->success(sprintf('All %s import commands have been successfully executed!', $this->igdbRegistry->getProviderName()));
        return Command::SUCCESS;
    }

    /**
     * Determine which data types to import based on options
     * 
     * @return array<string, \App\Config\Api\DataImportDefinition>
     */
    private function getCommandsToExecute(InputInterface $input, SymfonyStyle $io): array
    {
        $allDefinitions = $this->igdbRegistry->all();

        // Check for 'only' option (most restrictive)
        if ($input->getOption('only')) {
            $onlyKeys = array_map('trim', explode(',', $input->getOption('only')));
            $selected = [];

            foreach ($onlyKeys as $key) {
                if ($this->igdbRegistry->has($key)) {
                    $selected[$key] = $this->igdbRegistry->get($key);
                } else {
                    $io->warning(sprintf('Data type not found: %s', $key));
                }
            }

            return $selected;
        }

        // Check for 'skip' option (removes specific types)
        $skipKeys = [];
        if ($input->getOption('skip')) {
            $skipKeys = array_map('trim', explode(',', $input->getOption('skip')));
        }

        return array_filter(
            $allDefinitions,
            fn($key) => !in_array($key, $skipKeys),
            ARRAY_FILTER_USE_KEY
        );
    }

    /**
     * Map a data type key to its console command name
     */
    private function getCommandNameForDataType(string $dataKey): ?string
    {
        $commandMap = [
            'igdb_genres' => 'app:get-genres-from-igdb',
            'igdb_companies' => 'app:get-companies-from-igdb',
            'igdb_games' => 'app:get-games-from-igdb',
            'igdb_extensions' => 'app:get-extensions-from-igdb',
        ];

        return $commandMap[$dataKey] ?? null;
    }
}
