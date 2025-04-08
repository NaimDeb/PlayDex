<?php

namespace App\DataFixtures;

use App\Config\PatchNoteImportance;
use App\Entity\Game;
use App\Entity\Modification;
use App\Entity\Patchnote;
use App\Entity\Report;
use App\Entity\User;
use Doctrine\Bundle\FixturesBundle\Fixture;
use Doctrine\Persistence\ObjectManager;

class PatchnoteModificationReportFixtures extends Fixture
{
    public function load(ObjectManager $manager): void
    {
        // Get the games with the specified IDs
        $gameIds = [515, 777, 614];
        $games = [];
        foreach ($gameIds as $id) {
            $game = $manager->getRepository(Game::class)->find($id);
            if ($game) {
                $games[] = $game;
            }
        }

        // If no games were found, create some dummy games
        if (empty($games)) {
            for ($i = 0; $i < 3; $i++) {
                $game = new Game();
                $game->setTitle('Game ' . ($i + 1));
                $game->setDescription('Description for Game ' . ($i + 1));
                $game->setReleasedAt(new \DateTimeImmutable(sprintf('2022-%02d-01', $i + 1)));
                $manager->persist($game);
                $games[] = $game;
            }
        }

        // Get users or create them if they don't exist
        $userIds = [3, 4, 5];
        $users = [];
        foreach ($userIds as $id) {
            $user = $manager->getRepository(User::class)->find($id);
            if (!$user) {
                $user = new User();
                // Set required User properties here
                $manager->persist($user);
            }
            $users[] = $user;
        }

        // Create Patchnotes (all by user with ID 5)
        $patchnotes = [];
        $creator = $users[2]; // User with ID 5 (index 2 in our array)

        $importanceLevels = [
            PatchNoteImportance::Minor,
            PatchNoteImportance::Major,
            PatchNoteImportance::Hotfix,
        ];

        foreach ($games as $index => $game) {
            // Create multiple patchnotes for each game
            for ($i = 0; $i < 3; $i++) {
                $patchnote = new Patchnote();
                $patchnote->setTitle(sprintf('v1.%d.%d - %s Update', $index + 1, $i + 1, $game->getTitle()));
                $patchnote->setContent('This update brings several improvements and bug fixes to enhance your gaming experience.');
                $patchnote->setSmallDescription(sprintf('Version %d.%d patch for %s', $index + 1, $i + 1, $game->getTitle()));
                $patchnote->setReleasedAt(new \DateTimeImmutable(sprintf('2025-%02d-%02d', $index + 1, ($i + 1) * 5)));
                $patchnote->setCreatedAt(new \DateTimeImmutable(sprintf('2025-%02d-%02d', $index + 1, ($i + 1) * 5 - 2)));
                $patchnote->setCreatedBy($creator);
                $patchnote->setGame($game);
                $patchnote->setImportance($importanceLevels[($index + $i) % 3]);
                $patchnote->setIsDeleted(false);
                
                $manager->persist($patchnote);
                $patchnotes[] = $patchnote;
            }
        }

        // Create modifications for patchnotes
        $modificationTexts = [
            'Added new feature: player stats tracking',
            'Fixed bug with inventory management',
            'Improved performance in open world areas',
            'Rebalanced character abilities for better gameplay',
            'Added new cosmetic items',
            'Fixed crash issue when loading large saves'
        ];

        foreach ($patchnotes as $index => $patchnote) {
            // Create 2-3 modifications per patchnote
            $modCount = 2 + ($index % 2);
            for ($i = 0; $i < $modCount; $i++) {
                $modification = new Modification();
                $modification->setDifference($modificationTexts[($index + $i) % count($modificationTexts)]);
                $modification->setCreatedAt(new \DateTimeImmutable(sprintf('2025-%02d-%02d', ($index % 3) + 1, ($i + 10))));
                // Assign to a random user from our list
                $modification->setUser($users[$i % count($users)]);
                $modification->setPatchnote($patchnote);
                $modification->setIsDeleted(false);
                
                $manager->persist($modification);
            }
        }

        // Create reports for both patchnotes and modifications
        $reportReasons = [
            'Inappropriate content',
            'Misleading information',
            'Duplicate content',
            'Offensive language',
            'Incorrect information'
        ];

        // Report some patchnotes
        foreach ($patchnotes as $index => $patchnote) {
            if ($index % 3 == 0) { // Report every third patchnote
                foreach ($users as $userIndex => $user) {
                    $report = new Report();
                    $report->setReportedBy($user);
                    $report->setReason($reportReasons[$userIndex % count($reportReasons)]);
                    $report->setReportedAt(new \DateTimeImmutable(sprintf('2025-%02d-%02d', ($index % 3) + 1, 15 + $userIndex)));
                    $report->setReportableId($patchnote->getId() ?: 999); // Use 999 as a placeholder if ID is null
                    $report->setReportableEntity(Patchnote::class);
                    $report->setIsDeleted(false);
                    
                    $manager->persist($report);
                }
            }
        }

        // Flush to save everything
        $manager->flush();
    }

}