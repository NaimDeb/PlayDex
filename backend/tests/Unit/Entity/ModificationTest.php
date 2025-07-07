<?php

namespace App\Tests\Unit\Entity;

use App\Entity\Modification;
use App\Entity\User;
use App\Entity\Patchnote;
use PHPUnit\Framework\TestCase;

class ModificationTest extends TestCase
{
    private Modification $modification;

    protected function setUp(): void
    {
        $this->modification = new Modification();
    }

    public function testModificationCreation(): void
    {
        $this->assertInstanceOf(Modification::class, $this->modification);
        $this->assertNull($this->modification->getId());
        $this->assertFalse($this->modification->isDeleted()); // Default value should be false
    }

    public function testSetAndGetUser(): void
    {
        $user = new User();
        $user->setUsername('modificationuser');

        $this->modification->setUser($user);

        $this->assertSame($user, $this->modification->getUser());
    }

    public function testSetAndGetPatchnote(): void
    {
        $patchnote = new Patchnote();
        $patchnote->setTitle('Test Patchnote');

        $this->modification->setPatchnote($patchnote);

        $this->assertSame($patchnote, $this->modification->getPatchnote());
    }

    public function testSetAndGetDifference(): void
    {
        $difference = [
            [-1, 'removed text'],
            [0, 'unchanged text'],
            [1, 'added text']
        ];

        $this->modification->setDifference($difference);

        $this->assertEquals($difference, $this->modification->getDifference());
    }

    public function testCreatedAtIsSet(): void
    {
        $date = new \DateTimeImmutable();
        $this->modification->setCreatedAt($date);

        $this->assertEquals($date, $this->modification->getCreatedAt());
    }

    public function testSoftDeleteFunctionality(): void
    {
        $this->assertFalse($this->modification->isDeleted());

        $this->modification->setIsDeleted(true);
        $this->assertTrue($this->modification->isDeleted());
    }

    public function testModificationWithRelations(): void
    {
        // Create related entities
        $user = new User();
        $user->setUsername('testuser');
        $user->setEmail('test@example.com');
        $user->setPassword('password');
        $user->setCreatedAt(new \DateTimeImmutable());

        $patchnote = new Patchnote();
        $patchnote->setTitle('Test Patchnote');
        $patchnote->setContent('Original content');
        $patchnote->setCreatedAt(new \DateTimeImmutable());

        // Set up modification
        $this->modification->setUser($user);
        $this->modification->setPatchnote($patchnote);
        $this->modification->setCreatedAt(new \DateTimeImmutable());
        $this->modification->setDifference([
            [-1, 'Original'],
            [1, 'Modified']
        ]);

        // Test that all relations are properly set
        $this->assertSame($user, $this->modification->getUser());
        $this->assertSame($patchnote, $this->modification->getPatchnote());
        $this->assertIsArray($this->modification->getDifference());
        $this->assertCount(2, $this->modification->getDifference());
    }
}
