<?php

declare(strict_types=1);

namespace App\Command;

use App\Config\SteamConfig;
use App\Entity\Game;
use App\Entity\Patchnote;
use App\Repository\GameRepository;
use App\Repository\PatchnoteRepository;
use App\Service\Steam\SteamBotUserProvider;
use App\Service\Steam\SteamPatchnoteSource;
use Doctrine\ORM\EntityManagerInterface;
use Psr\Cache\CacheItemPoolInterface;
use Symfony\Component\Console\Attribute\AsCommand;
use Symfony\Component\Console\Command\Command;
use Symfony\Component\Console\Input\InputInterface;
use Symfony\Component\Console\Output\OutputInterface;
use Symfony\Component\Console\Style\SymfonyStyle;

#[AsCommand(
    name: 'app:poll-steam-patchnotes',
    description: 'Poll Steam for recent patchnotes and store them in the database',
)]
class PollSteamPatchnotesCommand extends Command
{
    public function __construct(
        private readonly SteamPatchnoteSource $patchnoteSource,
        private readonly GameRepository $gameRepository,
        private readonly PatchnoteRepository $patchnoteRepository,
        private readonly EntityManagerInterface $em,
        private readonly CacheItemPoolInterface $cache,
        private readonly SteamBotUserProvider $botUserProvider,
    ) {
        parent::__construct();
    }

    protected function execute(InputInterface $input, OutputInterface $output): int
    {
        $io = new SymfonyStyle($input, $output);
        $io->title('Steam Patchnote Polling');

        $io->info('Running Steam poller...');
        $rawPatchnotes = $this->patchnoteSource->fetchRecentPatchnotes();

        if (empty($rawPatchnotes)) {
            $io->success('No new patchnotes found.');
            return Command::SUCCESS;
        }

        $io->info(sprintf('Received %d patchnote(s) from Steam poller.', count($rawPatchnotes)));

        $botUser = $this->botUserProvider->getBotUser();
        $created = 0;
        $skipped = 0;
        $gamesCreated = 0;
        $pendingFlush = 0;

        foreach ($rawPatchnotes as $data) {
            $gid = (string) ($data['gid'] ?? '');
            $appId = (int) ($data['appid'] ?? 0);

            if ($gid === '' || $appId === 0) {
                $skipped++;
                continue;
            }

            // Cache check: skip recently processed GIDs
            $cacheKey = 'steam_gid_' . $gid;
            $cacheItem = $this->cache->getItem($cacheKey);
            if ($cacheItem->isHit()) {
                $skipped++;
                continue;
            }

            // DB dedup check
            if ($this->patchnoteRepository->findByExternalId($gid) !== null) {
                // Still cache it so we don't query DB again for 20 min
                $cacheItem->set(true)->expiresAfter(SteamConfig::CACHE_TTL);
                $this->cache->save($cacheItem);
                $skipped++;
                continue;
            }

            // Game check: find or create
            $game = $this->gameRepository->findBySteamId($appId);
            if ($game === null) {
                $game = $this->createGame($appId, $data['title'] ?? 'Unknown');
                $gamesCreated++;
            }

            // Create patchnote
            $patchnote = new Patchnote();
            $patchnote->setTitle($data['title'] ?? '');
            $patchnote->setContent($data['content'] ?? '');
            $patchnote->setReleasedAt(
                new \DateTimeImmutable('@' . ($data['date'] ?? time()))
            );
            $patchnote->setExternalId($gid);
            $patchnote->setGame($game);
            $patchnote->setCreatedBy($botUser);
            $patchnote->setCreatedAt(new \DateTimeImmutable());
            $patchnote->setIsDeleted(false);

            $this->em->persist($patchnote);
            $created++;
            $pendingFlush++;

            // Cache the GID
            $cacheItem->set(true)->expiresAfter(SteamConfig::CACHE_TTL);
            $this->cache->save($cacheItem);

            // Batch flush
            if ($pendingFlush >= SteamConfig::FLUSH_BATCH_SIZE) {
                $this->em->flush();
                $pendingFlush = 0;
            }
        }

        // Final flush for remaining entities
        if ($pendingFlush > 0) {
            $this->em->flush();
        }

        $io->success(sprintf(
            'Done. Created: %d patchnote(s), %d game(s). Skipped: %d.',
            $created,
            $gamesCreated,
            $skipped
        ));

        return Command::SUCCESS;
    }

    private function createGame(int $steamId, string $title): Game
    {
        $game = new Game();
        $game->setSteamId($steamId);
        $game->setTitle($title);

        $this->em->persist($game);
        $this->em->flush();

        return $game;
    }
}
