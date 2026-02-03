<?php

namespace App\Tests\Unit\Config\Api;

use App\Config\Api\DataImportRegistry;
use App\Config\Api\IGDB\IgdbGenreDefinition;
use App\Config\Api\IGDB\IgdbGameDefinition;
use PHPUnit\Framework\TestCase;

class DataImportRegistryTest extends TestCase
{
    private DataImportRegistry $registry;

    protected function setUp(): void
    {
        $this->registry = new DataImportRegistry('IGDB');
    }

    public function testCanCreateRegistry(): void
    {
        $this->assertInstanceOf(DataImportRegistry::class, $this->registry);
        $this->assertEquals('IGDB', $this->registry->getProviderName());
    }

    public function testCanRegisterDefinition(): void
    {
        $definition = new IgdbGenreDefinition();
        $this->registry->register($definition);

        $this->assertTrue($this->registry->has('igdb_genres'));
        $this->assertInstanceOf(IgdbGenreDefinition::class, $this->registry->get('igdb_genres'));
    }

    public function testCanRegisterMultipleDefinitions(): void
    {
        $genreDefinition = new IgdbGenreDefinition();
        $gameDefinition = new IgdbGameDefinition();

        $this->registry
            ->register($genreDefinition)
            ->register($gameDefinition);

        $this->assertTrue($this->registry->has('igdb_genres'));
        $this->assertTrue($this->registry->has('igdb_games'));
        $this->assertEquals(2, $this->registry->count());
    }

    public function testCanUnregisterDefinition(): void
    {
        $definition = new IgdbGenreDefinition();
        $this->registry->register($definition);
        $this->assertTrue($this->registry->has('igdb_genres'));

        $this->registry->unregister('igdb_genres');
        $this->assertFalse($this->registry->has('igdb_genres'));
    }

    public function testGetAllDefinitions(): void
    {
        $genreDefinition = new IgdbGenreDefinition();
        $gameDefinition = new IgdbGameDefinition();

        $this->registry
            ->register($genreDefinition)
            ->register($gameDefinition);

        $all = $this->registry->all();
        $this->assertCount(2, $all);
        $this->assertArrayHasKey('igdb_genres', $all);
        $this->assertArrayHasKey('igdb_games', $all);
    }

    public function testGetKeys(): void
    {
        $this->registry
            ->register(new IgdbGenreDefinition())
            ->register(new IgdbGameDefinition());

        $keys = $this->registry->getKeys();
        $this->assertEquals(['igdb_genres', 'igdb_games'], $keys);
    }

    public function testGetReturnsNullForNonExistentKey(): void
    {
        $result = $this->registry->get('non_existent');
        $this->assertNull($result);
    }

    public function testSupportsFluentInterface(): void
    {
        $result = $this->registry
            ->register(new IgdbGenreDefinition())
            ->register(new IgdbGameDefinition());

        $this->assertInstanceOf(DataImportRegistry::class, $result);
        $this->assertEquals(2, $this->registry->count());
    }
}
