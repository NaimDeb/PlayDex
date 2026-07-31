<?php

declare(strict_types=1);

namespace App\Service\Notification;

use App\Entity\User;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\UriSigner;
use Symfony\Component\Routing\Generator\UrlGeneratorInterface;

/**
 * La désinscription doit rester possible sans connexion (RGPD) : la légitimité
 * vient d'une URL signée qui expire, pas d'une session.
 */
class NotificationPreferenceManager
{
    public const LINK_TTL = '+90 days';

    public const ROUTE_UNSUBSCRIBE = 'notifications_unsubscribe';

    public function __construct(
        private readonly EntityManagerInterface $entityManager,
        private readonly UrlGeneratorInterface $urlGenerator,
        private readonly UriSigner $uriSigner,
    ) {
    }

    public function generateUnsubscribeUrl(User $user): string
    {
        $url = $this->urlGenerator->generate(
            self::ROUTE_UNSUBSCRIBE,
            ['id' => $user->getId()],
            UrlGeneratorInterface::ABSOLUTE_URL,
        );

        return $this->uriSigner->sign($url, new \DateTimeImmutable(self::LINK_TTL));
    }

    /** Vérifie la signature et la date d'expiration. */
    public function isValidUnsubscribeRequest(Request $request): bool
    {
        return $this->uriSigner->checkRequest($request);
    }

    public function setEmailNotifications(User $user, bool $enabled): void
    {
        if ($user->isEmailNotifications() === $enabled) {
            return;
        }

        $user->setEmailNotifications($enabled);
        $this->entityManager->flush();
    }
}
