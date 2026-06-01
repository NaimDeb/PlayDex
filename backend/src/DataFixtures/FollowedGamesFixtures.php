<?php

namespace App\DataFixtures;

use App\Entity\FollowedGames;
use App\Entity\Game;
use App\Entity\User;
use Doctrine\Bundle\FixturesBundle\Fixture;
use Doctrine\Common\DataFixtures\DependentFixtureInterface;
use Doctrine\Persistence\ObjectManager;

class FollowedGamesFixtures extends Fixture implements DependentFixtureInterface
{
    public function load(ObjectManager $manager): void
    {
        // user-1 follows Overwatch 2 (checked recently) and Baldur's Gate 3 (never checked)
        $fg1 = $this->createFollowedGame(
            $this->getReference('user-1', User::class),
            $this->getReference('game-overwatch2', Game::class),
            new \DateTimeImmutable('2025-07-09 12:00:00')
        );
        $manager->persist($fg1);

        $fg2 = $this->createFollowedGame(
            $this->getReference('user-1', User::class),
            $this->getReference('game-bg3', Game::class),
            null
        );
        $manager->persist($fg2);

        // user-2 follows Witcher 3 (checked a while ago)
        $fg3 = $this->createFollowedGame(
            $this->getReference('user-2', User::class),
            $this->getReference('game-witcher3', Game::class),
            new \DateTimeImmutable('2025-06-01 08:00:00')
        );
        $manager->persist($fg3);

        // user-3 follows League of Legends and CS2
        $fg4 = $this->createFollowedGame(
            $this->getReference('user-3', User::class),
            $this->getReference('game-lol', Game::class),
            new \DateTimeImmutable('2025-07-08 18:00:00')
        );
        $manager->persist($fg4);

        $fg5 = $this->createFollowedGame(
            $this->getReference('user-3', User::class),
            $this->getReference('game-cs2', Game::class),
            null
        );
        $manager->persist($fg5);

        // admin-1 follows Overwatch 2
        $fg6 = $this->createFollowedGame(
            $this->getReference('admin-1', User::class),
            $this->getReference('game-overwatch2', Game::class),
            new \DateTimeImmutable('2025-07-10 10:00:00')
        );
        $manager->persist($fg6);

        $manager->flush();
    }

    private function createFollowedGame(User $user, Game $game, ?\DateTimeImmutable $lastCheckedAt): FollowedGames
    {
        $followedGame = new FollowedGames();
        $followedGame->setUser($user);
        $followedGame->setGame($game);
        $followedGame->setLastCheckedAt($lastCheckedAt);

        return $followedGame;
    }

    public function getDependencies(): array
    {
        return [
            UserFixtures::class,
            GameFixtures::class,
        ];
    }
}
