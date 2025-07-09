<?php

namespace App\Tests\Functional;

use Symfony\Bundle\FrameworkBundle\Test\WebTestCase;
use App\Entity\Game;

class GameApiTest extends WebTestCase
{
    private $client;
    private $entityManager;

    protected function setUp(): void
    {
        $this->client = static::createClient();
        $this->entityManager = static::getContainer()->get('doctrine')->getManager();
    }

    public function testGetGame(): void
    {
        // Create test data
        $game = new Game();
        $game->setTitle('API Test Game');
        $game->setDescription('This is a test game for API');
        $game->setImageUrl('https://example.com/test-image.jpg');
        $game->setReleasedAt(new \DateTimeImmutable('2023-01-01'));
        $this->entityManager->persist($game);
        $this->entityManager->flush();

        // Test GET request
        $this->client->request('GET', '/api/games/' . $game->getId());

        $this->assertResponseIsSuccessful();
        $this->assertResponseHeaderSame('content-type', 'application/ld+json; charset=utf-8');

        $responseData = json_decode($this->client->getResponse()->getContent(), true);
        $this->assertEquals('API Test Game', $responseData['title']);
        $this->assertEquals('This is a test game for API', $responseData['description']);

        // Cleanup
        $this->entityManager->remove($game);
        $this->entityManager->flush();
    }

    public function testGetGamesCollection(): void
    {
        // Test GET collection
        $this->client->request('GET', '/api/games');

        $this->assertResponseIsSuccessful();
        $this->assertResponseHeaderSame('content-type', 'application/ld+json; charset=utf-8');

        $responseData = json_decode($this->client->getResponse()->getContent(), true);
        $this->assertArrayHasKey('hydra:member', $responseData);
        $this->assertArrayHasKey('hydra:totalItems', $responseData);
    }

    public function testGetGamePatchnotes(): void
    {
        // Create test game
        $game = new Game();
        $game->setTitle('Game with Patchnotes');
        $this->entityManager->persist($game);
        $this->entityManager->flush();

        // Test GET game patchnotes
        $this->client->request('GET', '/api/games/' . $game->getId() . '/patchnotes');

        $this->assertResponseIsSuccessful();
        $responseData = json_decode($this->client->getResponse()->getContent(), true);
        $this->assertArrayHasKey('hydra:member', $responseData);

        // Cleanup
        $this->entityManager->remove($game);
        $this->entityManager->flush();
    }

    public function testGetGameExtensions(): void
    {
        // Create test game
        $game = new Game();
        $game->setTitle('Game with Extensions');
        $this->entityManager->persist($game);
        $this->entityManager->flush();

        // Test GET game extensions
        $this->client->request('GET', '/api/games/' . $game->getId() . '/extensions');

        $this->assertResponseIsSuccessful();
        $responseData = json_decode($this->client->getResponse()->getContent(), true);
        $this->assertArrayHasKey('hydra:member', $responseData);

        // Cleanup
        $this->entityManager->remove($game);
        $this->entityManager->flush();
    }

    public function testGetNonExistentGame(): void
    {
        $this->client->request('GET', '/api/games/99999');

        $this->assertResponseStatusCodeSame(404);
    }


    protected function tearDown(): void
    {
        parent::tearDown();
        $this->entityManager->close();
    }
}
