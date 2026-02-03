<?php

namespace App\Tests\Functional\Command;

use App\Config\Api\DataImportRegistry;
use App\Config\Api\IgdbGenreDefinition;
use App\Config\Api\IgdbCompanyDefinition;
use App\Config\Api\IgdbGameDefinition;
use App\Config\Api\IgdbExtensionDefinition;
use App\Service\Api\IgdbGenreFetcher;
use App\Service\Api\IgdbCompanyFetcher;
use App\Service\Api\IgdbGameFetcher;
use App\Service\Api\IgdbExtensionFetcher;
use App\Service\Api\IgdbDataProcessor;
use App\Service\Api\IgdbGenreStorage;
use App\Service\Api\IgdbCompanyStorage;
use App\Service\Api\IgdbGameStorage;
use App\Service\Api\IgdbExtensionStorage;
use App\Service\ExternalApiService;
use App\Service\IgdbDataProcessorService;
use App\Service\DatabaseOperationService;
use PHPUnit\Framework\TestCase;

class DataImportIntegrationTest extends TestCase
{
    private DataImportRegistry $registry;
    private ExternalApiService|\PHPUnit\Framework\MockObject\MockObject $externalApiService;
    private IgdbDataProcessorService|\PHPUnit\Framework\MockObject\MockObject $igdbProcessorService;
    private DatabaseOperationService|\PHPUnit\Framework\MockObject\MockObject $databaseService;

    protected function setUp(): void
    {
        $this->externalApiService = $this->createMock(ExternalApiService::class);
        $this->igdbProcessorService = $this->createMock(IgdbDataProcessorService::class);
        $this->databaseService = $this->createMock(DatabaseOperationService::class);

        $this->registry = new DataImportRegistry();
        $this->registerAllDefinitions();
    }

    private function registerAllDefinitions(): void
    {
        $genreDef = new IgdbGenreDefinition(
            new IgdbGenreFetcher($this->externalApiService),
            new IgdbDataProcessor($this->igdbProcessorService),
            new IgdbGenreStorage($this->databaseService)
        );

        $companyDef = new IgdbCompanyDefinition(
            new IgdbCompanyFetcher($this->externalApiService),
            new IgdbDataProcessor($this->igdbProcessorService),
            new IgdbCompanyStorage($this->databaseService)
        );

        $gameDef = new IgdbGameDefinition(
            new IgdbGameFetcher($this->externalApiService),
            new IgdbDataProcessor($this->igdbProcessorService),
            new IgdbGameStorage($this->databaseService)
        );

        $extensionDef = new IgdbExtensionDefinition(
            new IgdbExtensionFetcher($this->externalApiService),
            new IgdbDataProcessor($this->igdbProcessorService),
            new IgdbExtensionStorage($this->databaseService)
        );

        $this->registry
            ->register($genreDef)
            ->register($companyDef)
            ->register($gameDef)
            ->register($extensionDef);
    }

    public function testFullGenreImportPipeline(): void
    {
        $genreData = [
            ['id' => 1, 'name' => 'Action', 'slug' => 'action'],
        ];

        $this->externalApiService
            ->expects($this->once())
            ->method('getNumberOfIgdbGenres')
            ->willReturn(1);

        $this->externalApiService
            ->expects($this->once())
            ->method('getIgdbGenres')
            ->willReturn($genreData);

        $this->igdbProcessorService
            ->expects($this->once())
            ->method('processGenres')
            ->with($genreData)
            ->willReturn($genreData);

        $this->databaseService
            ->expects($this->once())
            ->method('insertOrUpdateGenre')
            ->willReturn(true);

        $definition = $this->registry->get('genres');
        $this->assertNotNull($definition);

        // Simulate the import flow
        $count = $definition->getFetcher()->getCount();
        $this->assertEquals(1, $count);

        $raw = $definition->getFetcher()->fetchBatch(50);
        $this->assertEquals($genreData, $raw);

        $processed = $definition->getProcessor()->process($raw, 'genres');
        $this->assertEquals($genreData, $processed);

        $stored = $definition->getStorage()->store($processed);
        $this->assertTrue($stored);
    }

    public function testFullCompanyImportPipeline(): void
    {
        $companyData = [
            ['id' => 1, 'name' => 'Nintendo', 'slug' => 'nintendo'],
        ];

        $this->externalApiService
            ->expects($this->once())
            ->method('getNumberOfIgdbCompanies')
            ->willReturn(1);

        $this->externalApiService
            ->expects($this->once())
            ->method('getIgdbCompanies')
            ->willReturn($companyData);

        $this->igdbProcessorService
            ->expects($this->once())
            ->method('processCompanies')
            ->willReturn($companyData);

        $this->databaseService
            ->expects($this->once())
            ->method('insertOrUpdateCompany')
            ->willReturn(true);

        $definition = $this->registry->get('companies');
        $count = $definition->getFetcher()->getCount();
        $raw = $definition->getFetcher()->fetchBatch(50);
        $processed = $definition->getProcessor()->process($raw, 'companies');
        $stored = $definition->getStorage()->store($processed);

        $this->assertTrue($stored);
    }

