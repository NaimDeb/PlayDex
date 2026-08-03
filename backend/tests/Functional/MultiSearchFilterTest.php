<?php

declare(strict_types=1);

namespace App\Tests\Functional;

use App\Config\PatchNoteImportance;
use App\Entity\Game;
use App\Entity\Modification;
use App\Entity\Patchnote;
use App\Entity\Report;
use App\Entity\User;
use Lexik\Bundle\JWTAuthenticationBundle\Services\JWTTokenManagerInterface;
use Symfony\Bundle\FrameworkBundle\Test\WebTestCase;

/**
 * Filtres du dashboard admin : recherche `q` (OR multi-champs, relations
 * comprises), filtres exacts et tri du plus récent au plus ancien.
 *
 * ⚠️ Nécessite la base de données de test + le keypair JWT (exécuté en CI).
 */
class MultiSearchFilterTest extends WebTestCase
{
    private $client;
    private $entityManager;
    /** Jeton unique par run : la base de test persiste entre deux exécutions. */
    private string $token;
    /** @var object[] tout ce qui est créé doit être détruit (PatchnoteRepositoryTest compte la base entière) */
    private array $created = [];

    protected function setUp(): void
    {
        $this->client = static::createClient();
        $this->entityManager = static::getContainer()->get('doctrine')->getManager();
        $this->token = 'msf' . uniqid();
        $this->created = [];
    }

    private function persistTracked(object $entity): void
    {
        $this->entityManager->persist($entity);
        $this->created[] = $entity;
    }

    private function createUser(string $suffix, array $roles = []): User
    {
        $user = new User();
        $user->setEmail($this->token . $suffix . '@test.com');
        $user->setUsername(substr($this->token . $suffix, 0, 20));
        $user->setRoles($roles);
        $user->setPassword('x');
        $user->setCreatedAtValue();
        $this->persistTracked($user);

        return $user;
    }

    private function createGame(string $title): Game
    {
        $game = new Game();
        $game->setTitle($title);
        $this->persistTracked($game);

        return $game;
    }

    private function createPatchnote(
        string $title,
        Game $game,
        User $author,
        PatchNoteImportance $importance
    ): Patchnote {
        $patchnote = new Patchnote();
        $patchnote->setTitle($title);
        $patchnote->setContent('contenu de test');
        $patchnote->setGame($game);
        $patchnote->setCreatedBy($author);
        $patchnote->setImportance($importance);
        $patchnote->setIsDeleted(false);
        // Pas de HasLifecycleCallbacks sur l'entité : createdAt doit être posé à la main
        $patchnote->setCreatedAtValue();
        $this->persistTracked($patchnote);

        return $patchnote;
    }

    private function tokenFor(User $user): string
    {
        return static::getContainer()->get(JWTTokenManagerInterface::class)->create($user);
    }

    private function getCollection(string $url, ?User $as = null): array
    {
        $server = $as ? ['HTTP_AUTHORIZATION' => 'Bearer ' . $this->tokenFor($as)] : [];
        $this->client->request('GET', $url, [], [], $server);
        $this->assertResponseIsSuccessful();

        return json_decode($this->client->getResponse()->getContent(), true);
    }

    public function testPatchnoteSearchMatchesTitleGameOrAuthor(): void
    {
        $game = $this->createGame($this->token . ' Souls');
        $otherGame = $this->createGame('Autre jeu');
        $author = $this->createUser('auteur');
        $this->createPatchnote($this->token . ' patch 1.0', $game, $author, PatchNoteImportance::Major);
        $this->createPatchnote('Patch sans rapport', $otherGame, $author, PatchNoteImportance::Minor);
        $this->entityManager->flush();

        // Par titre de jeu
        $data = $this->getCollection('/api/patchnotes?q=' . $this->token . '%20Souls');
        $this->assertSame(1, $data['totalItems']);
        $this->assertSame($this->token . ' patch 1.0', $data['member'][0]['title']);

        // Par auteur : les deux patchnotes du même utilisateur
        // (getUsername : le username est tronqué à 20 caractères à la création)
        $data = $this->getCollection('/api/patchnotes?q=' . $author->getUsername());
        $this->assertSame(2, $data['totalItems']);

        // Aucun résultat
        $data = $this->getCollection('/api/patchnotes?q=' . $this->token . 'introuvable');
        $this->assertSame(0, $data['totalItems']);
    }

