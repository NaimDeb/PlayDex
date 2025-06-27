<?php

namespace App\Tests\Unit\Entity;

use App\Entity\Patchnote;
use App\Entity\Game;
use App\Entity\User;
use App\Config\PatchNoteImportance;
use PHPUnit\Framework\TestCase;

class PatchnoteTest extends TestCase
{
    private Patchnote $patchnote;

    protected function setUp(): void
    {
        $this->patchnote = new Patchnote();
    }

    public function testPatchnoteCreation(): void
    {
        $this->assertInstanceOf(Patchnote::class, $this->patchnote);
        $this->assertNull($this->patchnote->getId());
    }

    public function testSetAndGetTitle(): void
    {
        $title = 'Test Patchnote Title';
        $this->patchnote->setTitle($title);
        
        $this->assertEquals($title, $this->patchnote->getTitle());
    }

    public function testSetAndGetContent(): void
    {
        $content = 'This is a test patchnote content';
        $this->patchnote->setContent($content);
        
        $this->assertEquals($content, $this->patchnote->getContent());
    }

    public function testSetAndGetImportance(): void
    {
        $importance = PatchNoteImportance::Major;
        $this->patchnote->setImportance($importance);
        
        $this->assertEquals($importance, $this->patchnote->getImportance());
    }

    public function testSetAndGetGame(): void
    {
        $game = new Game();
        $game->setTitle('Test Game');
        
        $this->patchnote->setGame($game);
        
        $this->assertSame($game, $this->patchnote->getGame());
    }

    public function testSetAndGetCreatedBy(): void
    {
        $user = new User();
        $user->setUsername('testuser');
        
        $this->patchnote->setCreatedBy($user);
        
        $this->assertSame($user, $this->patchnote->getCreatedBy());
    }

    public function testCreatedAtIsSet(): void
    {
        $date = new \DateTimeImmutable();
        $this->patchnote->setCreatedAt($date);
        
        $this->assertEquals($date, $this->patchnote->getCreatedAt());
    }

    public function testReleasedAt(): void
    {
        $releaseDate = new \DateTimeImmutable();
        $this->patchnote->setReleasedAt($releaseDate);
        
        $this->assertEquals($releaseDate, $this->patchnote->getReleasedAt());
    }

    public function testSoftDeleteFunctionality(): void
    {
        $this->assertFalse($this->patchnote->isDeleted());
        
        $this->patchnote->setIsDeleted(true);
        $this->assertTrue($this->patchnote->isDeleted());
    }

    public function testSmallDescription(): void
    {
        $description = 'Small description for patch';
        $this->patchnote->setSmallDescription($description);
        
        $this->assertEquals($description, $this->patchnote->getSmallDescription());
    }

    public function testModificationsCollection(): void
    {
        $modifications = $this->patchnote->getModification();
        
        $this->assertCount(0, $modifications);
        $this->assertInstanceOf(\Doctrine\Common\Collections\Collection::class, $modifications);
    }
}
