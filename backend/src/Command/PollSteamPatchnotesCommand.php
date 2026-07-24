<?php

declare(strict_types=1);

namespace App\Command;

use App\Config\SteamConfig;
use App\Entity\Patchnote;
use App\Repository\GameRepository;
use App\Repository\PatchnoteRepository;
use App\Service\Notification\PatchnoteNotifier;
use App\Service\Steam\SteamBotUserProvider;
use App\Service\Steam\SteamPatchnoteSource;
use Doctrine\ORM\EntityManagerInterface;
use Psr\Cache\CacheItemPoolInterface;
use Symfony\Component\Console\Attribute\AsCommand;
use Symfony\Component\Console\Command\Command;
use Symfony\Component\Console\Input\InputInterface;
use Symfony\Component\Console\Input\InputOption;
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
        private readonly PatchnoteNotifier $notifier,
    ) {
        parent::__construct();
    }

    protected function configure(): void
    {
        $this->addOption(
            'no-notify',
            null,
            InputOption::VALUE_NONE,
            'Ne pas envoyer les emails de notification aux abonnés (utile pour un rattrapage)',
        );
    }

    protected function execute(InputInterface $input, OutputInterface $output): int
    {
        $io = new SymfonyStyle($input, $output);
        $io->title('Steam Patchnote Polling');
        $io->writeln(sprintf('[%s] Démarrage du poll Steam...', date('Y-m-d H:i:s')));

        $rawPatchnotes = $this->patchnoteSource->fetchRecentPatchnotes();

        if (empty($rawPatchnotes)) {
            $io->success('No new patchnotes found.');
            return Command::SUCCESS;
        }

        $io->info(sprintf('Received %d patchnote(s) from Steam poller.', count($rawPatchnotes)));

        $notificationsEnabled = !$input->getOption('no-notify');
        if (!$notificationsEnabled) {
            $io->note('Notifications désactivées (--no-notify).');
        }

        $botUser = $this->botUserProvider->getBotUser();
        $created = 0;
        $notified = 0;
        /** @var Patchnote[] $pendingNotifications patchnotes créées, en attente de flush (id non encore assigné) */
        $pendingNotifications = [];
        $skipped = 0;
        $skipCache = 0;
        $skipDb = 0;
        $skipUnknown = 0;
        $skipInvalid = 0;
        $skipEmpty = 0;
        $pendingFlush = 0;

        foreach ($rawPatchnotes as $data) {
            $gid = (string) ($data['gid'] ?? '');
            $appId = (int) ($data['appid'] ?? 0);
            $title = (string) ($data['title'] ?? '(sans titre)');

            if ($gid === '' || $appId === 0) {
                $skipped++;
                $skipInvalid++;
                $io->writeln(sprintf('  - appid=%d gid=%s "%s" — SKIP (gid/appId manquant)', $appId, $gid !== '' ? $gid : '?', $title));
                continue;
            }

            if (!SteamPatchnoteSource::hasTextContent($data['content'] ?? null)) {
                $skipped++;
                $skipEmpty++;
                $io->writeln(sprintf('  - appid=%d gid=%s "%s" — SKIP (contenu vide)', $appId, $gid, $title));
                continue;
            }

            // Cache check: skip recently processed GIDs (chemin rapide, sans requête jeu)
            $cacheKey = 'steam_gid_' . $gid;
            $cacheItem = $this->cache->getItem($cacheKey);
            if ($cacheItem->isHit()) {
                $skipped++;
                $skipCache++;
                $io->writeln(sprintf('  ~ appid=%d gid=%s "%s" — SKIP (déjà traité récemment / cache)', $appId, $gid, $title));
                continue;
            }

            $game = $this->gameRepository->findBySteamId($appId);
            $gameName = $game !== null ? $game->getTitle() : '(jeu inconnu)';

            // DB dedup check
            $existing = $this->patchnoteRepository->findByExternalId($gid);
            if ($existing !== null) {
                // Still cache it so we don't query DB again for 20 min
                $cacheItem->set(true)->expiresAfter(SteamConfig::CACHE_TTL);
                $this->cache->save($cacheItem);
                $skipped++;
                $skipDb++;
                $io->writeln(sprintf('  - [%s] appid=%d gid=%s "%s" — SKIP (déjà en base, patchnote #%d)', $gameName, $appId, $gid, $title, $existing->getId()));
                continue;
            }

            // On n'attache les patchnotes qu'aux jeux déjà présents dans le catalogue.
            // Les apps Steam inconnues sont ignorées (pas de création de jeu vide).
            if ($game === null) {
                $skipped++;
                $skipUnknown++;
                $io->writeln(sprintf('  - appid=%d gid=%s "%s" — SKIP (jeu absent du catalogue)', $appId, $gid, $title));
                continue;
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
            $pendingNotifications[] = $patchnote;
            $io->writeln(sprintf('  ✓ [%s] appid=%d gid=%s "%s" — CRÉÉ', $gameName, $appId, $gid, $title));

            // Cache the GID
            $cacheItem->set(true)->expiresAfter(SteamConfig::CACHE_TTL);
            $this->cache->save($cacheItem);

            // Batch flush
            if ($pendingFlush >= SteamConfig::FLUSH_BATCH_SIZE) {
                $this->em->flush();
                $pendingFlush = 0;
                $notified += $this->notifyFollowers($pendingNotifications, $notificationsEnabled, $io);
                $pendingNotifications = [];
            }
        }

        // Final flush for remaining entities
        if ($pendingFlush > 0) {
            $this->em->flush();
        }
        $notified += $this->notifyFollowers($pendingNotifications, $notificationsEnabled, $io);

        $io->success(sprintf(
            '[%s] Terminé. Créés: %d — Skippés: %d (déjà en base: %d, cache: %d, jeu inconnu: %d,'
                . ' invalides: %d, contenu vide: %d) — Emails envoyés: %d.',
            date('Y-m-d H:i:s'),
            $created,
            $skipped,
            $skipDb,
            $skipCache,
            $skipUnknown,
            $skipInvalid,
            $skipEmpty,
            $notified
        ));

        return Command::SUCCESS;
    }

    /**
     * Notifie les abonnés des patchnotes fraîchement flushées (leur id est désormais assigné).
     *
     * L'envoi est volontairement non bloquant : une erreur de mail ne doit pas
     * faire échouer le poll, sinon les patchnotes suivantes ne seraient pas importées.
     *
     * @param Patchnote[] $patchnotes
     *
     * @return int nombre d'emails envoyés
     */
    private function notifyFollowers(array $patchnotes, bool $enabled, SymfonyStyle $io): int
    {
        if (!$enabled || $patchnotes === []) {
            return 0;
        }

        $total = 0;

        foreach ($patchnotes as $patchnote) {
            try {
                $sent = $this->notifier->notifyNewPatchnote($patchnote);
            } catch (\Throwable $e) {
                $io->warning(sprintf(
                    'Notification échouée pour la patchnote #%d : %s',
                    (int) $patchnote->getId(),
                    $e->getMessage()
                ));
                continue;
            }

            if ($sent > 0) {
                $io->writeln(sprintf('    → %d email(s) envoyé(s) pour la patchnote #%d', $sent, (int) $patchnote->getId()));
            }

            $total += $sent;
        }

        return $total;
    }
}
