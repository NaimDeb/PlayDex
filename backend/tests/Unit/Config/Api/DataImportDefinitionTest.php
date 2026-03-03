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
        $this->assertEquals('App\Service\Api\IgdbGenreFetcher', $definition->getDataFetcherServiceId());
        $this->assertEquals('App\Service\Processor\IgdbDataProcessor', $definition->getDataProcessorServiceId());
        $this->assertEquals('App\Service\Storage\IgdbGenreStorage', $definition->getDataStorageServiceId());
    }

    public function testIgdbCompanyDefinition(): void
    {
        $definition = new IgdbCompanyDefinition();

        $this->assertEquals('igdb_companies', $definition->getKey());
        $this->assertEquals('IGDB Companies', $definition->getName());
        $this->assertStringContainsString('companies', $definition->getDescription());
        $this->assertEquals('App\Service\Api\IgdbCompanyFetcher', $definition->getDataFetcherServiceId());
        $this->assertEquals('App\Service\Processor\IgdbDataProcessor', $definition->getDataProcessorServiceId());
        $this->assertEquals('App\Service\Storage\IgdbCompanyStorage', $definition->getDataStorageServiceId());
    }

    public function testIgdbGameDefinition(): void
    {
        $definition = new IgdbGameDefinition();

        $this->assertEquals('igdb_games', $definition->getKey());
        $this->assertEquals('IGDB Games', $definition->getName());
        $this->assertStringContainsString('games', $definition->getDescription());
        $this->assertEquals('App\Service\Api\IgdbGameFetcher', $definition->getDataFetcherServiceId());
        $this->assertEquals('App\Service\Processor\IgdbDataProcessor', $definition->getDataProcessorServiceId());
        $this->assertEquals('App\Service\Storage\IgdbGameStorage', $definition->getDataStorageServiceId());

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
        $this->assertEquals('App\Service\Api\IgdbExtensionFetcher', $definition->getDataFetcherServiceId());
        $this->assertEquals('App\Service\Processor\IgdbDataProcessor', $definition->getDataProcessorServiceId());
        $this->assertEquals('App\Service\Storage\IgdbExtensionStorage', $definition->getDataStorageServiceId());

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
