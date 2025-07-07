<?php

namespace App\Tests\Unit\Repository;

use App\Entity\Patchnote;
use App\Entity\Game;
use App\Entity\User;
use App\Repository\PatchnoteRepository;
use App\Config\PatchNoteImportance;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Bundle\FrameworkBundle\Test\KernelTestCase;

class PatchnoteRepositoryTest extends KernelTestCase
{
    private EntityManagerInterface $entityManager;
    private PatchnoteRepository $patchnoteRepository;

    protected function setUp(): void
    {
        $kernel = self::bootKernel();
        $this->entityManager = $kernel->getContainer()->get('doctrine')->getManager();
        $this->patchnoteRepository = $this->entityManager->getRepository(Patchnote::class);
    }

    public function testFindNonDeletedPatchnotes(): void
    {
        // Create test data
        $game = new Game();
        $game->setTitle('Test Game');
        $this->entityManager->persist($game);

        $user = new User();
        $user->setEmail('testpatch@example.com');
        $user->setUsername('patchuser');
        $user->setPassword('password');
        $user->setCreatedAt(new \DateTimeImmutable());
        $this->entityManager->persist($user);

        // Create a non-deleted patchnote
        $patchnote1 = new Patchnote();
        $patchnote1->setTitle('Active Patchnote');
        $patchnote1->setContent('This is an active patchnote');
        $patchnote1->setGame($game);
        $patchnote1->setCreatedBy($user);
        $patchnote1->setCreatedAt(new \DateTimeImmutable());
        $patchnote1->setImportance(PatchNoteImportance::Major);
        $patchnote1->setIsDeleted(false);
        $this->entityManager->persist($patchnote1);

        // Create a deleted patchnote
        $patchnote2 = new Patchnote();
        $patchnote2->setTitle('Deleted Patchnote');
        $patchnote2->setContent('This is a deleted patchnote');
        $patchnote2->setGame($game);
        $patchnote2->setCreatedBy($user);
        $patchnote2->setCreatedAt(new \DateTimeImmutable());
        $patchnote2->setImportance(PatchNoteImportance::Minor);
        $patchnote2->setIsDeleted(true);
        $this->entityManager->persist($patchnote2);

        $this->entityManager->flush();

        // Test finding non-deleted patchnotes
        $activePatchnotes = $this->patchnoteRepository->findBy(['isDeleted' => false]);

        $this->assertCount(1, $activePatchnotes);
        $this->assertEquals('Active Patchnote', $activePatchnotes[0]->getTitle());

        // Cleanup
        $this->entityManager->remove($patchnote1);
        $this->entityManager->remove($patchnote2);
        $this->entityManager->remove($user);
        $this->entityManager->remove($game);
        $this->entityManager->flush();
    }

    public function testFindPatchnotesByGame(): void
    {
        // Create test data
        $game1 = new Game();
        $game1->setTitle('Game 1');
        $this->entityManager->persist($game1);

        $game2 = new Game();
        $game2->setTitle('Game 2');
        $this->entityManager->persist($game2);

        $user = new User();
        $user->setEmail('testgame@example.com');
        $user->setUsername('gameuser');
        $user->setPassword('password');
        $user->setCreatedAt(new \DateTimeImmutable());
        $this->entityManager->persist($user);

        // Create patchnotes for game1
        $patchnote1 = new Patchnote();
        $patchnote1->setTitle('Game 1 Patch');
        $patchnote1->setGame($game1);
        $patchnote1->setCreatedBy($user);
        $patchnote1->setCreatedAt(new \DateTimeImmutable());
        $patchnote1->setIsDeleted(false);
        $this->entityManager->persist($patchnote1);

        // Create patchnote for game2
        $patchnote2 = new Patchnote();
        $patchnote2->setTitle('Game 2 Patch');
        $patchnote2->setGame($game2);
        $patchnote2->setCreatedBy($user);
        $patchnote2->setCreatedAt(new \DateTimeImmutable());
        $patchnote2->setIsDeleted(false);
        $this->entityManager->persist($patchnote2);

        $this->entityManager->flush();

        // Test finding patchnotes by game
        $game1Patches = $this->patchnoteRepository->findBy(['game' => $game1]);
        $game2Patches = $this->patchnoteRepository->findBy(['game' => $game2]);

        $this->assertCount(1, $game1Patches);
        $this->assertCount(1, $game2Patches);
        $this->assertEquals('Game 1 Patch', $game1Patches[0]->getTitle());
        $this->assertEquals('Game 2 Patch', $game2Patches[0]->getTitle());

        // Cleanup
        $this->entityManager->remove($patchnote1);
        $this->entityManager->remove($patchnote2);
        $this->entityManager->remove($user);
        $this->entityManager->remove($game1);
        $this->entityManager->remove($game2);
        $this->entityManager->flush();
    }

    protected function tearDown(): void
    {
        parent::tearDown();
        $this->entityManager->close();
    }
}
