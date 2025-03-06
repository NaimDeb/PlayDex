<?php

namespace App\DataFixtures;

use App\Entity\Extension;
use App\Entity\Game;
use Doctrine\Bundle\FixturesBundle\Fixture;
use Doctrine\Common\DataFixtures\DependentFixtureInterface;
use Doctrine\Persistence\ObjectManager;

class ExtensionFixtures extends Fixture implements DependentFixtureInterface
{
    public function load(ObjectManager $manager): void
    {
        $extension1 = new Extension();
        $extension1->setTitle('Burning Crusade');
        $extension1->setDescription('First expansion for World of Warcraft, introducing new zones and raising level cap.');
        $extension1->setReleasedAt(new \DateTimeImmutable('2007-01-16'));
        $extension1->setGame($this->getReference('game-wow', Game::class));
        $manager->persist($extension1);

        $extension2 = new Extension();
        $extension2->setTitle('Wrath of the Lich King');
        $extension2->setDescription('Second expansion featuring Northrend and the fight against the Lich King.');
        $extension2->setReleasedAt(new \DateTimeImmutable('2008-11-13'));
        $extension2->setGame($this->getReference('game-wow', Game::class));
        $manager->persist($extension2);

        $extension3 = new Extension();
        $extension3->setTitle('Blood and Wine');
        $extension3->setDescription('Final expansion for The Witcher 3, set in the beautiful region of Toussaint.');
        $extension3->setReleasedAt(new \DateTimeImmutable('2016-05-31'));
        $extension3->setGame($this->getReference('game-witcher3', Game::class));
        $manager->persist($extension3);

        $extension4 = new Extension();
        $extension4->setTitle('Hearts of Stone');
        $extension4->setDescription('First major expansion for The Witcher 3, featuring a new storyline and characters.');
        $extension4->setReleasedAt(new \DateTimeImmutable('2015-10-13'));
        $extension4->setGame($this->getReference('game-witcher3', Game::class));
        $manager->persist($extension4);

        $manager->flush();
    }


    public function getDependencies(): array
    {
        return [
            GameFixtures::class,
        ];
    }


}