<?php

namespace App\DataFixtures;

use App\Config\PatchNoteImportance;
use App\Entity\Game;
use App\Entity\Patchnote;
use App\Entity\User;
use Doctrine\Bundle\FixturesBundle\Fixture;
use Doctrine\Common\DataFixtures\DependentFixtureInterface;
use Doctrine\Persistence\ObjectManager;

class PatchnoteFixtures extends Fixture implements DependentFixtureInterface
{
    public function load(ObjectManager $manager): void
    {
        // Create a set of test games
        $game1 = $manager->getRepository(Game::class)->findOneBy(['title' => 'Overwatch 2']);
        $game2 = $manager->getRepository(Game::class)->findOneBy(['title' => 'The Witcher 3: Wild Hunt']);
        $game3 = $manager->getRepository(Game::class)->findOneBy(['title' => 'Baldur\'s Gate 3']);

        // Create patchnotes for Game 1 (Overwatch 2)
        $patchnote1 = $this->createPatchnote(
            'Major Update 2.1',
            'Introducing new gameplay mechanics and major bug fixes',
            'Comprehensive overhaul of combat system, new side quests, and various performance improvements',
            new \DateTimeImmutable('2025-07-05'),
            PatchNoteImportance::Major,
            $this->getReference('user-1', User::class),
            $game1
        );
        $manager->persist($patchnote1);
        $this->addReference('patchnote-1', $patchnote1);

        $patchnote2 = $this->createPatchnote(
            'Hotfix 2.1.1',
            'Critical bug fixes for Update 2.1',
            'Addressing critical issues reported after the 2.1 update including crash fixes',
            new \DateTimeImmutable('2025-07-08'),
            PatchNoteImportance::Hotfix,
            $this->getReference('user-2', User::class),
            $game1
        );
        $manager->persist($patchnote2);
        $this->addReference('patchnote-2', $patchnote2);

        // Create patchnotes for Game 2 (Witcher 3)
        $patchnote3 = $this->createPatchnote(
            'Next-Gen Update Patch',
            'Graphics and Performance Enhancement',
            'Major visual upgrades and performance optimizations for next-gen consoles and PC',
            new \DateTimeImmutable('2025-07-03'),
            PatchNoteImportance::Major,
            $this->getReference('admin-1', User::class),
            $game2
        );
        $manager->persist($patchnote3);
        $this->addReference('patchnote-3', $patchnote3);

        // Create patchnotes for Game 3 (Baldur's Gate 3)
        $patchnote4 = $this->createPatchnote(
            'Minor Update 1.3',
            'Quality of Life Improvements',
            'Various UI improvements and minor bug fixes',
            new \DateTimeImmutable('2025-07-09'),
            PatchNoteImportance::Minor,
            $this->getReference('user-3', User::class),
            $game3
        );
        $manager->persist($patchnote4);
        $this->addReference('patchnote-4', $patchnote4);

        $patchnote5 = $this->createPatchnote(
            'Balance Update 1.2',
            'Class Balance Changes',
            'Major rebalancing of character classes and abilities',
            new \DateTimeImmutable('2025-07-07'),
            PatchNoteImportance::Major,
            $this->getReference('admin-2', User::class),
            $game3
        );
        $manager->persist($patchnote5);
        $this->addReference('patchnote-5', $patchnote5);

        $manager->flush();
    }

    private function createPatchnote(
        string $title,
        string $smallDescription,
        string $content,
        \DateTimeImmutable $releasedAt,
        PatchNoteImportance $importance,
        $createdBy,
        Game $game
    ): Patchnote {
        $patchnote = new Patchnote();
        $patchnote->setTitle($title);
        $patchnote->setSmallDescription($smallDescription);
        $patchnote->setContent($content);
        $patchnote->setReleasedAt($releasedAt);
        $patchnote->setCreatedAt(new \DateTimeImmutable());
        $patchnote->setImportance($importance);
        $patchnote->setCreatedBy($createdBy);
        $patchnote->setGame($game);
        $patchnote->setIsDeleted(false);

        return $patchnote;
    }

    public function getDependencies(): array
    {
        return [
            UserFixtures::class,
        ];
    }
}
