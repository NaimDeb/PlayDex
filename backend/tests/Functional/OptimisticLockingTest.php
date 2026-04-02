<?php

namespace App\Tests\Functional;

use App\Entity\User;
use App\Entity\Game;
use App\Entity\Patchnote;
use Symfony\Bundle\FrameworkBundle\Test\WebTestCase;
use Symfony\Component\PasswordHasher\Hasher\UserPasswordHasherInterface;

class OptimisticLockingTest extends WebTestCase
{
    private const TEST_EMAIL = 'optimistic-lock-test@test.com';

    private $client;
    private $entityManager;
    private ?int $testGameId = null;

    protected function setUp(): void
    {
        $this->client = static::createClient();
        $this->entityManager = static::getContainer()->get('doctrine')->getManager();

        // Clean up leftover data from previous failed runs
        $this->cleanupTestData();

        // Create test game
        $game = new Game();
        $game->setTitle('OptLock Test Game');
        $this->entityManager->persist($game);
        $this->entityManager->flush();
        $this->testGameId = $game->getId();

        // Create test user
        $passwordHasher = static::getContainer()->get(UserPasswordHasherInterface::class);
        $user = new User();
        $user->setEmail(self::TEST_EMAIL);
        $user->setUsername('optlockuser');
        $user->setCreatedAtValue();
        $user->setRoles(['ROLE_ADMIN']);
        $user->setPassword($passwordHasher->hashPassword($user, 'testpassword'));
        $this->entityManager->persist($user);
        $this->entityManager->flush();
    }

    private function cleanupTestData(): void
    {
        $conn = $this->entityManager->getConnection();

        // Delete modifications → patchnotes → user → game (respecting FK order)
        $conn->executeStatement(
            'DELETE m FROM modification m
             INNER JOIN patchnote p ON m.patchnote_id = p.id
             INNER JOIN user u ON p.created_by_id = u.id
             WHERE u.email = ?',
            [self::TEST_EMAIL]
        );

        $conn->executeStatement(
            'DELETE p FROM patchnote p INNER JOIN user u ON p.created_by_id = u.id WHERE u.email = ?',
            [self::TEST_EMAIL]
        );

        $conn->executeStatement('DELETE FROM user WHERE email = ?', [self::TEST_EMAIL]);

        $conn->executeStatement("DELETE FROM game WHERE title = 'OptLock Test Game'");
    }

    private function getAuthToken(): ?string
    {
        $this->client->request('POST', '/api/login_check', [], [], [
            'CONTENT_TYPE' => 'application/json',
        ], json_encode([
            'email' => self::TEST_EMAIL,
            'password' => 'testpassword',
        ]));

        $response = json_decode($this->client->getResponse()->getContent(), true);

        return $response['token'] ?? null;
    }

    public function testPatchnoteUpdateWithCorrectVersion(): void
    {
        $token = $this->getAuthToken();

        if ($token === null) {
            $this->markTestSkipped('Could not obtain auth token — login endpoint may not be configured.');
        }

        $gameIri = '/api/games/' . $this->testGameId;

        $this->client->request('POST', '/api/patchnotes', [], [], [
            'CONTENT_TYPE' => 'application/ld+json',
            'HTTP_AUTHORIZATION' => 'Bearer ' . $token,
        ], json_encode([
            'title' => 'Test Patchnote',
            'content' => 'Initial content',
            'releasedAt' => '2024-01-01',
            'importance' => 'minor',
            'game' => $gameIri,
            'smallDescription' => 'Test',
        ]));

        $this->assertResponseIsSuccessful();
        $response = json_decode($this->client->getResponse()->getContent(), true);
        $patchnoteId = $response['id'];
        $version = $response['version'] ?? 1;

        $this->client->request('PATCH', '/api/patchnotes/' . $patchnoteId, [], [], [
            'CONTENT_TYPE' => 'application/merge-patch+json',
            'HTTP_AUTHORIZATION' => 'Bearer ' . $token,
        ], json_encode([
            'content' => 'Updated content',
            'version' => $version,
        ]));

        $this->assertResponseIsSuccessful();

        // Processor returns void, so fetch the patchnote to verify the version was incremented
        $this->client->request('GET', '/api/patchnotes/' . $patchnoteId);
        $this->assertResponseIsSuccessful();
        $updatedResponse = json_decode($this->client->getResponse()->getContent(), true);
        $this->assertEquals($version + 1, $updatedResponse['version']);
    }

    public function testPatchnoteUpdateWithIncorrectVersion(): void
    {
        $token = $this->getAuthToken();

        if ($token === null) {
            $this->markTestSkipped('Could not obtain auth token — login endpoint may not be configured.');
        }

        $gameIri = '/api/games/' . $this->testGameId;

        $this->client->request('POST', '/api/patchnotes', [], [], [
            'CONTENT_TYPE' => 'application/ld+json',
            'HTTP_AUTHORIZATION' => 'Bearer ' . $token,
        ], json_encode([
            'title' => 'Test Patchnote',
            'content' => 'Initial content',
            'releasedAt' => '2024-01-01',
            'importance' => 'minor',
            'game' => $gameIri,
            'smallDescription' => 'Test',
        ]));

        $this->assertResponseIsSuccessful();
        $response = json_decode($this->client->getResponse()->getContent(), true);
        $patchnoteId = $response['id'];

        $this->client->request('PATCH', '/api/patchnotes/' . $patchnoteId, [], [], [
            'CONTENT_TYPE' => 'application/merge-patch+json',
            'HTTP_AUTHORIZATION' => 'Bearer ' . $token,
        ], json_encode([
            'content' => 'Updated content',
            'version' => 999,
        ]));

        $this->assertResponseStatusCodeSame(409);
    }

    protected function tearDown(): void
    {
        $this->cleanupTestData();
        $this->entityManager->close();
        static::ensureKernelShutdown();
        parent::tearDown();
    }
}
