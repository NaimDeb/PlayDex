<?php

declare(strict_types=1);

namespace App\Command;

use App\Config\SteamConfig;
use App\Entity\Patchnote;
use App\Repository\GameRepository;
use App\Repository\PatchnoteRepository;
use App\Service\Steam\SteamBotUserProvider;
use App\Service\Steam\SteamPatchnoteSource;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Component\Console\Attribute\AsCommand;
use Symfony\Component\Console\Command\Command;
use Symfony\Component\Console\Input\InputInterface;
use Symfony\Component\Console\Input\InputOption;
use Symfony\Component\Console\Output\OutputInterface;
use Symfony\Component\Console\Style\SymfonyStyle;

#[AsCommand(
    name: 'app:fetch-steam-history',
    description: 'Fetch all historical patch notes from Steam for a game or all games',
)]
class FetchSteamHistoryCommand extends Command
{
    public function __construct(
        private readonly SteamPatchnoteSource $patchnoteSource,
        private readonly GameRepository $gameRepository,
        private readonly PatchnoteRepository $patchnoteRepository,
        private readonly EntityManagerInterface $em,
        private readonly SteamBotUserProvider $botUserProvider,
    ) {
        parent::__construct();
    }

    protected function configure(): void
    {
        $this
            ->addOption('game', 'g', InputOption::VALUE_REQUIRED, 'Internal game ID to fetch history for')
            ->addOption('steam-id', 's', InputOption::VALUE_REQUIRED, 'Steam App ID to fetch history for')
            ->addOption('all', null, InputOption::VALUE_NONE, 'Fetch history for all games with a steam_id')
            ->addOption('dry-run', null, InputOption::VALUE_NONE, 'Show what would be fetched without persisting');
    }

    protected function execute(InputInterface $input, OutputInterface $output): int
    {
        $io = new SymfonyStyle($input, $output);
        $io->title('Steam Historical Patchnote Fetch');

        $games = $this->resolveGames($input, $io);
        if ($games === null) {
            return Command::FAILURE;
        }

        $botUser = $this->botUserProvider->getBotUser();
        $dryRun = $input->getOption('dry-run');
        $totalCreated = 0;
        $totalSkipped = 0;

        foreach ($games as $game) {
            $steamId = $game->getSteamId();
            $io->section(sprintf('Processing: %s (Steam ID: %d)', $game->getTitle(), $steamId));

            $endDate = null;
            $pageNumber = 0;
            $gameCreated = 0;
            $gameSkipped = 0;

            do {
                $pageNumber++;
                $result = $this->patchnoteSource->fetchHistoricalNews($steamId, $endDate);
                $items = $result['items'];
                $hasMore = $result['hasMore'];

                if (empty($items)) {
                    break;
                }

                $io->text(sprintf('  Page %d: received %d items', $pageNumber, count($items)));

                $pendingFlush = 0;
                foreach ($items as $data) {
                    $gid = $data['gid'];
                    if ($gid === '') {
                        $gameSkipped++;
                        continue;
                    }

                    if ($this->patchnoteRepository->findByExternalId($gid) !== null) {
                        $gameSkipped++;
                        continue;
                    }

                    if (!$dryRun) {
                        $patchnote = new Patchnote();
                        $patchnote->setTitle($data['title']);
                        $patchnote->setContent($data['content']);
                        $patchnote->setReleasedAt(new \DateTimeImmutable('@' . $data['date']));
                        $patchnote->setExternalId($gid);
                        $patchnote->setGame($game);
                        $patchnote->setCreatedBy($botUser);
                        $patchnote->setCreatedAt(new \DateTimeImmutable());
                        $patchnote->setIsDeleted(false);

                        $this->em->persist($patchnote);
                        $pendingFlush++;

                        if ($pendingFlush >= SteamConfig::FLUSH_BATCH_SIZE) {
                            $this->em->flush();
                            $pendingFlush = 0;
                        }
                    }

                    $gameCreated++;
                }

                if ($pendingFlush > 0) {
                    $this->em->flush();
                }

                // Advance pagination cursor
                $lastItem = end($items);
                $newEndDate = $lastItem['date'];

                // Guard against infinite loop if timestamps don't advance
                if ($endDate !== null && $newEndDate >= $endDate) {
                    $newEndDate = $endDate - 1;
                }
                $endDate = $newEndDate;

                usleep(SteamConfig::HISTORY_FETCH_DELAY_US);
            } while ($hasMore);

            $totalCreated += $gameCreated;
            $totalSkipped += $gameSkipped;

            $io->text(sprintf('  Done: %d created, %d skipped (duplicates)', $gameCreated, $gameSkipped));

            // Free memory between games
            $this->em->clear();
            $botUser = $this->botUserProvider->getBotUser();
        }

        $prefix = $dryRun ? '[DRY RUN] Would have created' : 'Created';
        $io->success(sprintf('%s %d patchnote(s). Skipped %d duplicate(s).', $prefix, $totalCreated, $totalSkipped));

        return Command::SUCCESS;
    }

    /**
     * @return \App\Entity\Game[]|null
     */
    private function resolveGames(InputInterface $input, SymfonyStyle $io): ?array
    {
        $gameId = $input->getOption('game');
        $steamId = $input->getOption('steam-id');
        $all = $input->getOption('all');

        $modeCount = ($gameId !== null ? 1 : 0) + ($steamId !== null ? 1 : 0) + ($all ? 1 : 0);
        if ($modeCount !== 1) {
            $io->error('Specify exactly one of: --game=<id>, --steam-id=<appId>, or --all');
            return null;
        }

        if ($all) {
            $games = $this->gameRepository->findAllWithSteamId();
            if (empty($games)) {
                $io->warning('No games with a steam_id found in the database.');
                return null;
            }
            $io->info(sprintf('Found %d game(s) with a steam_id.', count($games)));
            return $games;
        }

        if ($steamId !== null) {
            $game = $this->gameRepository->findBySteamId((int) $steamId);
            if ($game === null) {
                $io->error(sprintf('No game found with steam_id = %s', $steamId));
                return null;
            }
            return [$game];
        }

        $game = $this->gameRepository->find((int) $gameId);
        if ($game === null) {
            $io->error(sprintf('No game found with id = %s', $gameId));
            return null;
        }
        if ($game->getSteamId() === null) {
            $io->error(sprintf('Game "%s" does not have a steam_id.', $game->getTitle()));
            return null;
        }
        return [$game];
    }
}
