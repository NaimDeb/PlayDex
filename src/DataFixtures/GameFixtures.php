<?php

namespace App\DataFixtures;

use App\Entity\Game;
use Doctrine\Bundle\FixturesBundle\Fixture;
use Doctrine\Persistence\ObjectManager;

class GameFixtures extends Fixture
{
    public function load(ObjectManager $manager): void
    {
        $game1 = new Game();
        $game1->setTitle('World of Warcraft');
        $game1->setDescription('Massively multiplayer online role-playing game set in the Warcraft fantasy universe.');
        $game1->setReleasedAt(new \DateTimeImmutable('2004-11-23'));
        $manager->persist($game1);
        $this->addReference('game-wow', $game1);

        $game2 = new Game();
        $game2->setTitle('The Witcher 3: Wild Hunt');
        $game2->setDescription('Action role-playing game following Geralt of Rivia in an open world fantasy setting.');
        $game2->setReleasedAt(new \DateTimeImmutable('2015-05-19'));
        $manager->persist($game2);
        $this->addReference('game-witcher3', $game2);

        $game3 = new Game();
        $game3->setTitle('Red Dead Redemption 2');
        $game3->setDescription('Action-adventure game set in the American Wild West following Arthur Morgan.');
        $game3->setReleasedAt(new \DateTimeImmutable('2018-10-26'));
        $manager->persist($game3);
        $this->addReference('game-rdr2', $game3);

        $manager->flush();
    }
}