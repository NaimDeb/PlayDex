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

#[AsCommand(
    name: 'app:get-genres-from-igdb',
    aliases: ['app:fetch-genres'],
    description: 'Fetches the genres from IGDB and stores them in the database.',
)]
class GetGenresFromIgdbCommand extends Command
{
    private $externalApiService;
    private $entityManager;

    public function __construct(ExternalApiService $externalApiService, EntityManagerInterface $entityManager)
    {
        parent::__construct();

        $this->externalApiService = $externalApiService;
        $this->entityManager = $entityManager;
    }

    // protected function configure(): void
    // {
    //     $this
    //         ->addArgument('arg1', InputArgument::OPTIONAL, 'Argument description')
    //         ->addOption('option1', null, InputOption::VALUE_NONE, 'Option description')
    //     ;
    // }

    protected function execute(InputInterface $input, OutputInterface $output): int
    {
        $io = new SymfonyStyle($input, $output);


        // Get and store x-count
        $io->text('Fetching genres from IGDB...');
        $xCount = $this->externalApiService->getNumberOfIgdbGenres();
        $io->text(sprintf('Number of genres to check : %s', $xCount));

        $progressBar = $io->createProgressBar($xCount);
        $progressBar->setFormat('debug');
        $progressBar->start();
        
        // Get the 500 first genres
        $io->text('Fetching first 500 genres from IGDB...');
        $genres = $this->externalApiService->getIgdbGenres(500);
        

        // Store into database
        $io->text('Storing genres into database...');
        $this->storeIntoDatabase($genres, $progressBar);
        
        


        // In case there's more than 500 genres, we need to do multiple requests
        if ($xCount > 500) {

            //For i = 500, i < x-count, i += 500
            for ($i=500; $i < $xCount; $i+=500) {
                
                $genres = $this->externalApiService->getIgdbGenres(500, $i);
                
                $this->storeIntoDatabase($genres, $progressBar);
            }
        }


        $io->success('Games succesfully replicated in Database.');

        return Command::SUCCESS;
    }


    private function storeIntoDatabase(array $genres, $progressBar = null){

        foreach ($genres as $genre) {
            // Check if already in DB ?
            $existingGenre = $this->entityManager->getRepository(Genre::class)->findOneBy(['apiId' => $genre['id']]);

            /** @var Genre */
            $genreEntity = $existingGenre ?? new Genre();
        
                $genreEntity->setApiId($genre['id']);
                $genreEntity->setName($genre['name']);

                if ($progressBar) {
                    $progressBar->advance();
                }
            
                $this->entityManager->persist($genreEntity);
            }
        $this->entityManager->flush();
    }

}
