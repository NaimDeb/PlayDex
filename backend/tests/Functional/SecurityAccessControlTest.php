<?php

declare(strict_types=1);

namespace App\Tests\Functional;

use App\Entity\User;
use Lexik\Bundle\JWTAuthenticationBundle\Services\JWTTokenManagerInterface;
use Symfony\Bundle\FrameworkBundle\Test\WebTestCase;
use Symfony\Component\PasswordHasher\Hasher\UserPasswordHasherInterface;

/**
 * Tests de sécurité métier (contrôle d'accès) de bout en bout.
 *
 * Couvre : 401 sans authentification, 403 pour un rôle insuffisant,
 * 403 quand un utilisateur agit sur le compte d'un autre, et le blocage
 * d'un compte banni au login.
 *
 * ⚠️ Nécessite la base de données de test + le keypair JWT (exécuté en CI).
 */
class SecurityAccessControlTest extends WebTestCase
{
    private $client;
    private $entityManager;
    /** @var User[] */
    private array $createdUsers = [];

    protected function setUp(): void
    {
        $this->client = static::createClient();
        $this->entityManager = static::getContainer()->get('doctrine')->getManager();
    }

    private function createUser(string $email, array $roles = [], ?string $plainPassword = null): User
    {
        $user = new User();
        $user->setEmail($email);
        $user->setUsername(substr('u_' . md5($email), 0, 20));
        $user->setRoles($roles);
        $user->setCreatedAtValue();

        if ($plainPassword !== null) {
            $hasher = static::getContainer()->get(UserPasswordHasherInterface::class);
            $user->setPassword($hasher->hashPassword($user, $plainPassword));
        } else {
            $user->setPassword('x');
        }

        $this->entityManager->persist($user);
        $this->entityManager->flush();
        $this->createdUsers[] = $user;

        return $user;
    }

    private function tokenFor(User $user): string
    {
        return static::getContainer()->get(JWTTokenManagerInterface::class)->create($user);
    }

    public function testUnauthenticatedRequestIsRejected(): void
    {
        $this->client->request('GET', '/api/me');
        $this->assertResponseStatusCodeSame(401);
    }

    public function testNonAdminCannotAccessAdminEndpoint(): void
    {
        $user = $this->createUser('secu_user@test.com');
        $this->client->request('GET', '/api/admin/modifications', [], [], [
            'HTTP_AUTHORIZATION' => 'Bearer ' . $this->tokenFor($user),
        ]);
        $this->assertResponseStatusCodeSame(403);
    }

    public function testAdminCanAccessAdminEndpoint(): void
    {
        $admin = $this->createUser('secu_admin@test.com', ['ROLE_ADMIN']);
        $this->client->request('GET', '/api/admin/modifications', [], [], [
            'HTTP_AUTHORIZATION' => 'Bearer ' . $this->tokenFor($admin),
        ]);
        $this->assertResponseIsSuccessful();
    }

    public function testUserCannotModifyAnotherUser(): void
    {
        $alice = $this->createUser('secu_alice@test.com');
        $bob = $this->createUser('secu_bob@test.com');

        // Bob tente de modifier le compte d'Alice -> interdit (object == user).
        $this->client->request('PATCH', '/api/users/' . $alice->getId(), [], [], [
            'CONTENT_TYPE' => 'application/merge-patch+json',
            'HTTP_AUTHORIZATION' => 'Bearer ' . $this->tokenFor($bob),
        ], json_encode(['username' => 'pirate123']));

        $this->assertResponseStatusCodeSame(403);
    }

    public function testBannedUserCannotLogin(): void
    {
        $banned = $this->createUser('secu_banned@test.com', [], 'Secret#123');
        $banned->setIsBanned(true);
        $banned->setBanReason('Multirécidive');
        $banned->setBannedUntil(null); // ban permanent
        $this->entityManager->flush();

        $this->client->request('POST', '/api/login_check', [], [], [
            'CONTENT_TYPE' => 'application/json',
        ], json_encode(['email' => 'secu_banned@test.com', 'password' => 'Secret#123']));

        // Le UserChecker rejette le compte banni -> 401.
        $this->assertResponseStatusCodeSame(401);
    }

    protected function tearDown(): void
    {
        $em = $this->entityManager;
        foreach ($this->createdUsers as $user) {
            $managed = $em->getRepository(User::class)->find($user->getId());
            if ($managed) {
                $em->remove($managed);
            }
        }
        $em->flush();
        parent::tearDown();
    }
}
