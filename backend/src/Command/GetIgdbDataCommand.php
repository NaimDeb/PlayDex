<?php

namespace App\Command;

use App\Entity\UpdateHistory;
use App\Repository\UpdateHistoryRepository;
use Symfony\Component\Console\Attribute\AsCommand;
use Symfony\Component\Console\Command\Command;
use Symfony\Component\Console\Input\ArrayInput;
use Symfony\Component\Console\Input\InputInterface;
use Symfony\Component\Console\Input\InputOption;
use Symfony\Component\Console\Output\OutputInterface;
use Symfony\Component\Console\Style\SymfonyStyle;

#[AsCommand(
    name: 'app:get-igdb-data',
    description: 'Executes all IGDB import commands in the correct order',
)]
class GetIgdbDataCommand extends Command
{

    /**
     * Commands to execute in sequence.
     * The order of the commands in this array is important as it determines the sequence of execution.
     */
    private array $commandsToExecute = [
        'app:get-genres-from-igdb',
        'app:get-companies-from-igdb',
        'app:get-games-from-igdb',
        'app:get-extensions-from-igdb',
    ];

    private UpdateHistoryRepository $updateHistoryRepository;

    public function __construct(UpdateHistoryRepository $updateHistoryRepository)
    {
        parent::__construct();
        
        $this->updateHistoryRepository = $updateHistoryRepository;
    }

    // Todo : make skip option more flexible, e.g. skip all commands that start with a certain prefix
    protected function configure(): void
    {
        $this->setDescription('Executes all IGDB import commands in sequence');
        $this->addOption('force', null, InputOption::VALUE_NONE, 'Force execution of all commands');
        $this->addOption('skip', null, InputOption::VALUE_OPTIONAL, 'Skip specific commands by name, separated by commas');
    }

    protected function execute(InputInterface $input, OutputInterface $output): int
    {
        $io = new SymfonyStyle($input, $output);
        $io->title('Starting IGDB Data Import Process');

        $latestUpdateDate = $this->updateHistoryRepository->getLatestUpdateDate();

        $application = $this->getApplication();
        
        $skipCommands = $input->getOption('skip');
        $skipCommandsArray = $skipCommands ? explode(',', $skipCommands) : [];

        foreach ($this->commandsToExecute as $commandName) {
            if (in_array($commandName, $skipCommandsArray)) {
                $io->warning(sprintf('Skipping command: %s', $commandName));
                continue;
            }
            
            $io->section(sprintf('Executing command: %s', $commandName));
            
            $command = $application->find($commandName);
            $arguments = [
                'command' => $commandName,
                '--from' => !$input->getOption('force') && $commandName === 'app:get-games-from-igdb' ? $latestUpdateDate : null,
            ];
            
            $commandInput = new ArrayInput($arguments);
            
            try {
                $returnCode = $command->run($commandInput, $output);
                
                if ($returnCode !== Command::SUCCESS) {
                    $io->error(sprintf('Command %s failed with return code %d', $commandName, $returnCode));
                    return Command::FAILURE;
                }
            } catch (\Exception $e) {
                $io->error(sprintf('Error executing %s: %s', $commandName, $e->getMessage()));
                return Command::FAILURE;
            }
            
            $io->success(sprintf('Successfully executed %s', $commandName));
        }
        
        $io->success('All IGDB import commands have been successfully executed!');


        $io->info('Updating the latest update date...');

        $updateHistory = new UpdateHistory();

        $updateHistory->setUpdatedAt(new \DateTimeImmutable(time()));

        $this->updateHistoryRepository->persist($updateHistory);
        $this->updateHistoryRepository->flush($updateHistory);
        
        return Command::SUCCESS;
    }
}