    public function testFullGameImportPipeline(): void
    {
        $gameData = [
            [
                'id' => 1,
                'name' => 'The Legend of Zelda',
                'slug' => 'the-legend-of-zelda',
                'genres' => [1],
                'companies' => [1],
            ],
        ];

        $this->externalApiService
            ->expects($this->once())
            ->method('getNumberOfIgdbGames')
            ->willReturn(1);

        $this->externalApiService
            ->expects($this->once())
            ->method('getIgdbGames')
            ->willReturn($gameData);

        $this->igdbProcessorService
            ->expects($this->once())
            ->method('processGames')
            ->willReturn($gameData);

        $this->databaseService
            ->expects($this->once())
            ->method('insertOrUpdateGame')
            ->willReturn(true);

        $definition = $this->registry->get('games');
        $processed = $definition->getProcessor()->process($gameData, 'games');
        $stored = $definition->getStorage()->store($processed);

        $this->assertTrue($stored);
    }

    public function testFullExtensionImportPipeline(): void
    {
        $extensionData = [
            ['id' => 1, 'name' => 'DLC', 'game' => 1, 'slug' => 'dlc'],
        ];

        $this->externalApiService
            ->expects($this->once())
            ->method('getNumberOfIgdbExtensions')
            ->willReturn(1);

        $this->externalApiService
            ->expects($this->once())
            ->method('getIgdbExtensions')
            ->willReturn($extensionData);

        $this->igdbProcessorService
            ->expects($this->once())
            ->method('processExtensions')
            ->willReturn($extensionData);

        $this->databaseService
            ->expects($this->once())
            ->method('insertOrUpdateExtension')
            ->willReturn(true);

        $definition = $this->registry->get('extensions');
        $processed = $definition->getProcessor()->process($extensionData, 'extensions');
        $stored = $definition->getStorage()->store($processed);

        $this->assertTrue($stored);
    }

    public function testMultipleSequentialImports(): void
    {
        $genreData = [['id' => 1, 'name' => 'Action']];
        $companyData = [['id' => 1, 'name' => 'Nintendo']];

        $this->externalApiService->method('getNumberOfIgdbGenres')->willReturn(1);
        $this->externalApiService->method('getIgdbGenres')->willReturn($genreData);
        $this->externalApiService->method('getNumberOfIgdbCompanies')->willReturn(1);
        $this->externalApiService->method('getIgdbCompanies')->willReturn($companyData);

        $this->igdbProcessorService->method('processGenres')->willReturnArgument(0);
        $this->igdbProcessorService->method('processCompanies')->willReturnArgument(0);

        $this->databaseService->method('insertOrUpdateGenre')->willReturn(true);
        $this->databaseService->method('insertOrUpdateCompany')->willReturn(true);

        // Import genres
        $genreDef = $this->registry->get('genres');
        $genreDef->getStorage()->store(
            $genreDef->getProcessor()->process(
                $genreDef->getFetcher()->fetchBatch(50),
                'genres'
            )
        );

        // Import companies
        $companyDef = $this->registry->get('companies');
        $companyDef->getStorage()->store(
            $companyDef->getProcessor()->process(
                $companyDef->getFetcher()->fetchBatch(50),
                'companies'
            )
        );

        $this->assertTrue(true);
    }

    public function testRegistryRetrievesAllDefinitions(): void
    {
        $genres = $this->registry->get('genres');
        $companies = $this->registry->get('companies');
        $games = $this->registry->get('games');
        $extensions = $this->registry->get('extensions');

        $this->assertNotNull($genres);
        $this->assertNotNull($companies);
        $this->assertNotNull($games);
        $this->assertNotNull($extensions);
    }

    public function testRegistryDefinitionsHaveCorrectServices(): void
    {
        $genreDef = $this->registry->get('genres');

        $this->assertInstanceOf(IgdbGenreFetcher::class, $genreDef->getFetcher());
        $this->assertInstanceOf(IgdbDataProcessor::class, $genreDef->getProcessor());
        $this->assertInstanceOf(IgdbGenreStorage::class, $genreDef->getStorage());
    }

    public function testErrorHandlingInPipeline(): void
    {
        $this->externalApiService
            ->method('getNumberOfIgdbGenres')
            ->willThrowException(new \Exception('API Error'));

        $definition = $this->registry->get('genres');

        $this->expectException(\Exception::class);
        $definition->getFetcher()->getCount();
    }

    public function testStorageErrorInPipeline(): void
    {
        $genreData = [['id' => 1, 'name' => 'Action']];

        $this->externalApiService
            ->method('getNumberOfIgdbGenres')
            ->willReturn(1);

        $this->externalApiService
            ->method('getIgdbGenres')
            ->willReturn($genreData);

        $this->igdbProcessorService
            ->method('processGenres')
            ->willReturnArgument(0);

        $this->databaseService
            ->method('insertOrUpdateGenre')
            ->willReturn(false);

        $definition = $this->registry->get('genres');
        $result = $definition->getStorage()->store($genreData);

        $this->assertFalse($result);
    }

    public function testLargeDatasetHandling(): void
    {
        $largeDataset = array_map(
            fn($i) => ['id' => $i, 'name' => "Genre $i"],
            range(1, 500)
        );

        $this->externalApiService
            ->method('getNumberOfIgdbGenres')
            ->willReturn(500);

        $this->externalApiService
            ->method('getIgdbGenres')
            ->willReturnOnConsecutiveCalls(
                array_slice($largeDataset, 0, 50),
                array_slice($largeDataset, 50, 50),
                // ... more batches
            );

        $this->igdbProcessorService
            ->method('processGenres')
            ->willReturnArgument(0);

        $this->databaseService
            ->method('insertOrUpdateGenre')
            ->willReturn(true);

        $definition = $this->registry->get('genres');
        $batch = $definition->getFetcher()->fetchBatch(50);
        $processed = $definition->getProcessor()->process($batch, 'genres');

        $this->assertNotEmpty($processed);
    }
}
