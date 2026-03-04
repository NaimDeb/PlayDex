<?php

namespace App\Controller;

use App\Service\IgdbSearchService;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\Routing\Attribute\Route;
use Symfony\Component\Security\Http\Attribute\IsGranted;

#[Route('/api/igdb')]
class IgdbSearchController extends AbstractController
{
    public function __construct(
        private IgdbSearchService $igdbSearchService,
    ) {}

    #[Route('/search', methods: ['GET'])]
    #[IsGranted('ROLE_USER')]
    public function search(Request $request): JsonResponse
    {
        $query = trim($request->query->getString('q', ''));

        if (strlen($query) < 2) {
            return $this->json(['error' => 'Query must be at least 2 characters.'], 400);
        }

        $results = $this->igdbSearchService->search($query);

        return $this->json($results);
    }

    #[Route('/import/{igdbId}', methods: ['POST'])]
    #[IsGranted('ROLE_USER')]
    public function import(int $igdbId): JsonResponse
    {
        if ($igdbId <= 0) {
            return $this->json(['error' => 'Invalid IGDB ID.'], 400);
        }

        try {
            $game = $this->igdbSearchService->importGame($igdbId);

            return $this->json([
                'id' => $game->getId(),
                'title' => $game->getTitle(),
                'apiId' => $game->getApiId(),
                'imported' => true,
            ], 201);
        } catch (\RuntimeException $e) {
            return $this->json(['error' => $e->getMessage()], 404);
        }
    }
}
