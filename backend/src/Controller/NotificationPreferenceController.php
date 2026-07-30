<?php

declare(strict_types=1);

namespace App\Controller;

use App\Entity\User;
use App\Repository\UserRepository;
use App\Service\Notification\NotificationPreferenceManager;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\DependencyInjection\Attribute\Autowire;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\RedirectResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\Routing\Attribute\Route;
use Symfony\Component\Security\Http\Attribute\IsGranted;

class NotificationPreferenceController extends AbstractController
{
    public function __construct(
        private readonly NotificationPreferenceManager $preferences,
        private readonly UserRepository $userRepository,
    ) {
    }

    /**
     * GET : lien cliqué dans l'email. POST : bouton natif Gmail/Yahoo (RFC 8058).
     * La légitimité vient de la signature de l'URL, pas d'une session.
     */
    #[Route(
        '/api/notifications/unsubscribe/{id}',
        name: NotificationPreferenceManager::ROUTE_UNSUBSCRIBE,
        requirements: ['id' => '\d+'],
        methods: ['GET', 'POST'],
    )]
    public function unsubscribe(
        int $id,
        Request $request,
        #[Autowire(param: 'FRONTEND_URL')]
        string $frontendUrl,
    ): Response {
        if (!$this->preferences->isValidUnsubscribeRequest($request)) {
            // Lien falsifié ou expiré : on ne dit pas lequel des deux.
            return $this->unsubscribeResponse($request, $frontendUrl, false);
        }

        $user = $this->userRepository->find($id);

        if ($user instanceof User && !$user->isDeleted()) {
            $this->preferences->setEmailNotifications($user, false);
        }

        // Réponse identique que l'utilisateur existe ou non : pas d'énumération de comptes.
        return $this->unsubscribeResponse($request, $frontendUrl, true);
    }

    #[Route('/api/me/notifications', name: 'notifications_preferences_update', methods: ['PATCH'])]
    #[IsGranted('ROLE_USER')]
    public function updatePreferences(Request $request): JsonResponse
    {
        $payload = json_decode($request->getContent(), true);

        if (!is_array($payload) || !array_key_exists('emailNotifications', $payload)) {
            return $this->json(['error' => 'Le champ "emailNotifications" est requis.'], Response::HTTP_BAD_REQUEST);
        }

        $enabled = filter_var($payload['emailNotifications'], FILTER_VALIDATE_BOOL, FILTER_NULL_ON_FAILURE);

        if ($enabled === null) {
            return $this->json(['error' => 'Le champ "emailNotifications" doit être un booléen.'], Response::HTTP_BAD_REQUEST);
        }

        /** @var User $user */
        $user = $this->getUser();
        $this->preferences->setEmailNotifications($user, $enabled);

        return $this->json(['emailNotifications' => $user->isEmailNotifications()]);
    }

    /** Le one-click POST attend un 2xx sans corps ; le GET vient d'un navigateur, donc redirection. */
    private function unsubscribeResponse(Request $request, string $frontendUrl, bool $success): Response
    {
        if ($request->isMethod('POST')) {
            return new Response('', $success ? Response::HTTP_NO_CONTENT : Response::HTTP_FORBIDDEN);
        }

        return new RedirectResponse(sprintf(
            '%s/notifications/unsubscribe?status=%s',
            rtrim($frontendUrl, '/'),
            $success ? 'success' : 'invalid',
        ));
    }
}
