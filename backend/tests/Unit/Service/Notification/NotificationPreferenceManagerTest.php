<?php

declare(strict_types=1);

namespace App\Tests\Unit\Service\Notification;

use App\Entity\User;
use App\Service\Notification\NotificationPreferenceManager;
use Doctrine\ORM\EntityManagerInterface;
use PHPUnit\Framework\TestCase;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\UriSigner;
use Symfony\Component\Routing\Generator\UrlGeneratorInterface;

/**
 * Tests de l'opt-out et de la signature des liens de désinscription.
 *
 * On utilise un vrai UriSigner (et non un mock) : c'est justement la robustesse
 * de la signature que l'on veut vérifier.
 */
class NotificationPreferenceManagerTest extends TestCase
{
    private const BASE_URL = 'https://api.playdex.test/api/notifications/unsubscribe/1';

    public function testGeneratedUrlIsSignedAndAccepted(): void
    {
        $signer = new UriSigner('secret-de-test');
        $manager = $this->makeManager($signer);

        $url = $manager->generateUnsubscribeUrl($this->makeUser(1));

        $this->assertStringStartsWith(self::BASE_URL . '?', $url);
        $this->assertTrue($manager->isValidUnsubscribeRequest(Request::create($url)));
    }

    public function testTamperedUserIdIsRejected(): void
    {
        $signer = new UriSigner('secret-de-test');
        $manager = $this->makeManager($signer);

        $url = $manager->generateUnsubscribeUrl($this->makeUser(1));
        // On tente de désinscrire quelqu'un d'autre en changeant l'id.
        $forged = str_replace('/unsubscribe/1?', '/unsubscribe/2?', $url);

        $this->assertFalse($manager->isValidUnsubscribeRequest(Request::create($forged)));
    }

    public function testUrlSignedWithAnotherSecretIsRejected(): void
    {
        $url = $this->makeManager(new UriSigner('secret-de-test'))
            ->generateUnsubscribeUrl($this->makeUser(1));

        $otherApp = $this->makeManager(new UriSigner('un-autre-secret'));

        $this->assertFalse($otherApp->isValidUnsubscribeRequest(Request::create($url)));
    }

    public function testGeneratedUrlCarriesAnExpiration(): void
    {
        $url = $this->makeManager(new UriSigner('secret-de-test'))
            ->generateUnsubscribeUrl($this->makeUser(1));

        parse_str((string) parse_url($url, PHP_URL_QUERY), $query);

        $this->assertArrayHasKey('_expiration', $query);
        $this->assertGreaterThan(time(), (int) $query['_expiration']);
    }

    public function testDisablingNotificationsPersistsTheChange(): void
    {
        $user = $this->makeUser(1);

        $em = $this->createMock(EntityManagerInterface::class);
        $em->expects($this->once())->method('flush');

        $this->makeManager(new UriSigner('secret-de-test'), $em)->setEmailNotifications($user, false);

        $this->assertFalse($user->isEmailNotifications());
    }

    public function testSettingTheSameValueDoesNotHitTheDatabase(): void
    {
        $user = $this->makeUser(1); // emailNotifications = true par défaut

        $em = $this->createMock(EntityManagerInterface::class);
        $em->expects($this->never())->method('flush');

        $this->makeManager(new UriSigner('secret-de-test'), $em)->setEmailNotifications($user, true);

        $this->assertTrue($user->isEmailNotifications());
    }

    // --- helpers ---------------------------------------------------------

    private function makeManager(UriSigner $signer, ?EntityManagerInterface $em = null): NotificationPreferenceManager
    {
        $urlGenerator = $this->createMock(UrlGeneratorInterface::class);
        $urlGenerator->method('generate')->willReturnCallback(
            static fn (string $route, array $params) => sprintf(
                'https://api.playdex.test/api/notifications/unsubscribe/%d',
                $params['id'],
            )
        );

        return new NotificationPreferenceManager(
            $em ?? $this->createMock(EntityManagerInterface::class),
            $urlGenerator,
            $signer,
        );
    }

    private function makeUser(int $id): User
    {
        $user = (new User())->setEmail('user@test.com')->setUsername('user');

        $property = new \ReflectionProperty(User::class, 'id');
        $property->setValue($user, $id);

        return $user;
    }
}
