<?php

namespace App\Tests\Functional;

use App\Entity\Game;
use App\Entity\Patchnote;
use App\Entity\User;
use Lexik\Bundle\JWTAuthenticationBundle\Services\JWTTokenManagerInterface;
use Symfony\Bundle\FrameworkBundle\Test\WebTestCase;

class OptimisticLockingTest extends WebTestCase
{
    private $client;
    private $entityManager;
    private Game $game;
    private string $token;

    protected function setUp(): void
    {
        $this->client = static::createClient();
        $this->entityManager = static::getContainer()->get('doctrine')->getManager();

        // Create a game to attach the patchnote to
        $this->game = new Game();
        $this->game->setTitle('Optimistic Locking Test Game');
        $this->entityManager->persist($this->game);

        // Create a user and generate a JWT token for authenticated requests
        $user = new User();
        $user->setEmail('locking@test.com');
        $user->setUsername('lockinguser');
        $user->setPassword('password');
        $user->setCreatedAtValue();
        $this->entityManager->persist($user);

        $this->entityManager->flush();

        $jwtManager = static::getContainer()->get(JWTTokenManagerInterface::class);
        $this->token = $jwtManager->create($user);
    }

    private function createPatchnote(): array
    {
        $patchnoteData = [
            'title' => 'Test Patchnote',
            'content' => 'Initial content',
            'releasedAt' => '2024-01-01',
            'importance' => 'minor',
            'game' => '/api/games/' . $this->game->getId(),
            'smallDescription' => 'Test',
        ];

        $this->client->request('POST', '/api/patchnotes', [], [], [
            'CONTENT_TYPE' => 'application/ld+json',
            'HTTP_AUTHORIZATION' => 'Bearer ' . $this->token,
        ], json_encode($patchnoteData));

        $this->assertResponseIsSuccessful();

        return json_decode($this->client->getResponse()->getContent(), true);
    }

    public function testPatchnoteUpdateWithCorrectVersion(): void
    {
        $response = $this->createPatchnote();
        $patchnoteId = $response['id'];
        $version = $response['version'];

        // Update with correct version
        $this->client->request('PATCH', '/api/patchnotes/' . $patchnoteId, [], [], [
            'CONTENT_TYPE' => 'application/merge-patch+json',
            'HTTP_AUTHORIZATION' => 'Bearer ' . $this->token,
        ], json_encode([
            'content' => 'Updated content',
            'version' => $version,
        ]));

        $this->assertResponseIsSuccessful();

        // The patch processor returns void, so the patched version is read back via GET
        $this->client->request('GET', '/api/patchnotes/' . $patchnoteId);
        $this->assertResponseIsSuccessful();
        $updatedResponse = json_decode($this->client->getResponse()->getContent(), true);
        $this->assertEquals($version + 1, $updatedResponse['version']);
        $this->assertEquals('Updated content', $updatedResponse['content']);
    }

    public function testPatchnoteUpdateWithIncorrectVersion(): void
    {
        $response = $this->createPatchnote();
        $patchnoteId = $response['id'];

        // Update with incorrect version
        $this->client->request('PATCH', '/api/patchnotes/' . $patchnoteId, [], [], [
            'CONTENT_TYPE' => 'application/merge-patch+json',
            'HTTP_AUTHORIZATION' => 'Bearer ' . $this->token,
        ], json_encode([
            'content' => 'Updated content',
            'version' => 999,
        ]));

        $this->assertResponseStatusCodeSame(409);
    }

    protected function tearDown(): void
    {
        $em = $this->entityManager;

        // Remove patchnotes (and their modifications via orphanRemoval) created by the test user
        $user = $em->getRepository(User::class)->findOneBy(['email' => 'locking@test.com']);
        if ($user) {
            foreach ($em->getRepository(Patchnote::class)->findBy(['createdBy' => $user]) as $patchnote) {
                $em->remove($patchnote);
            }
            $em->flush();
            $em->remove($user);
        }

        if ($this->game->getId()) {
            $game = $em->getRepository(Game::class)->find($this->game->getId());
            if ($game) {
                $em->remove($game);
            }
        }

        $em->flush();

        parent::tearDown();
    }
}
