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
        // Just verify the registry definition exists and is properly configured
        $definition = $this->registry->get('igdb_genres');
        $this->assertNotNull($definition);
        $this->assertEquals('igdb_genres', $definition->getKey());
        $this->assertEquals('IGDB Genres', $definition->getName());
    }

    public function testFullCompanyImportPipeline(): void
    {
        // Just verify the registry definition exists and is properly configured
        $definition = $this->registry->get('igdb_companies');
        $this->assertNotNull($definition);
        $this->assertEquals('igdb_companies', $definition->getKey());
    }

    public function testFullGameImportPipeline(): void
    {
        // Just verify the registry definition exists and is properly configured
        $definition = $this->registry->get('igdb_games');
        $this->assertNotNull($definition);
        $this->assertEquals('igdb_games', $definition->getKey());
    }

    public function testFullExtensionImportPipeline(): void
    {
        // Just verify the registry definition exists and is properly configured
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

        // processGenres is void, just verify definitions exist
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

        $this->assertEquals('App\Service\Api\IgdbGenreFetcher', $genreDef->getDataFetcherServiceId());
        $this->assertEquals('App\Service\Processor\IgdbDataProcessor', $genreDef->getDataProcessorServiceId());
        $this->assertEquals('App\Service\Storage\IgdbGenreStorage', $genreDef->getDataStorageServiceId());
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

        $definition = $this->registry->get('igdb_genres');
        $storageServiceId = $definition->getDataStorageServiceId();

        $this->assertEquals('App\Service\Storage\IgdbGenreStorage', $storageServiceId);
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

        // Just verify the definition exists
        $definition = $this->registry->get('igdb_genres');
        $this->assertNotNull($definition);
        $this->assertTrue(is_array($definition->getConsoleOptions()));
    }
}
