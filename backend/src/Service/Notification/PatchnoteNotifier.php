<?php

declare(strict_types=1);

namespace App\Service\Notification;

use App\Entity\Patchnote;
use App\Entity\User;
use App\Interfaces\Repository\FollowedGamesRepositoryInterface;
use Psr\Log\LoggerInterface;
use Symfony\Bridge\Twig\Mime\TemplatedEmail;
use Symfony\Component\DependencyInjection\Attribute\Autowire;
use Symfony\Component\Mailer\Exception\TransportExceptionInterface;
use Symfony\Component\Mailer\MailerInterface;
use Symfony\Component\Mime\Address;

/**
 * Notifie par email les utilisateurs qui suivent un jeu à chaque nouvelle patchnote.
 * Un échec d'envoi est logué et n'interrompt pas les destinataires suivants.
 */
class PatchnoteNotifier
{
    public function __construct(
        private readonly MailerInterface $mailer,
        private readonly FollowedGamesRepositoryInterface $followedGamesRepository,
        private readonly LoggerInterface $logger,
        private readonly NotificationPreferenceManager $preferences,
        #[Autowire(param: 'MAILER_FROM')]
        private readonly string $fromAddress,
        #[Autowire(param: 'FRONTEND_URL')]
        private readonly string $frontendUrl,
    ) {
    }

    /**
     * @return int nombre d'emails effectivement envoyés
     */
    public function notifyNewPatchnote(Patchnote $patchnote): int
    {
        $game = $patchnote->getGame();

        if ($game === null || $patchnote->isDeleted()) {
            return 0;
        }

        $sent = 0;

        foreach ($this->followedGamesRepository->findByGame($game) as $followedGame) {
            $user = $followedGame->getUser();

            if ($user === null || !$this->isNotifiable($user, $patchnote)) {
                continue;
            }

            if ($this->send($user, $patchnote)) {
                $sent++;
            }
        }

        return $sent;
    }

    private function isNotifiable(User $user, Patchnote $patchnote): bool
    {
        if ($user->isDeleted() || !$user->isEmailNotifications()) {
            return false;
        }

        $email = $user->getEmail();

        if ($email === null || $email === '') {
            return false;
        }

        return $user !== $patchnote->getCreatedBy();
    }

    private function send(User $user, Patchnote $patchnote): bool
    {
        $game = $patchnote->getGame();
        $unsubscribeUrl = $this->preferences->generateUnsubscribeUrl($user);

        $email = (new TemplatedEmail())
            ->from(new Address($this->fromAddress, 'PlayDex'))
            ->to(new Address((string) $user->getEmail(), (string) $user->getUsername()))
            ->subject(sprintf('%s — nouvelle mise à jour', (string) $game->getTitle()))
            ->htmlTemplate('emails/patchnote_published.html.twig')
            ->context([
                'username' => $user->getUsername(),
                'gameTitle' => $game->getTitle(),
                'patchnoteTitle' => $patchnote->getTitle(),
                'patchnoteSummary' => $patchnote->getSmallDescription(),
                'releasedAt' => $patchnote->getReleasedAt(),
                'patchnoteUrl' => $this->buildPatchnoteUrl($patchnote),
                'unsubscribeUrl' => $unsubscribeUrl,
                'preferencesUrl' => rtrim($this->frontendUrl, '/') . '/profile/edit',
            ]);

        // RFC 8058 : fait apparaître le bouton « Se désabonner » natif de Gmail/Yahoo,
        // qui appelle l'URL en POST sans que l'utilisateur quitte sa boîte mail.
        $email->getHeaders()->addTextHeader('List-Unsubscribe', sprintf('<%s>', $unsubscribeUrl));
        $email->getHeaders()->addTextHeader('List-Unsubscribe-Post', 'List-Unsubscribe=One-Click');

        try {
            $this->mailer->send($email);

            return true;
        } catch (TransportExceptionInterface $e) {
            $this->logger->error('Échec de l\'envoi de la notification de patchnote.', [
                'patchnoteId' => $patchnote->getId(),
                'userId' => $user->getId(),
                'exception' => $e,
            ]);

            return false;
        }
    }

    private function buildPatchnoteUrl(Patchnote $patchnote): string
    {
        return sprintf(
            '%s/article/%d/patchnote/%d',
            rtrim($this->frontendUrl, '/'),
            $patchnote->getGame()->getId(),
            $patchnote->getId(),
        );
    }
}
