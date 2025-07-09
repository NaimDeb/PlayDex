<?php

namespace App\DataFixtures;

use App\Entity\Report;
use App\Entity\User;
use Doctrine\Bundle\FixturesBundle\Fixture;
use Doctrine\Common\DataFixtures\DependentFixtureInterface;
use Doctrine\Persistence\ObjectManager;

class ReportFixtures extends Fixture implements DependentFixtureInterface
{
    public function load(ObjectManager $manager): void
    {
        // Report on a patchnote
        $report1 = $this->createReport(
            $this->getReference('user-1', User::class),
            'Inappropriate content in patchnote',
            1,
            'App\Entity\Patchnote'
        );
        $manager->persist($report1);

        // Another report on the same patchnote by a different user
        $report2 = $this->createReport(
            $this->getReference('user-2', User::class),
            'Misleading information in the patchnote',
            1,
            'App\Entity\Patchnote'
        );
        $manager->persist($report2);

        // Report on a modification
        $report3 = $this->createReport(
            $this->getReference('admin-1', User::class),
            'Vandalism - unnecessary modification',
            1,
            'App\Entity\Modification'
        );
        $manager->persist($report3);

        // Report from banned user (for testing purposes)
        $report4 = $this->createReport(
            $this->getReference('banned-user-1', User::class),
            'Spam content in modification',
            2,
            'App\Entity\Modification'
        );
        $manager->persist($report4);

        $manager->flush();
    }

    private function createReport($reportedBy, string $reason, int $reportableId, string $reportableEntity): Report
    {
        $report = new Report();
        $report->setReportedBy($reportedBy);
        $report->setReason($reason);
        $report->setReportedAt(new \DateTimeImmutable());
        $report->setReportableId($reportableId);
        $report->setReportableEntity($reportableEntity);
        $report->setIsDeleted(false);

        return $report;
    }

    public function getDependencies(): array
    {
        return [
            UserFixtures::class,
            PatchnoteFixtures::class,
            ModificationFixtures::class,
        ];
    }
}
