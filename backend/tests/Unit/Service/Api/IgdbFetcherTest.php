<?php

namespace App\Tests\Unit\Service\Api;

use App\Interfaces\Api\DataFetcherInterface;
use App\Service\Api\IgdbGenreFetcher;
use App\Service\Api\IgdbCompanyFetcher;
use App\Service\Api\IgdbGameFetcher;
use App\Service\Api\IgdbExtensionFetcher;
use App\Service\ExternalApiService;
use PHPUnit\Framework\TestCase;

class IgdbFetcherTest extends TestCase
{
    private ExternalApiService|\PHPUnit\Framework\MockObject\MockObject $externalApiService;

    protected function setUp(): void
    {
        $this->externalApiService = $this->createMock(ExternalApiService::class);
    }

    public function testIgdbGenreFetcherImplementsInterface(): void
    {
        $fetcher = new IgdbGenreFetcher($this->externalApiService);
        $this->assertInstanceOf(DataFetcherInterface::class, $fetcher);
    }

    public function testIgdbGenreFetcherGetsCount(): void
    {
        $this->externalApiService
            ->expects($this->once())
            ->method('getNumberOfIgdbGenres')
            ->with(null)
            ->willReturn(42);

        $fetcher = new IgdbGenreFetcher($this->externalApiService);
        $count = $fetcher->getCount();

        $this->assertEquals(42, $count);
    }

    public function testIgdbGenreFetcherFetchesBatch(): void
    {
        $mockData = [['id' => 1, 'name' => 'Action']];

        $this->externalApiService
            ->expects($this->once())
            ->method('getIgdbGenres')
            ->with(500, 0, null)
            ->willReturn($mockData);

        $fetcher = new IgdbGenreFetcher($this->externalApiService);
        $data = $fetcher->fetchBatch(500);

        $this->assertEquals($mockData, $data);
    }

    public function testIgdbGenreFetcherSourceName(): void
    {
        $fetcher = new IgdbGenreFetcher($this->externalApiService);
        $this->assertEquals('genres', $fetcher->getSourceName());
    }

    public function testIgdbGenreFetcherProviderName(): void
    {
        $fetcher = new IgdbGenreFetcher($this->externalApiService);
        $this->assertEquals('IGDB', $fetcher->getProviderName());
    }

    public function testIgdbCompanyFetcherSourceName(): void
    {
        $fetcher = new IgdbCompanyFetcher($this->externalApiService);
        $this->assertEquals('companies', $fetcher->getSourceName());
    }

    public function testIgdbGameFetcherSourceName(): void
    {
        $fetcher = new IgdbGameFetcher($this->externalApiService);
        $this->assertEquals('games', $fetcher->getSourceName());
    }

    public function testIgdbExtensionFetcherSourceName(): void
    {
        $fetcher = new IgdbExtensionFetcher($this->externalApiService);
        $this->assertEquals('extensions', $fetcher->getSourceName());
    }

    public function testFetcherWithFromTimestamp(): void
    {
        $timestamp = 1704067200; // Jan 1, 2024

        $this->externalApiService
            ->expects($this->once())
            ->method('getNumberOfIgdbGenres')
            ->with($timestamp)
            ->willReturn(10);

        $fetcher = new IgdbGenreFetcher($this->externalApiService);
        $count = $fetcher->getCount($timestamp);

        $this->assertEquals(10, $count);
    }

    public function testFetcherWithOffset(): void
    {
        $mockData = [['id' => 501, 'name' => 'Strategy']];

        $this->externalApiService
            ->expects($this->once())
            ->method('getIgdbGenres')
            ->with(500, 500, null)
            ->willReturn($mockData);

        $fetcher = new IgdbGenreFetcher($this->externalApiService);
        $data = $fetcher->fetchBatch(500, 500);

        $this->assertEquals($mockData, $data);
    }
}
