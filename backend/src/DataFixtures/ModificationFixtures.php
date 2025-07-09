<?php

namespace App\DataFixtures;

use App\Entity\Modification;
use App\Entity\User;
use App\Entity\Patchnote;
use Doctrine\Bundle\FixturesBundle\Fixture;
use Doctrine\Common\DataFixtures\DependentFixtureInterface;
use Doctrine\Persistence\ObjectManager;
use DiffMatchPatch\DiffMatchPatch;

class ModificationFixtures extends Fixture implements DependentFixtureInterface
{

    public static function getGroups(): array
    {
        return ['modification'];
    }

    public function load(ObjectManager $manager): void
    {
        $dmp = new DiffMatchPatch();

        // Get actual patchnote entities and their content
        $patchnote1 = $this->getReference('patchnote-1', Patchnote::class);
        $patchnote3 = $this->getReference('patchnote-3', Patchnote::class);
        $patchnote4 = $this->getReference('patchnote-4', Patchnote::class);

        $oldContent1 = $patchnote1->getContent();
        $oldContent2 = $patchnote3->getContent();
        $oldContent3 = $patchnote4->getContent();

        // Simulate new content for each patchnote (example: simple replacements)
        $newContent1 = str_replace('un buff', 'un CHANGEMENT buff', $oldContent1);
        $newContent2 = str_replace('Major visual upgrades', 'Major visual upgrades with ray tracing enabled', $oldContent2);
        $newContent3 = str_replace('Various UI improvements', 'Various UI improvements across all menus', $oldContent3);
        $newContent3 = str_replace('.', '', $newContent3); // Remove period to match previous logic

        $diffs1 = $dmp->diff_main($oldContent1, $newContent1, false);
        $mod1 = $this->createModification(
            $this->getReference('user-2', User::class),
            $patchnote1,
            $diffs1
        );
        $manager->persist($mod1);
        $this->addReference('mod-1', $mod1);

        $diffs2 = $dmp->diff_main($oldContent2, $newContent2, false);
        $mod2 = $this->createModification(
            $this->getReference('user-1', User::class),
            $patchnote3,
            $diffs2
        );
        $manager->persist($mod2);
        $this->addReference('mod-2', $mod2);

        $diffs3 = $dmp->diff_main($oldContent3, $newContent3, false);
        $mod3 = $this->createModification(
            $this->getReference('banned-user-1', User::class),
            $patchnote4,
            $diffs3
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
