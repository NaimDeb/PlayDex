<?php

namespace App\Tests\Unit\Service\Api;

use App\Interfaces\Api\DataStorageInterface;
use App\Service\DatabaseOperationService;
use App\Service\Storage\IgdbCompanyStorage;
use App\Service\Storage\IgdbGenreStorage;
use PHPUnit\Framework\TestCase;

class IgdbStorageTest extends TestCase
{
    private DatabaseOperationService|\PHPUnit\Framework\MockObject\MockObject $databaseService;

    protected function setUp(): void
    {
        $this->databaseService = $this->createMock(DatabaseOperationService::class);
    }

    public function testGenreStorageImplementsInterface(): void
    {
        $storage = new IgdbGenreStorage($this->databaseService);
        $this->assertInstanceOf(DataStorageInterface::class, $storage);
    }

    public function testCompanyStorageImplementsInterface(): void
    {
        $storage = new IgdbCompanyStorage($this->databaseService);
        $this->assertInstanceOf(DataStorageInterface::class, $storage);
    }

    public function testGenreStorageStoresSingleItem(): void
    {
        $genre = ['id' => 1, 'name' => 'Action', 'slug' => 'action'];

        $this->databaseService
            ->expects($this->once())
            ->method('insertOrUpdateGenre')
            ->with($genre)
            ->willReturn(true);

        $storage = new IgdbGenreStorage($this->databaseService);
        $result = $storage->store([$genre]);

        $this->assertTrue($result);
    }

    public function testGenreStorageStoresMultipleItems(): void
    {
        $genres = [
            ['id' => 1, 'name' => 'Action', 'slug' => 'action'],
            ['id' => 2, 'name' => 'Adventure', 'slug' => 'adventure'],
            ['id' => 3, 'name' => 'RPG', 'slug' => 'rpg'],
        ];

        $this->databaseService
            ->expects($this->exactly(3))
            ->method('insertOrUpdateGenre')
            ->willReturn(true);

        $storage = new IgdbGenreStorage($this->databaseService);
        $result = $storage->store($genres);

        $this->assertTrue($result);
    }

    public function testCompanyStorageStoresSingleItem(): void
    {
        $company = ['id' => 1, 'name' => 'Nintendo', 'slug' => 'nintendo'];

        $this->databaseService
            ->expects($this->once())
            ->method('insertOrUpdateCompany')
            ->with($company)
            ->willReturn(true);

        $storage = new IgdbCompanyStorage($this->databaseService);
        $result = $storage->store([$company]);

        $this->assertTrue($result);
    }

    public function testStorageHandlesEmptyData(): void
    {
        $this->databaseService
            ->expects($this->never())
            ->method('insertOrUpdateGenre');

        $storage = new IgdbGenreStorage($this->databaseService);
        $result = $storage->store([]);

        $this->assertTrue($result);
    }

    public function testStorageHandlesDatabaseError(): void
    {
        $genre = ['id' => 1, 'name' => 'Action'];

        $this->databaseService
            ->expects($this->once())
            ->method('insertOrUpdateGenre')
            ->willThrowException(new \Exception('Database error'));

        $storage = new IgdbGenreStorage($this->databaseService);

        $this->expectException(\Exception::class);
        $storage->store([$genre]);
    }

    public function testGenreStorageSourceName(): void
    {
        $storage = new IgdbGenreStorage($this->databaseService);
        $this->assertEquals('genres', $storage->getSourceName());
    }

    public function testCompanyStorageSourceName(): void
    {
        $storage = new IgdbCompanyStorage($this->databaseService);
        $this->assertEquals('companies', $storage->getSourceName());
    }

    public function testStoragePreservesDataIntegrity(): void
    {
        $originalGenre = ['id' => 1, 'name' => 'Action', 'slug' => 'action'];
        $genreToStore = $originalGenre;

        $this->databaseService
            ->expects($this->once())
            ->method('insertOrUpdateGenre')
            ->with($this->callback(function ($genre) use ($originalGenre) {
                return $genre['id'] === $originalGenre['id'] &&
                    $genre['name'] === $originalGenre['name'] &&
                    $genre['slug'] === $originalGenre['slug'];
            }))
            ->willReturn(true);

        $storage = new IgdbGenreStorage($this->databaseService);
        $storage->store([$genreToStore]);

        // Verify original wasn't modified
        $this->assertEquals($originalGenre, $genreToStore);
    }

    public function testStorageReturnsSuccessOnAllItemsProcessed(): void
    {
        $genres = [
            ['id' => 1, 'name' => 'Action'],
            ['id' => 2, 'name' => 'Adventure'],
        ];

        $this->databaseService
            ->expects($this->exactly(2))
            ->method('insertOrUpdateGenre')
            ->willReturnOnConsecutiveCalls(true, true);

        $storage = new IgdbGenreStorage($this->databaseService);
        $result = $storage->store($genres);

        $this->assertTrue($result);
    }

    public function testCompanyStorageProcessesAllCompanies(): void
    {
        $companies = [
            ['id' => 1, 'name' => 'Nintendo'],
            ['id' => 2, 'name' => 'Sony'],
            ['id' => 3, 'name' => 'Microsoft'],
        ];

        $callCount = 0;
        $this->databaseService
            ->expects($this->exactly(3))
            ->method('insertOrUpdateCompany')
            ->willReturnCallback(function () use (&$callCount) {
                $callCount++;
                return true;
            });

        $storage = new IgdbCompanyStorage($this->databaseService);
        $storage->store($companies);

        $this->assertEquals(3, $callCount);
    }
}
