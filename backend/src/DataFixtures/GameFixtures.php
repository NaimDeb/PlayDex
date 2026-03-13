<?php

namespace App\DataFixtures;

use App\Entity\Company;
use App\Entity\Game;
use App\Entity\Genre;
use Doctrine\Bundle\FixturesBundle\Fixture;
use Doctrine\Common\DataFixtures\DependentFixtureInterface;
use Doctrine\Persistence\ObjectManager;

class GameFixtures extends Fixture implements DependentFixtureInterface
{
    public function load(ObjectManager $manager): void
    {
        // Overwatch 2
        $game1 = $this->createGame(
            'Overwatch 2',
            'A team-based action game set in an optimistic future.',
            'https://images.igdb.com/igdb/image/upload/t_cover_big/co5tkk.jpg',
            new \DateTimeImmutable('2022-10-04'),
            null,
            112345,
            2246340
        );
        $game1->addGenre($this->getReference('genre-fps', Genre::class));
        $game1->addCompany($this->getReference('company-blizzard', Company::class));
        $manager->persist($game1);
        $this->addReference('game-overwatch2', $game1);

        // The Witcher 3: Wild Hunt
        $game2 = $this->createGame(
            'The Witcher 3: Wild Hunt',
            'An action role-playing game set in an open world fantasy universe.',
            'https://images.igdb.com/igdb/image/upload/t_cover_big/co1wyy.jpg',
            new \DateTimeImmutable('2015-05-19'),
            new \DateTimeImmutable('2024-06-03'),
            1942,
            292030
        );
        $game2->addGenre($this->getReference('genre-rpg', Genre::class));
        $game2->addGenre($this->getReference('genre-adventure', Genre::class));
        $game2->addCompany($this->getReference('company-cdpr', Company::class));
        $manager->persist($game2);
        $this->addReference('game-witcher3', $game2);

        // Baldur's Gate 3
        $game3 = $this->createGame(
            'Baldur\'s Gate 3',
            'An epic RPG based on Dungeons & Dragons.',
            'https://images.igdb.com/igdb/image/upload/t_cover_big/co670h.jpg',
            new \DateTimeImmutable('2023-08-03'),
            new \DateTimeImmutable('2025-02-20'),
            119171,
            1086940
        );
        $game3->addGenre($this->getReference('genre-rpg', Genre::class));
        $game3->addGenre($this->getReference('genre-strategy', Genre::class));
        $game3->addCompany($this->getReference('company-larian', Company::class));
        $manager->persist($game3);
        $this->addReference('game-bg3', $game3);

        // Counter-Strike 2
        $game4 = $this->createGame(
            'Counter-Strike 2',
            'A competitive first-person shooter.',
            'https://images.igdb.com/igdb/image/upload/t_cover_big/co6v4a.jpg',
            new \DateTimeImmutable('2023-09-27'),
            new \DateTimeImmutable('2025-03-01'),
            194920,
            730
        );
        $game4->addGenre($this->getReference('genre-fps', Genre::class));
        $game4->addCompany($this->getReference('company-valve', Company::class));
        $manager->persist($game4);
        $this->addReference('game-cs2', $game4);

        // League of Legends
        $game5 = $this->createGame(
            'League of Legends',
            'A fast-paced competitive online game blending speed and strategy.',
            'https://images.igdb.com/igdb/image/upload/t_cover_big/co49wj.jpg',
            new \DateTimeImmutable('2009-10-27'),
            new \DateTimeImmutable('2025-03-10'),
            115,
            null
        );
        $game5->addGenre($this->getReference('genre-moba', Genre::class));
        $game5->addGenre($this->getReference('genre-strategy', Genre::class));
        $game5->addCompany($this->getReference('company-riot', Company::class));
        $manager->persist($game5);
        $this->addReference('game-lol', $game5);

        $manager->flush();
    }

    private function createGame(
        string $title,
        string $description,
        string $imageUrl,
        \DateTimeImmutable $releasedAt,
        ?\DateTimeImmutable $lastUpdatedAt,
        ?int $apiId,
        ?int $steamId
    ): Game {
        $game = new Game();
        $game->setTitle($title);
        $game->setDescription($description);
        $game->setImageUrl($imageUrl);
        $game->setReleasedAt($releasedAt);
        $game->setLastUpdatedAt($lastUpdatedAt);
        $game->setApiId($apiId);
        $game->setSteamId($steamId);

        return $game;
    }

    public function getDependencies(): array
    {
        return [
            GenreFixtures::class,
            CompanyFixtures::class,
        ];
    }
}
