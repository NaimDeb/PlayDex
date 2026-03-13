<?php

namespace App\DataFixtures;

use App\Entity\Genre;
use Doctrine\Bundle\FixturesBundle\Fixture;
use Doctrine\Persistence\ObjectManager;

class GenreFixtures extends Fixture
{
    public function load(ObjectManager $manager): void
    {
        $genres = [
            ['ref' => 'genre-fps', 'apiId' => 5, 'name' => 'Shooter'],
            ['ref' => 'genre-rpg', 'apiId' => 12, 'name' => 'Role-playing (RPG)'],
            ['ref' => 'genre-adventure', 'apiId' => 31, 'name' => 'Adventure'],
            ['ref' => 'genre-strategy', 'apiId' => 15, 'name' => 'Strategy'],
            ['ref' => 'genre-moba', 'apiId' => 36, 'name' => 'MOBA'],
            ['ref' => 'genre-indie', 'apiId' => 32, 'name' => 'Indie'],
            ['ref' => 'genre-platformer', 'apiId' => 8, 'name' => 'Platform'],
        ];

        foreach ($genres as $data) {
            $genre = new Genre();
            $genre->setApiId($data['apiId']);
            $genre->setName($data['name']);
            $manager->persist($genre);
            $this->addReference($data['ref'], $genre);
        }

        $manager->flush();
    }
}
