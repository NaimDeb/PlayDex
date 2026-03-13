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
        // Witcher 3 DLCs
        $ext1 = $this->createExtension(
            'Hearts of Stone',
            'A new adventure set in the world of The Witcher 3.',
            new \DateTimeImmutable('2015-10-13'),
            3740,
            'https://images.igdb.com/igdb/image/upload/t_cover_big/co1wz0.jpg',
            $this->getReference('game-witcher3', Game::class)
        );
        $manager->persist($ext1);
        $this->addReference('ext-witcher3-hos', $ext1);

        $ext2 = $this->createExtension(
            'Blood and Wine',
            'A massive expansion that takes Geralt to the land of Toussaint.',
            new \DateTimeImmutable('2016-05-31'),
            3741,
            'https://images.igdb.com/igdb/image/upload/t_cover_big/co1wz1.jpg',
            $this->getReference('game-witcher3', Game::class)
        );
        $manager->persist($ext2);
        $this->addReference('ext-witcher3-baw', $ext2);

        // Baldur's Gate 3 DLC
        $ext3 = $this->createExtension(
            'Patch 7 - Modding Tools',
            'Official modding toolkit and new evil ending paths.',
            new \DateTimeImmutable('2024-09-05'),
            250001,
            null,
            $this->getReference('game-bg3', Game::class)
        );
        $manager->persist($ext3);
        $this->addReference('ext-bg3-patch7', $ext3);

        $manager->flush();
    }

    private function createExtension(
        string $title,
        ?string $description,
        ?\DateTimeImmutable $releasedAt,
        int $apiId,
        ?string $imageUrl,
        Game $game
    ): Extension {
        $extension = new Extension();
        $extension->setTitle($title);
        $extension->setDescription($description);
        $extension->setReleasedAt($releasedAt);
        $extension->setApiId($apiId);
        $extension->setImageUrl($imageUrl);
        $extension->setGame($game);

        return $extension;
    }

    public function getDependencies(): array
    {
        return [
            GameFixtures::class,
        ];
    }
}
