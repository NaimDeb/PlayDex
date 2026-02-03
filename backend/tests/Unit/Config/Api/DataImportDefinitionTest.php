<?php

namespace App\Tests\Unit\Config\Api;

use App\Config\Api\IGDB\IgdbGenreDefinition;
use App\Config\Api\IGDB\IgdbGameDefinition;
use App\Config\Api\IGDB\IgdbCompanyDefinition;
use App\Config\Api\IGDB\IgdbExtensionDefinition;
use PHPUnit\Framework\TestCase;

class DataImportDefinitionTest extends TestCase
{
    public function testIgdbGenreDefinition(): void
    {
        $definition = new IgdbGenreDefinition();

        $this->assertEquals('igdb_genres', $definition->getKey());
        $this->assertEquals('IGDB Genres', $definition->getName());
        $this->assertStringContainsString('genres', $definition->getDescription());
        $this->assertEquals('app.api.igdb.genre_fetcher', $definition->getDataFetcherServiceId());
        $this->assertEquals('app.processor.igdb_data_processor', $definition->getDataProcessorServiceId());
        $this->assertEquals('app.storage.igdb_genre_storage', $definition->getDataStorageServiceId());
    }

    public function testIgdbCompanyDefinition(): void
    {
        $definition = new IgdbCompanyDefinition();

        $this->assertEquals('igdb_companies', $definition->getKey());
        $this->assertEquals('IGDB Companies', $definition->getName());
        $this->assertStringContainsString('companies', $definition->getDescription());
        $this->assertEquals('app.api.igdb.company_fetcher', $definition->getDataFetcherServiceId());
        $this->assertEquals('app.processor.igdb_data_processor', $definition->getDataProcessorServiceId());
        $this->assertEquals('app.storage.igdb_company_storage', $definition->getDataStorageServiceId());
    }

    public function testIgdbGameDefinition(): void
    {
        $definition = new IgdbGameDefinition();

        $this->assertEquals('igdb_games', $definition->getKey());
        $this->assertEquals('IGDB Games', $definition->getName());
        $this->assertStringContainsString('games', $definition->getDescription());
        $this->assertEquals('app.api.igdb.game_fetcher', $definition->getDataFetcherServiceId());
        $this->assertEquals('app.processor.igdb_data_processor', $definition->getDataProcessorServiceId());
        $this->assertEquals('app.storage.igdb_game_storage', $definition->getDataStorageServiceId());

        // Games definition has custom options
        $options = $definition->getConsoleOptions();
        $this->assertArrayHasKey('offset', $options);
        $this->assertArrayHasKey('fetchSize', $options);
    }

    public function testIgdbExtensionDefinition(): void
    {
        $definition = new IgdbExtensionDefinition();

        $this->assertEquals('igdb_extensions', $definition->getKey());
        $this->assertEquals('IGDB Extensions/DLCs', $definition->getName());
        $this->assertStringContainsString('extensions', $definition->getDescription());
        $this->assertEquals('app.api.igdb.extension_fetcher', $definition->getDataFetcherServiceId());
        $this->assertEquals('app.processor.igdb_data_processor', $definition->getDataProcessorServiceId());
        $this->assertEquals('app.storage.igdb_extension_storage', $definition->getDataStorageServiceId());

        // Extensions definition has custom options
        $options = $definition->getConsoleOptions();
        $this->assertArrayHasKey('offset', $options);
        $this->assertArrayHasKey('fetchSize', $options);
    }

    public function testGenreDefinitionHasNoCustomOptions(): void
    {
        $definition = new IgdbGenreDefinition();
        $options = $definition->getConsoleOptions();
        $this->assertEmpty($options);
    }
}
