<?php

namespace App\DataFixtures;

use App\Entity\Modification;
use App\Entity\User;
use App\Entity\Patchnote;
use Doctrine\Bundle\FixturesBundle\Fixture;
use Doctrine\Common\DataFixtures\DependentFixtureInterface;
use Doctrine\Persistence\ObjectManager;

class ModificationFixtures extends Fixture implements DependentFixtureInterface
{
    public function load(ObjectManager $manager): void
    {
        // Modification sur Patchnote 1 (vrai diff-match-patch)
        $mod1 = $this->createModification(
            $this->getReference('user-2', User::class),
            $this->getReference('patchnote-1', Patchnote::class),
            [
                [0, "Bonjour patchnote\n[buff]Voici un"],
                [1, " CHANGEMENT"],
                [0, " buff, [/buff]\n\n[debuff]Voici"],
                [-1, " un"],
                [0, " debuff[/debuff]"]
            ]
        );
        $manager->persist($mod1);
        $this->addReference('mod-1', $mod1);

        // Modification sur Patchnote 3 (autre diff réaliste)
        $mod2 = $this->createModification(
            $this->getReference('user-1', User::class),
            $this->getReference('patchnote-3', Patchnote::class),
            [
                [0, "Major visual upgrades"],
                [1, " with ray tracing enabled"],
                [0, " and performance optimizations"]
            ]
        );
        $manager->persist($mod2);
        $this->addReference('mod-2', $mod2);

        // Modification par un utilisateur banni
        $mod3 = $this->createModification(
            $this->getReference('banned-user-1', User::class),
            $this->getReference('patchnote-4', Patchnote::class),
            [
                [0, "Various UI improvements"],
                [1, " across all menus"],
                [0, " and minor bug fixes"],
                [-1, "."]
            ]
        );
        $manager->persist($mod3);
        $this->addReference('mod-3', $mod3);

        $manager->flush();
    }

    private function createModification($user, $patchnote, array $difference): Modification
    {
        $modification = new Modification();
        $modification->setUser($user);
        $modification->setPatchnote($patchnote);
        $modification->setDifference($difference);
        $modification->setCreatedAt(new \DateTimeImmutable());
        $modification->setIsDeleted(false);
        
        return $modification;
    }

    public function getDependencies(): array
    {
        return [
            UserFixtures::class,
            PatchnoteFixtures::class,
        ];
    }
}
