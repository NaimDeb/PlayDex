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

        $processedData = [
            ['id' => 1, 'name' => 'Action', 'created_at' => 1609459200, 'processed' => true],
            ['id' => 2, 'name' => 'Adventure', 'created_at' => 1609459200, 'processed' => true],
        ];

        $this->igdbProcessorService
            ->expects($this->once())
            ->method('processGenres')
            ->with($rawData)
            ->willReturn($processedData);

        $result = $this->processor->process($rawData, 'genres');

        $this->assertEquals($processedData, $result);
        $this->assertCount(2, $result);
    }

    public function testProcessCompanyData(): void
    {
        $rawData = [
            ['id' => 1, 'name' => 'Nintendo', 'created_at' => 1609459200],
        ];

        $processedData = [
            ['id' => 1, 'name' => 'Nintendo', 'created_at' => 1609459200, 'processed' => true],
        ];

        $this->igdbProcessorService
            ->expects($this->once())
            ->method('processCompanies')
            ->with($rawData)
            ->willReturn($processedData);

        $result = $this->processor->process($rawData, 'companies');

        $this->assertEquals($processedData, $result);
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

        $processedData = [
            [
                'id' => 1,
                'name' => 'The Legend of Zelda',
                'created_at' => 1609459200,
                'genres' => [1, 2],
                'companies' => [1],
                'processed' => true,
            ],
        ];

        $this->igdbProcessorService
            ->expects($this->once())
            ->method('processGames')
            ->with($rawData)
            ->willReturn($processedData);

        $result = $this->processor->process($rawData, 'games');

        $this->assertEquals($processedData, $result);
    }

    public function testProcessExtensionData(): void
    {
        $rawData = [
            ['id' => 1, 'name' => 'DLC 1', 'game' => 1, 'created_at' => 1609459200],
        ];

        $processedData = [
            ['id' => 1, 'name' => 'DLC 1', 'game' => 1, 'created_at' => 1609459200, 'processed' => true],
        ];

        $this->igdbProcessorService
            ->expects($this->once())
            ->method('processExtensions')
            ->with($rawData)
            ->willReturn($processedData);

        $result = $this->processor->process($rawData, 'extensions');

        $this->assertEquals($processedData, $result);
    }

    public function testProcessEmptyData(): void
    {
        $rawData = [];

        $this->igdbProcessorService
            ->expects($this->once())
            ->method('processGenres')
            ->with([])
            ->willReturn([]);

        $result = $this->processor->process($rawData, 'genres');

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

        $this->igdbProcessorService
            ->expects($this->once())
            ->method('processGenres')
            ->willReturnArgument(0);

        $result = $this->processor->process($rawData, 'genres');

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

        $this->igdbProcessorService
            ->expects($this->once())
            ->method('processGenres')
            ->willReturnArgument(0);

        $this->processor->process($originalData, 'genres');

        $this->assertEquals($dataCopy, $originalData);
    }
}
