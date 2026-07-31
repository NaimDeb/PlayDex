<?php

declare(strict_types=1);

namespace App\Tests\Unit\Service\Notification;

use App\Entity\FollowedGames;
use App\Entity\Game;
use App\Entity\Patchnote;
use App\Entity\User;
use App\Interfaces\Repository\FollowedGamesRepositoryInterface;
use App\Service\Notification\NotificationPreferenceManager;
use App\Service\Notification\PatchnoteNotifier;
use PHPUnit\Framework\TestCase;
use Psr\Log\LoggerInterface;
use Symfony\Bridge\Twig\Mime\TemplatedEmail;
use Symfony\Component\Mailer\Exception\TransportException;
use Symfony\Component\Mailer\MailerInterface;
use Symfony\Component\Mime\RawMessage;

/**
 * Tests du service de notification email des nouvelles patchnotes.
 */
class PatchnoteNotifierTest extends TestCase
{
    private const FROM = 'no-reply@playdex.test';
    private const FRONT = 'https://playdex.test';
    private const UNSUBSCRIBE = 'https://api.playdex.test/api/notifications/unsubscribe/1?_hash=abc';

    public function testNotifiesEveryEligibleFollower(): void
    {
        $game = $this->makeGame(42, 'Hollow Knight');
        $patchnote = $this->makePatchnote(7, $game);

        $followers = [
            $this->makeUser('alice@test.com', 'alice'),
            $this->makeUser('bob@test.com', 'bob'),
        ];

        $mailer = $this->createMock(MailerInterface::class);
        $mailer->expects($this->exactly(2))->method('send');

        $sent = $this->makeNotifier($mailer, $game, $followers)->notifyNewPatchnote($patchnote);

        $this->assertSame(2, $sent);
    }

    public function testSkipsUsersWhoOptedOut(): void
    {
        $game = $this->makeGame(42, 'Hollow Knight');
        $patchnote = $this->makePatchnote(7, $game);

        $optedOut = $this->makeUser('nope@test.com', 'nope')->setEmailNotifications(false);
        $followers = [$optedOut, $this->makeUser('yes@test.com', 'yes')];

        $mailer = $this->createMock(MailerInterface::class);
        $mailer->expects($this->once())
            ->method('send')
            ->with($this->callback(function (RawMessage $message): bool {
                $this->assertInstanceOf(TemplatedEmail::class, $message);
                $this->assertSame('yes@test.com', $message->getTo()[0]->getAddress());

                return true;
            }));

        $this->assertSame(1, $this->makeNotifier($mailer, $game, $followers)->notifyNewPatchnote($patchnote));
    }

    public function testSkipsDeletedUsersAndUsersWithoutEmail(): void
    {
        $game = $this->makeGame(42, 'Hollow Knight');
        $patchnote = $this->makePatchnote(7, $game);

        $deleted = $this->makeUser('ghost@test.com', 'ghost')->setIsDeleted(true);
        $noEmail = (new User())->setUsername('anon');

        $mailer = $this->createMock(MailerInterface::class);
        $mailer->expects($this->never())->method('send');

        $notifier = $this->makeNotifier($mailer, $game, [$deleted, $noEmail]);

        $this->assertSame(0, $notifier->notifyNewPatchnote($patchnote));
    }

    public function testDoesNotNotifyTheAuthorOfThePatchnote(): void
    {
        $game = $this->makeGame(42, 'Hollow Knight');
        $author = $this->makeUser('author@test.com', 'author');
        $patchnote = $this->makePatchnote(7, $game)->setCreatedBy($author);

        $mailer = $this->createMock(MailerInterface::class);
        $mailer->expects($this->never())->method('send');

        $this->assertSame(0, $this->makeNotifier($mailer, $game, [$author])->notifyNewPatchnote($patchnote));
    }

    public function testSkipsSoftDeletedPatchnoteWithoutQueryingFollowers(): void
    {
        $game = $this->makeGame(42, 'Hollow Knight');
        $patchnote = $this->makePatchnote(7, $game)->setIsDeleted(true);

        $mailer = $this->createMock(MailerInterface::class);
        $mailer->expects($this->never())->method('send');

        $repository = $this->createMock(FollowedGamesRepositoryInterface::class);
        $repository->expects($this->never())->method('findByGame');

        $notifier = new PatchnoteNotifier(
            $mailer,
            $repository,
            $this->createMock(LoggerInterface::class),
            $this->makePreferences(),
            self::FROM,
            self::FRONT,
        );

        $this->assertSame(0, $notifier->notifyNewPatchnote($patchnote));
    }

    public function testTransportFailureIsLoggedAndDoesNotStopTheOtherRecipients(): void
    {
        $game = $this->makeGame(42, 'Hollow Knight');
        $patchnote = $this->makePatchnote(7, $game);
        $followers = [
            $this->makeUser('broken@test.com', 'broken'),
            $this->makeUser('ok@test.com', 'ok'),
        ];

        $mailer = $this->createMock(MailerInterface::class);
        $mailer->expects($this->exactly(2))
            ->method('send')
            ->willReturnCallback(function (RawMessage $message): void {
                if ($message->getTo()[0]->getAddress() === 'broken@test.com') {
                    throw new TransportException('SMTP down');
                }
            });

        $logger = $this->createMock(LoggerInterface::class);
        $logger->expects($this->once())->method('error');

        $repository = $this->createMock(FollowedGamesRepositoryInterface::class);
        $repository->method('findByGame')->willReturn($this->makeFollows($game, $followers));

        $notifier = new PatchnoteNotifier($mailer, $repository, $logger, $this->makePreferences(), self::FROM, self::FRONT);

        // 1 seul envoi réussi, mais la boucle est allée au bout.
        $this->assertSame(1, $notifier->notifyNewPatchnote($patchnote));
    }

