<?php

namespace App\DataFixtures;

use App\Entity\UpdateHistory;
use Doctrine\Bundle\FixturesBundle\Fixture;
use Doctrine\Persistence\ObjectManager;

class UpdateHistoryFixtures extends Fixture
{
    public function load(ObjectManager $manager): void
    {
        // Simulate a few past update runs
        $update1 = new UpdateHistory();
        $update1->setUpdatedAt((new \DateTimeImmutable('2025-07-01 02:00:00'))->getTimestamp());
        $manager->persist($update1);

        $update2 = new UpdateHistory();
        $update2->setUpdatedAt((new \DateTimeImmutable('2025-07-05 02:00:00'))->getTimestamp());
        $manager->persist($update2);

        $update3 = new UpdateHistory();
        $update3->setUpdatedAt((new \DateTimeImmutable('2025-07-10 02:00:00'))->getTimestamp());
        $manager->persist($update3);

        $manager->flush();
    }
}
