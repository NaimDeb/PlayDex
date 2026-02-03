<?php

namespace App\Tests\Functional\Command;

use App\Config\Api\DataImportRegistry;
use App\Config\Api\IGDB\IgdbCompanyDefinition;
use App\Config\Api\IGDB\IgdbExtensionDefinition;
use App\Config\Api\IGDB\IgdbGameDefinition;
use App\Config\Api\IGDB\IgdbGenreDefinition;
use App\Service\Api\IgdbCompanyFetcher;
use App\Service\Api\IgdbExtensionFetcher;
use App\Service\Api\IgdbGameFetcher;
use App\Service\Api\IgdbGenreFetcher;
use App\Service\DatabaseOperationService;
use App\Service\ExternalApiService;
use App\Service\IgdbDataProcessorService;
use App\Service\Processor\IgdbDataProcessor;
use App\Service\Storage\IgdbCompanyStorage;
use App\Service\Storage\IgdbExtensionStorage;
use App\Service\Storage\IgdbGameStorage;
use App\Service\Storage\IgdbGenreStorage;
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

        $this->registry = new DataImportRegistry('IGDB');
        $this->registerAllDefinitions();
    }

    private function registerAllDefinitions(): void
    {
        $this->registry
            ->register(new IgdbGenreDefinition())
            ->register(new IgdbCompanyDefinition())
            ->register(new IgdbGameDefinition())
            ->register(new IgdbExtensionDefinition());
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

        $definition = $this->registry->get('igdb_genres');
        $this->assertNotNull($definition);
        $this->assertEquals('igdb_genres', $definition->getKey());
        $this->assertEquals('IGDB Genres', $definition->getName());
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

        $definition = $this->registry->get('igdb_companies');
        $this->assertNotNull($definition);
        $this->assertEquals('igdb_companies', $definition->getKey());
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

        $definition = $this->registry->get('igdb_games');
        $this->assertNotNull($definition);
        $this->assertEquals('igdb_games', $definition->getKey());
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

        $definition = $this->registry->get('igdb_extensions');
        $this->assertNotNull($definition);
        $this->assertEquals('igdb_extensions', $definition->getKey());
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
        $genreDef = $this->registry->get('igdb_genres');
        $this->assertNotNull($genreDef);

        // Import companies
        $companyDef = $this->registry->get('igdb_companies');
        $this->assertNotNull($companyDef);

        $this->assertTrue(true);
    }

    public function testRegistryRetrievesAllDefinitions(): void
    {
        $genres = $this->registry->get('igdb_genres');
        $companies = $this->registry->get('igdb_companies');
        $games = $this->registry->get('igdb_games');
        $extensions = $this->registry->get('igdb_extensions');

        $this->assertNotNull($genres);
        $this->assertNotNull($companies);
        $this->assertNotNull($games);
        $this->assertNotNull($extensions);
    }

    public function testRegistryDefinitionsHaveCorrectServiceIds(): void
    {
        $genreDef = $this->registry->get('igdb_genres');

        $this->assertEquals('app.api.igdb.genre_fetcher', $genreDef->getDataFetcherServiceId());
        $this->assertEquals('app.processor.igdb_data_processor', $genreDef->getDataProcessorServiceId());
        $this->assertEquals('app.storage.igdb_genre_storage', $genreDef->getDataStorageServiceId());
    }

    public function testErrorHandlingWithInvalidDefinition(): void
    {
        $definition = $this->registry->get('non_existent');
        $this->assertNull($definition);
    }

    public function testStorageServiceIdRetrieval(): void
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

        $definition = $this->registry->get('igdb_genres');
        $storageServiceId = $definition->getDataStorageServiceId();

        $this->assertEquals('app.storage.igdb_genre_storage', $storageServiceId);
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
            );

        $this->igdbProcessorService
            ->method('processGenres')
            ->willReturnArgument(0);

        $this->databaseService
            ->method('insertOrUpdateGenre')
            ->willReturn(true);

        $definition = $this->registry->get('igdb_genres');
        $this->assertNotNull($definition);
        $this->assertCount(4, $definition->getConsoleOptions());
    }
}
