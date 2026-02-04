<?php

namespace App\Tests\Unit\Service\Api;

use App\Interfaces\Api\DataProcessorInterface;
use App\Service\Processor\IgdbDataProcessor;
use App\Service\IgdbDataProcessorService;
use PHPUnit\Framework\TestCase;

class IgdbDataProcessorTest extends TestCase
{
    private IgdbDataProcessorService|\PHPUnit\Framework\MockObject\MockObject $igdbProcessorService;
    private IgdbDataProcessor $processor;

    protected function setUp(): void
    {
        $this->igdbProcessorService = $this->createMock(IgdbDataProcessorService::class);
        $this->processor = new IgdbDataProcessor($this->igdbProcessorService);
    }

    public function testProcessorImplementsInterface(): void
    {
        $this->assertInstanceOf(DataProcessorInterface::class, $this->processor);
    }

    public function testProcessGenreData(): void
    {
        $rawData = [
            ['id' => 1, 'name' => 'Action', 'created_at' => 1609459200],
            ['id' => 2, 'name' => 'Adventure', 'created_at' => 1609459200],
        ];

        // processBatch just returns the data as-is
        $result = $this->processor->processBatch($rawData);

        $this->assertEquals($rawData, $result);
        $this->assertCount(2, $result);
    }

    public function testProcessCompanyData(): void
    {
        $rawData = [
            ['id' => 1, 'name' => 'Nintendo', 'created_at' => 1609459200],
        ];

        $result = $this->processor->processBatch($rawData);

        $this->assertEquals($rawData, $result);
    }

    public function testProcessGameData(): void
    {
        $rawData = [
            [
                'id' => 1,
                'name' => 'The Legend of Zelda',
                'created_at' => 1609459200,
                'genres' => [1, 2],
                'companies' => [1],
            ],
        ];

        $result = $this->processor->processBatch($rawData);

        $this->assertEquals($rawData, $result);
    }

    public function testProcessExtensionData(): void
    {
        $rawData = [
            ['id' => 1, 'name' => 'DLC 1', 'game' => 1, 'created_at' => 1609459200],
        ];

        $result = $this->processor->processBatch($rawData);

        $this->assertEquals($rawData, $result);
    }

    public function testProcessEmptyData(): void
    {
        $rawData = [];

        $result = $this->processor->processBatch($rawData);

        $this->assertIsArray($result);
        $this->assertEmpty($result);
    }

    public function testProcessorPreservesDataStructure(): void
    {
        $rawData = [
            [
                'id' => 123,
                'name' => 'Test Genre',
                'slug' => 'test-genre',
                'created_at' => 1609459200,
                'updated_at' => 1609459300,
            ],
        ];

        $result = $this->processor->processBatch($rawData);

        $this->assertArrayHasKey('id', $result[0]);
        $this->assertArrayHasKey('name', $result[0]);
        $this->assertEquals(123, $result[0]['id']);
        $this->assertEquals('Test Genre', $result[0]['name']);
    }

    public function testProcessorDoesNotModifySource(): void
    {
        $originalData = [
            ['id' => 1, 'name' => 'Action'],
        ];
        $dataCopy = $originalData;

        $this->processor->processBatch($originalData);

        $this->assertEquals($dataCopy, $originalData);
    }
}
