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

        //     $this->storeGamesIntoDatabase($games);
        // }

        // return Command::SUCCESS;



        // $io->success('Games succesfully replicated in Database.');

        // return Command::SUCCESS;
    }



    private function storeGamesIntoDatabase(array $games)
    {
        // Increase memory limit
        ini_set('memory_limit', '1024M');

        // Get the DBAL connection
        $connection = $this->entityManager->getConnection();

        // Begin transaction
        $connection->beginTransaction();

        try {
            // Map all game API IDs we're processing
            //? gameApiIds = [id,id,id...]
            $gameApiIds = array_column($games, 'id');

            $gameIdMap = [];

            if (!empty($gameApiIds)) {
                // N times ? for the number of gameApiIds with a , inbetween
                //? placeholders = ?,?,?
                $placeholders = implode(',', array_fill(0, count($gameApiIds), '?'));
                // Prepare the statement
                $existingGamesQuery = $connection->prepare("SELECT id, api_id FROM game WHERE api_id IN ($placeholders)");

                // Executes the query and fetches the data in an associative array
                //? existingGames = [[id => 1, api_id => 1], [id => 2...]]
                $existingGames = $existingGamesQuery->executeQuery($gameApiIds)->fetchAllAssociative();

                foreach ($existingGames as $existingGame) {
                    //? gameIdMap[api_id] = id
                    $gameIdMap[$existingGame['api_id']] = $existingGame['id'];
                }
            }

            // Collect all genre and company API IDs we need to look up
            $allGenreApiIds = [];
            $allCompanyApiIds = [];

            foreach ($games as $game) {
                if (isset($game['genres'])) {
                    foreach ($game['genres'] as $genre) {
                        $allGenreApiIds[] = $genre['id'];
                    }
                }

                if (isset($game['involved_companies'])) {
                    foreach ($game['involved_companies'] as $company) {
                        $allCompanyApiIds[] = $company['company']['id'];
                    }
                }
            }

            // Get all genre IDs in a single query
            $genreIdMap = [];
            if (!empty($allGenreApiIds)) {
                $allGenreApiIds = array_unique($allGenreApiIds);
                $placeholders = implode(',', array_fill(0, count($allGenreApiIds), '?'));
                $genresQuery = $connection->prepare("SELECT id, api_id FROM genre WHERE api_id IN ($placeholders)");
                $genres = $genresQuery->executeQuery($allGenreApiIds)->fetchAllAssociative();

                foreach ($genres as $genre) {
                    $genreIdMap[$genre['api_id']] = $genre['id'];
                }
            }

            // Get all company IDs in a single query
            $companyIdMap = [];
            if (!empty($allCompanyApiIds)) {
                $allCompanyApiIds = array_unique($allCompanyApiIds);
                $placeholders = implode(',', array_fill(0, count($allCompanyApiIds), '?'));
                $companiesQuery = $connection->prepare("SELECT id, api_id FROM company WHERE api_id IN ($placeholders)");
                $companies = $companiesQuery->executeQuery($allCompanyApiIds)->fetchAllAssociative();

                foreach ($companies as $company) {
                    $companyIdMap[$company['api_id']] = $company['id'];
                }
            }

            // Collect all game IDs we're processing
            $gameDbIds = array_values($gameIdMap);

            // Get all existing genre relationships in one query
            $existingGenreRelations = [];
            if (!empty($gameDbIds)) {
                $placeholders = implode(',', array_fill(0, count($gameDbIds), '?'));
                $existingGenreRelationsQuery = $connection->prepare(
                    "SELECT game_id, genre_id FROM game_genre WHERE game_id IN ($placeholders)"
                );
                $existingGenreRelations = $existingGenreRelationsQuery->executeQuery($gameDbIds)->fetchAllAssociative();
            }

            // Organize existing genre relationships by game_id
            $existingGenreIdsByGame = [];
            foreach ($existingGenreRelations as $relation) {
                $existingGenreIdsByGame[$relation['game_id']][] = $relation['genre_id'];
            }

            // Get all existing company relationships in one query
            $existingCompanyRelations = [];
            if (!empty($gameDbIds)) {
                $placeholders = implode(',', array_fill(0, count($gameDbIds), '?'));
                $existingCompanyRelationsQuery = $connection->prepare(
                    "SELECT game_id, company_id FROM game_company WHERE game_id IN ($placeholders)"
                );
                $existingCompanyRelations = $existingCompanyRelationsQuery->executeQuery($gameDbIds)->fetchAllAssociative();
            }

            // Organize existing company relationships by game_id
            $existingCompanyIdsByGame = [];
            foreach ($existingCompanyRelations as $relation) {
                $existingCompanyIdsByGame[$relation['game_id']][] = $relation['company_id'];
            }

            //! Prepare the statement for games

            $sql = 'INSERT INTO game (api_id, title, released_at, image_url, last_updated_at) 
                    VALUES (:apiId, :title, :releasedAt, :imageUrl, :lastUpdatedAt) 
                    ON DUPLICATE KEY UPDATE 
                    title = VALUES(title),
                    released_at = VALUES(released_at),
                    image_url = VALUES(image_url),
                    last_updated_at = VALUES(last_updated_at)';

            $stmt = $connection->prepare($sql);

            foreach ($games as $game) {
                $releasedAt = isset($game['first_release_date'])
                    ? date('Y-m-d H:i:s', $game['first_release_date'])
                    : null;

                $imageUrl = isset($game['cover']['url'])
                    ? 'https:' . $game['cover']['url']
                    : null;

                // Insert or update the game
                $stmt->executeQuery([
                    'apiId' => $game['id'],
                    'title' => $game['name'],
                    'releasedAt' => $releasedAt,
                    'imageUrl' => $imageUrl,
                    'lastUpdatedAt' => date('Y-m-d H:i:s')
                ]);

                // If this is a new game, get its ID for the relationships
                if (!isset($gameIdMap[$game['id']])) {
                    $gameIdMap[$game['id']] = $connection->lastInsertId();
                }

                $gameId = $gameIdMap[$game['id']];

                // Handle genre relationships
                if (isset($game['genres'])) {
                    $gameGenreIds = [];
                    // For each genre, get the corresponding ID from the genreIdMap
                    foreach ($game['genres'] as $genre) {
                        if (isset($genreIdMap[$genre['id']])) {
                            $gameGenreIds[] = $genreIdMap[$genre['id']];
                        }
                    }

                    // Get the existing genre relationships for this game
                    $existingGenreIds = $existingGenreIdsByGame[$gameId] ?? [];

                    // Calculate genres to add and remove
                    $toAdd = array_diff($gameGenreIds, $existingGenreIds);
                    $toRemove = array_diff($existingGenreIds, $gameGenreIds);

                    // Remove relationships
                    if (!empty($toRemove)) {
                        $removePlaceholders = implode(',', array_fill(0, count($toRemove), '?'));
                        $removeStmt = $connection->prepare(
                            "DELETE FROM game_genre WHERE game_id = ? AND genre_id IN ($removePlaceholders)"
                        );
                        $params = array_merge([$gameId], $toRemove);
                        $removeStmt->executeQuery($params);
                    }

                    // Add new relationships
                    if (!empty($toAdd)) {
                        $insertValues = [];
                        $insertParams = [];

                        foreach ($toAdd as $genreId) {
                            $insertValues[] = "(?, ?)";
                            $insertParams[] = $gameId;
                            $insertParams[] = $genreId;
                        }

                        if (!empty($insertValues)) {
                            $insertSql = "INSERT INTO game_genre (game_id, genre_id) VALUES " . implode(', ', $insertValues);
                            $connection->executeQuery($insertSql, $insertParams);
                        }
                    }
                }

                // Handle company relationships
                if (isset($game['involved_companies'])) {
                    $gameCompanyIds = [];
                    foreach ($game['involved_companies'] as $involvedCompany) {
                        $companyApiId = $involvedCompany['company']['id'];
                        if (isset($companyIdMap[$companyApiId])) {
                            $gameCompanyIds[] = $companyIdMap[$companyApiId];
                        }
                    }

                    // Get the existing company relationships for this game
                    $existingCompanyIds = $existingCompanyIdsByGame[$gameId] ?? [];

                    // Calculate companies to add and remove
                    $toAdd = array_diff($gameCompanyIds, $existingCompanyIds);
                    $toRemove = array_diff($existingCompanyIds, $gameCompanyIds);

                    // Remove relationships
                    if (!empty($toRemove)) {
                        $removePlaceholders = implode(',', array_fill(0, count($toRemove), '?'));
                        $removeStmt = $connection->prepare(
                            "DELETE FROM game_company WHERE game_id = ? AND company_id IN ($removePlaceholders)"
                        );
                        $params = array_merge([$gameId], $toRemove);
                        $removeStmt->executeQuery($params);
                    }

                    // Add new relationships
                    if (!empty($toAdd)) {
                        $insertValues = [];
                        $insertParams = [];

                        foreach ($toAdd as $companyId) {
                            $insertValues[] = "(?, ?)";
                            $insertParams[] = $gameId;
                            $insertParams[] = $companyId;
                        }

                        if (!empty($insertValues)) {
                            $insertSql = "INSERT INTO game_company (game_id, company_id) VALUES " . implode(', ', $insertValues);
                            $connection->executeQuery($insertSql, $insertParams);
                        }
                    }
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
