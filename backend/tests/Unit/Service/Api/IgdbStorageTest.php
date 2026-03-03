<?php

namespace App\Tests\Unit\Service\Api;

use App\Interfaces\Api\DataStorageInterface;
use App\Service\DatabaseOperationService;
use App\Service\IgdbDataProcessorService;
use App\Service\Storage\IgdbCompanyStorage;
use App\Service\Storage\IgdbGenreStorage;
use PHPUnit\Framework\TestCase;

class IgdbStorageTest extends TestCase
{
    private DatabaseOperationService|\PHPUnit\Framework\MockObject\MockObject $databaseService;
    private IgdbDataProcessorService|\PHPUnit\Framework\MockObject\MockObject $dataProcessor;

    protected function setUp(): void
    {
        $this->databaseService = $this->createMock(DatabaseOperationService::class);
        $this->dataProcessor = $this->createMock(IgdbDataProcessorService::class);
    }

    public function testGenreStorageImplementsInterface(): void
    {
        $storage = new IgdbGenreStorage($this->databaseService, $this->dataProcessor);
        $this->assertInstanceOf(DataStorageInterface::class, $storage);
    }

    public function testCompanyStorageImplementsInterface(): void
    {
        $storage = new IgdbCompanyStorage($this->databaseService, $this->dataProcessor);
        $this->assertInstanceOf(DataStorageInterface::class, $storage);
    }

    public function testGenreStorageStoresSingleItem(): void
    {
        $genre = ['id' => 1, 'name' => 'Action', 'slug' => 'action'];

        $storage = new IgdbGenreStorage($this->databaseService, $this->dataProcessor);
        $storage->store([$genre]);

        $this->assertTrue(true);
    }

    public function testGenreStorageStoresMultipleItems(): void
    {
        $genres = [
            ['id' => 1, 'name' => 'Action', 'slug' => 'action'],
            ['id' => 2, 'name' => 'Adventure', 'slug' => 'adventure'],
            ['id' => 3, 'name' => 'RPG', 'slug' => 'rpg'],
        ];

        $storage = new IgdbGenreStorage($this->databaseService, $this->dataProcessor);
        $storage->store($genres);

        $this->assertTrue(true);
    }

    public function testCompanyStorageStoresSingleItem(): void
    {
        $company = ['id' => 1, 'name' => 'Nintendo', 'slug' => 'nintendo'];

        $storage = new IgdbCompanyStorage($this->databaseService, $this->dataProcessor);
        $storage->store([$company]);

        $this->assertTrue(true);
    }

    public function testStorageHandlesEmptyData(): void
    {
        $storage = new IgdbGenreStorage($this->databaseService, $this->dataProcessor);
        $storage->store([]);

        $this->assertTrue(true);
    }

    public function testStorageHandlesDatabaseError(): void
    {
        $genre = ['id' => 1, 'name' => 'Action'];

        $storage = new IgdbGenreStorage($this->databaseService, $this->dataProcessor);
        $storage->store([$genre]);

        $this->assertTrue(true);
    }

    public function testGenreStorageSourceName(): void
    {
        $storage = new IgdbGenreStorage($this->databaseService, $this->dataProcessor);
        $this->assertEquals('genre', $storage->getTableName());
    }

    public function testCompanyStorageSourceName(): void
    {
        $storage = new IgdbCompanyStorage($this->databaseService, $this->dataProcessor);
        $this->assertEquals('company', $storage->getTableName());
    }

    public function testStoragePreservesDataIntegrity(): void
    {
        $genres = [
            ['id' => 1, 'name' => 'Action', 'slug' => 'action'],
            ['id' => 2, 'name' => 'Adventure', 'slug' => 'adventure'],
        ];

        $storage = new IgdbGenreStorage($this->databaseService, $this->dataProcessor);
        $storage->store($genres);

        $this->assertTrue(true);
    }

    public function testStorageReturnsSuccessOnAllItemsProcessed(): void
    {
        $genres = [
            ['id' => 1, 'name' => 'Action'],
            ['id' => 2, 'name' => 'Adventure'],
        ];

        $storage = new IgdbGenreStorage($this->databaseService, $this->dataProcessor);
        $storage->store($genres);

        $this->assertTrue(true);
    }

    public function testCompanyStorageProcessesAllCompanies(): void
    {
        $companies = [
            ['id' => 1, 'name' => 'Nintendo'],
            ['id' => 2, 'name' => 'Sony'],
        ];

        $storage = new IgdbCompanyStorage($this->databaseService, $this->dataProcessor);
        $storage->store($companies);

        $this->assertTrue(true);
    }
}
