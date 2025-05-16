<?php
namespace App\State\Provider;

use ApiPlatform\Metadata\Operation;
use ApiPlatform\State\ProviderInterface;
use Doctrine\ORM\EntityManagerInterface;
use App\Dto\LatestReleaseItem;
use App\Entity\Extension;
use App\Entity\Game;

class LatestReleasesProvider implements ProviderInterface
{
    public function __construct(private EntityManagerInterface $em) {}

    public function provide(Operation $operation, array $uriVariables = [], array $context = []): array
    {
        // Récupère les derniers jeux et extensions, merge et trie par releasedAt
        $games = $this->em->getRepository(Game::class)->findBy([], ['releasedAt' => 'DESC'], 10);
        $extensions = $this->em->getRepository(Extension::class)->findBy([], ['releasedAt' => 'DESC'], 10);

        $items = [];
        foreach ($games as $game) {
            $item = new LatestReleaseItem();
            $item->type = 'game';
            $item->id = $game->getId();
            $item->title = $game->getTitle();
            $item->releasedAt = $game->getReleasedAt();
            $item->lastUpdatedAt = $game->getLastUpdatedAt();
            $items[] = $item;
        }
        foreach ($extensions as $ext) {
            $item = new LatestReleaseItem();
            $item->type = 'extension';
            $item->id = $ext->getId();
            $item->title = $ext->getTitle();
            $item->releasedAt = $ext->getReleasedAt();
            $item->lastUpdatedAt = $ext->getLastUpdatedAt();
            $items[] = $item;
        }

        // Trie global par releasedAt desc
        usort($items, fn($a, $b) => $b->releasedAt <=> $a->releasedAt);

        return array_slice($items, 0, 10);
    }
}