    public function testPatchnoteImportanceFilterCombinesWithSearch(): void
    {
        $game = $this->createGame($this->token . ' Arena');
        $author = $this->createUser('imp');
        $this->createPatchnote($this->token . ' equilibrage', $game, $author, PatchNoteImportance::Major);
        $this->createPatchnote($this->token . ' correctif', $game, $author, PatchNoteImportance::Hotfix);
        $this->entityManager->flush();

        $data = $this->getCollection('/api/patchnotes?q=' . $this->token . '&importance=hotfix');
        $this->assertSame(1, $data['totalItems']);
        $this->assertSame($this->token . ' correctif', $data['member'][0]['title']);
    }

    public function testPatchnotesOrderedNewestFirst(): void
    {
        $game = $this->createGame($this->token . ' Tri');
        $author = $this->createUser('tri');
        $old = $this->createPatchnote($this->token . ' ancien', $game, $author, PatchNoteImportance::Minor);
        $recent = $this->createPatchnote($this->token . ' recent', $game, $author, PatchNoteImportance::Minor);
        $old->setCreatedAt(new \DateTimeImmutable('2020-01-01'));
        $recent->setCreatedAt(new \DateTimeImmutable('2025-01-01'));
        $this->entityManager->flush();

        $data = $this->getCollection('/api/patchnotes?q=' . $this->token . '%20Tri');
        $this->assertSame(2, $data['totalItems']);
        $this->assertSame($this->token . ' recent', $data['member'][0]['title']);
    }

    public function testModificationSearchByNestedGameTitle(): void
    {
        $admin = $this->createUser('admin', ['ROLE_ADMIN']);
        $game = $this->createGame($this->token . ' Kart');
        $contributor = $this->createUser('contrib');
        $patchnote = $this->createPatchnote('Patch modifie', $game, $contributor, PatchNoteImportance::Minor);

        $modification = new Modification();
        $modification->setUser($contributor);
        $modification->setPatchnote($patchnote);
        $modification->setIsDeleted(false);
        $this->persistTracked($modification);
        $this->entityManager->flush();

        // patchnote.game.title : jointure imbriquée sur deux niveaux
        $data = $this->getCollection('/api/admin/modifications?q=' . $this->token . '%20Kart', $admin);
        $this->assertSame(1, $data['totalItems']);
        $this->assertSame($modification->getId(), $data['member'][0]['id']);
    }

    public function testReportFiltersByReasonAndEntity(): void
    {
        $admin = $this->createUser('radmin', ['ROLE_ADMIN']);
        $reporter = $this->createUser('rapporteur');
        $game = $this->createGame($this->token . ' Signale');
        $patchnote = $this->createPatchnote('Patch signale', $game, $reporter, PatchNoteImportance::Minor);
        $this->entityManager->flush();

        $report = new Report();
        $report->setReportedBy($reporter);
        $report->setReason($this->token . ' contenu offensant');
        $report->setReportableEntity('Patchnote');
        $report->setReportableId($patchnote->getId());
        $report->setReportedAt(new \DateTimeImmutable());
        $report->setIsDeleted(false);
        $this->persistTracked($report);
        $this->entityManager->flush();

        // q sur la raison
        $data = $this->getCollection('/api/reports?q=' . $this->token . '%20contenu', $admin);
        $this->assertSame(1, $data['totalItems']);
        $this->assertSame($report->getId(), $data['member'][0]['id']);

        // Ciblage d'une entité précise (utilisé par getReportsForEntity côté front)
        $data = $this->getCollection(
            '/api/reports?reportableEntity=Patchnote&reportableId=' . $patchnote->getId(),
            $admin
        );
        $this->assertGreaterThanOrEqual(1, $data['totalItems']);
        foreach ($data['member'] as $member) {
            $this->assertStringContainsString('Patchnote', $member['reportableEntity']);
            $this->assertSame($patchnote->getId(), $member['reportableId']);
        }
    }

    protected function tearDown(): void
    {
        // Suppression en ordre inverse de création pour respecter les FK.
        // find() plutôt que remove() direct : chaque requête du client reboote
        // le kernel et détache les entités de l'EntityManager du setUp.
        foreach (array_reverse($this->created) as $entity) {
            $managed = $this->entityManager->find($entity::class, $entity->getId());
            if ($managed) {
                $this->entityManager->remove($managed);
            }
        }
        $this->entityManager->flush();

        parent::tearDown();
        $this->entityManager->close();
    }
}
