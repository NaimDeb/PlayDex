<?php

declare(strict_types=1);

namespace App\Service\Notification;

use App\Entity\User;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\UriSigner;
use Symfony\Component\Routing\Generator\UrlGeneratorInterface;

/**
 * Gère l'opt-out des notifications email.
 *
 * La désinscription doit rester accessible sans connexion (RGPD : moyen simple
 * de s'opposer). On s'appuie donc sur une URL signée (HMAC dérivé d'APP_SECRET)
 * plutôt que sur l'authentification : le lien est infalsifiable et expire.
 */
class NotificationPreferenceManager
{
    /** Durée de validité d'un lien de désinscription. */
    public const LINK_TTL = '+90 days';

    public const ROUTE_UNSUBSCRIBE = 'notifications_unsubscribe';

    public function __construct(
        private readonly EntityManagerInterface $entityManager,
        private readonly UrlGeneratorInterface $urlGenerator,
        private readonly UriSigner $uriSigner,
    ) {
    }

    /**
     * Construit le lien de désinscription en un clic pour un utilisateur donné.
     */
    public function generateUnsubscribeUrl(User $user): string
    {
        $url = $this->urlGenerator->generate(
            self::ROUTE_UNSUBSCRIBE,
            ['id' => $user->getId()],
            UrlGeneratorInterface::ABSOLUTE_URL,
        );

        return $this->uriSigner->sign($url, new \DateTimeImmutable(self::LINK_TTL));
    }

    /**
     * Vérifie la signature ET la date d'expiration de la requête entrante.
     */
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