    public function testEmailContentCarriesTheGameAndDeepLink(): void
    {
        $game = $this->makeGame(42, 'Hollow Knight');
        $patchnote = $this->makePatchnote(7, $game)->setTitle('Silksong Update');

        $captured = null;
        $mailer = $this->createMock(MailerInterface::class);
        $mailer->method('send')->willReturnCallback(function (RawMessage $message) use (&$captured): void {
            $captured = $message;
        });

        $notifier = $this->makeNotifier($mailer, $game, [$this->makeUser('alice@test.com', 'alice')]);
        $notifier->notifyNewPatchnote($patchnote);

        $this->assertInstanceOf(TemplatedEmail::class, $captured);
        $this->assertSame('Hollow Knight — nouvelle mise à jour', $captured->getSubject());
        $this->assertSame(self::FROM, $captured->getFrom()[0]->getAddress());
        $this->assertSame('emails/patchnote_published.html.twig', $captured->getHtmlTemplate());

        $context = $captured->getContext();
        $this->assertSame('Hollow Knight', $context['gameTitle']);
        $this->assertSame('Silksong Update', $context['patchnoteTitle']);
        $this->assertSame(self::FRONT . '/article/42/patchnote/7', $context['patchnoteUrl']);
        $this->assertSame(self::FRONT . '/profile/edit', $context['preferencesUrl']);
    }

    public function testEmailCarriesTheOneClickUnsubscribeHeaders(): void
    {
        $game = $this->makeGame(42, 'Hollow Knight');
        $patchnote = $this->makePatchnote(7, $game);

        $captured = null;
        $mailer = $this->createMock(MailerInterface::class);
        $mailer->method('send')->willReturnCallback(function (RawMessage $message) use (&$captured): void {
            $captured = $message;
        });

        $notifier = $this->makeNotifier($mailer, $game, [$this->makeUser('alice@test.com', 'alice')]);
        $notifier->notifyNewPatchnote($patchnote);

        $headers = $captured->getHeaders();

        // RFC 8058 : le lien doit être entre chevrons, et le POST one-click annoncé.
        $this->assertSame('<' . self::UNSUBSCRIBE . '>', $headers->get('List-Unsubscribe')?->getBodyAsString());
        $this->assertSame('List-Unsubscribe=One-Click', $headers->get('List-Unsubscribe-Post')?->getBodyAsString());
        $this->assertSame(self::UNSUBSCRIBE, $captured->getContext()['unsubscribeUrl']);
    }

    public function testReturnsZeroWhenThePatchnoteHasNoGame(): void
    {
        $mailer = $this->createMock(MailerInterface::class);
        $mailer->expects($this->never())->method('send');

        $notifier = new PatchnoteNotifier(
            $mailer,
            $this->createMock(FollowedGamesRepositoryInterface::class),
            $this->createMock(LoggerInterface::class),
            $this->makePreferences(),
            self::FROM,
            self::FRONT,
        );

        $this->assertSame(0, $notifier->notifyNewPatchnote(new Patchnote()));
    }

    // --- helpers ---------------------------------------------------------

    /**
     * @param User[] $followers
     */
    private function makeNotifier(MailerInterface $mailer, Game $game, array $followers): PatchnoteNotifier
    {
        $repository = $this->createMock(FollowedGamesRepositoryInterface::class);
        $repository->expects($this->once())
            ->method('findByGame')
            ->with($game)
            ->willReturn($this->makeFollows($game, $followers));

        return new PatchnoteNotifier(
            $mailer,
            $repository,
            $this->createMock(LoggerInterface::class),
            $this->makePreferences(),
            self::FROM,
            self::FRONT,
        );
    }

    private function makePreferences(): NotificationPreferenceManager
    {
        $preferences = $this->createMock(NotificationPreferenceManager::class);
        $preferences->method('generateUnsubscribeUrl')->willReturn(self::UNSUBSCRIBE);

        return $preferences;
    }

    /**
     * @param User[] $followers
     *
     * @return FollowedGames[]
     */
    private function makeFollows(Game $game, array $followers): array
    {
        return array_map(
            static fn (User $user) => (new FollowedGames())->setUser($user)->setGame($game),
            $followers
        );
    }

    private function makeUser(string $email, string $username): User
    {
        return (new User())->setEmail($email)->setUsername($username);
    }

    private function makeGame(int $id, string $title): Game
    {
        $game = (new Game())->setTitle($title);
        $this->setId($game, $id);

        return $game;
    }

    private function makePatchnote(int $id, Game $game): Patchnote
    {
        $patchnote = (new Patchnote())->setGame($game)->setTitle('Patch 1.0');
        $this->setId($patchnote, $id);

        return $patchnote;
    }

    /**
     * Les entités Doctrine n'exposent pas de setter d'id (généré en base).
     */
    private function setId(object $entity, int $id): void
    {
        $property = new \ReflectionProperty($entity::class, 'id');
        $property->setValue($entity, $id);
    }
}
