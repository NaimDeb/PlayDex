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
 * Envoie un email aux utilisateurs qui suivent un jeu lorsqu'une nouvelle
 * patchnote est publiée pour ce jeu.
 *
 * L'échec d'envoi d'un email ne doit jamais interrompre le traitement :
 * chaque destinataire est isolé et les erreurs sont loguées.
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
     * Notifie tous les abonnés éligibles du jeu concerné.
     *
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

    /**
     * Un utilisateur est notifiable s'il a une adresse email, un compte actif,
     * les notifications activées, et qu'il n'est pas l'auteur de la patchnote.
     */
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
