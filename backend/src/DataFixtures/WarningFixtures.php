<?php

namespace App\DataFixtures;

use App\Entity\User;
use App\Entity\Warning;
use Doctrine\Bundle\FixturesBundle\Fixture;
use Doctrine\Common\DataFixtures\DependentFixtureInterface;
use Doctrine\Persistence\ObjectManager;

class WarningFixtures extends Fixture implements DependentFixtureInterface
{
    public function load(ObjectManager $manager): void
    {
        // Warning for banned-user-1 issued by admin-1
        $warning1 = $this->createWarning(
            $this->getReference('banned-user-1', User::class),
            $this->getReference('admin-1', User::class),
            'Posting inappropriate content in patchnotes'
        );
        $manager->persist($warning1);

        // Warning for banned-user-1 issued by admin-2
        $warning2 = $this->createWarning(
            $this->getReference('banned-user-1', User::class),
            $this->getReference('admin-2', User::class),
            'Repeated vandalism of community patchnotes'
        );
        $manager->persist($warning2);

        // Warning for banned-user-2 issued by admin-1
        $warning3 = $this->createWarning(
            $this->getReference('banned-user-2', User::class),
            $this->getReference('admin-1', User::class),
            'Spamming patchnotes with irrelevant content'
        );
        $manager->persist($warning3);

        // Warning for user-3 (not banned yet, just warned)
        $warning4 = $this->createWarning(
            $this->getReference('user-3', User::class),
            $this->getReference('admin-2', User::class),
            'Low-quality patchnote submission'
        );
        $manager->persist($warning4);

        $manager->flush();
    }

    private function createWarning(User $reportedUser, User $warnedBy, string $reason): Warning
    {
        $warning = new Warning();
        $warning->setReportedUserId($reportedUser);
        $warning->setWarnedBy($warnedBy);
        $warning->setReason($reason);

        return $warning;
    }

    public function getDependencies(): array
    {
        return [
            UserFixtures::class,
        ];
    }
}
