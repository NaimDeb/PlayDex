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
            ->addArgument('arg1', InputArgument::OPTIONAL, 'Argument description')
            ->addOption('option1', null, InputOption::VALUE_NONE, 'Option description')
        ;
    }

    protected function execute(InputInterface $input, OutputInterface $output): int
    {
        $io = new SymfonyStyle($input, $output);
        // $arg1 = $input->getArgument('arg1');

        // if ($arg1) {
        //     $io->note(sprintf('You passed an argument: %s', $arg1));
        // }

        // if ($input->getOption('option1')) {
        //     // ...
        // }

        // 4 requête / seconde




        // Get and store x-count
        $xCount = $this->externalApiService->getNumberOfIgdbGames();
        $io->text(sprintf('Number of games to check : %s', $xCount));
        
        $games = $this->externalApiService->getIgdbGames(2);

        

            
        $this->storeGamesIntoDatabase($games);



        return Command::SUCCESS;
        

        
        // Store into database
        $this->storeGamesIntoDatabase($games);

        
        //For i = 500, i < x-count, i += 500
        // for ($i=500; $i < $xCount; $i+=500) { 
            
        //     $games = $this->externalApiService->getIgdbGames(500, $i);
            
        //     $this->storeIntoDatabase($games);
        // }
        
        // return Command::SUCCESS;
        


        // $io->success('Games succesfully replicated in Database.');

        // return Command::SUCCESS;
    }


    private function storeGamesIntoDatabase(array $games){

        foreach ($games as $game) {
            // Check if already in DB ?
            $existingGame = $this->entityManager->getRepository(Game::class)->findOneBy(['apiId' => $game['id']]);


            $gameEntity = $existingGame ?? new Game();
        

                $gameEntity->setApiId($game['id']);
                $gameEntity->setTitle($game['name']);
                $gameEntity->setReleasedAt(new \DateTimeImmutable('@' . $game['first_release_date']));
                
                // Handle image URL if cover exists
                if (isset($game['cover']['url'])) {
                    $imageUrl = 'https:' . $game['cover']['url'];
                    $gameEntity->setImageUrl($imageUrl);
                }
            
                // Handle genres
                if (isset($game['genres'])) {
                    $genres = $this->entityManager->getRepository(Genre::class)->findBy(['apiId' => array_column($game['genres'], 'id')]);
                    // Add genres to the Game
                    foreach ($genres as $genre) {
                        if (!$gameEntity->getGenres()->contains($genre)) {

                            $gameEntity->addGenre($genre);
                        }
                    }
                    
                    // Removes each genre that are not in the API's data.
                    foreach ($gameEntity->getGenres() as $genre) {
                        if (!in_array($genre->getApiId(), array_column($game['genres'], 'id'), true)) {
                            $gameEntity->removeGenre($genre);
                        }
                    }
                }
            
                // Handle companies
                if (isset($game['involved_companies'])) {
                    // Extract company IDs and names correctly from the nested structure
                    $companyNames = array_map(function($company) {
                        return $company['company']['name'];
                    }, $game['involved_companies']);
                
                    $companies = $this->entityManager->getRepository(Company::class)
                        ->findBy(['name' => $companyNames]);
                
                    // Add companies to the Game
                    foreach ($companies as $company) {
                        if (!$gameEntity->getCompanies()->contains($company)) {
                            $gameEntity->addCompany($company);
                        }
                    }
                    
                    // Removes each company that is not in the API's data
                    foreach ($gameEntity->getCompanies() as $company) {
                        if (!in_array($company->getName(), $companyNames, true)) {
                            $gameEntity->removeCompany($company);
                        }
                    }
                }
            
                $this->entityManager->persist($gameEntity);
            }
        $this->entityManager->flush();
    }
}
