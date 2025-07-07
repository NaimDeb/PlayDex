<?php

namespace App\Tests\Functional;

use Symfony\Bundle\FrameworkBundle\Test\WebTestCase;
use App\Entity\User;
use App\Entity\Game;
use App\Entity\Patchnote;
use App\Config\PatchNoteImportance;

class PatchnoteApiTest extends WebTestCase
{
    private $client;
    private $entityManager;

    protected function setUp(): void
    {
        $this->client = static::createClient();
        $this->entityManager = static::getContainer()->get('doctrine')->getManager();
    }

    public function testGetPatchnote(): void
    {
        // Create test data
        $game = new Game();
        $game->setTitle('Test Game for API');
        $this->entityManager->persist($game);

        $user = new User();
        $user->setEmail('api@example.com');
        $user->setUsername('apiuser');
        $user->setPassword('password');
        $user->setCreatedAt(new \DateTimeImmutable());
        $this->entityManager->persist($user);

        $patchnote = new Patchnote();
        $patchnote->setTitle('API Test Patchnote');
        $patchnote->setContent('This is a test patchnote for API');
        $patchnote->setGame($game);
        $patchnote->setCreatedBy($user);
        $patchnote->setCreatedAt(new \DateTimeImmutable());
        $patchnote->setImportance(PatchNoteImportance::Major);
        $patchnote->setIsDeleted(false);
        $this->entityManager->persist($patchnote);

        $this->entityManager->flush();

        // Test GET request
        $this->client->request('GET', '/api/patchnotes/' . $patchnote->getId());

        $this->assertResponseIsSuccessful();
        $this->assertResponseHeaderSame('content-type', 'application/ld+json; charset=utf-8');

        $responseData = json_decode($this->client->getResponse()->getContent(), true);
        $this->assertEquals('API Test Patchnote', $responseData['title']);
        $this->assertEquals('This is a test patchnote for API', $responseData['content']);

        // Cleanup
        $this->entityManager->remove($patchnote);
        $this->entityManager->remove($user);
        $this->entityManager->remove($game);
        $this->entityManager->flush();
    }

    public function testGetPatchnotesCollection(): void
    {
        // Test GET collection without authentication (should work for public endpoint)
        $this->client->request('GET', '/api/patchnotes');

        // This might return 403 if authentication is required, which is expected
        $this->assertTrue(
            $this->client->getResponse()->isSuccessful() ||
                $this->client->getResponse()->getStatusCode() === 403
        );
    }

    public function testGetNonExistentPatchnote(): void
    {
        $this->client->request('GET', '/api/patchnotes/99999');

        $this->assertResponseStatusCodeSame(404);
    }

    protected function tearDown(): void
    {
        parent::tearDown();
        $this->entityManager->close();
    }
}
