<?php

declare(strict_types=1);

namespace App\Tests\Unit\Config\Api;

use App\Config\Api\DataImportDefinition;
use App\Config\Api\IGDB\IgdbCompanyDefinition;
use App\Config\Api\IGDB\IgdbExtensionDefinition;
use App\Config\Api\IGDB\IgdbGameDefinition;
use App\Config\Api\IGDB\IgdbGenreDefinition;
use App\Interfaces\Api\DataFetcherInterface;
use App\Interfaces\Api\DataProcessorInterface;
use App\Interfaces\Api\DataStorageInterface;
use PHPUnit\Framework\TestCase;

/**
 * Vérifie la cohérence du câblage de l'import IGDB.
 *
 * Chaque définition déclare 3 services (fetcher/processor/storage) par leur ID
 * (= nom de classe). Si une classe est renommée/déplacée ou n'implémente plus
 * la bonne interface, l'import casse à l'exécution. Ce test l'attrape en amont,
 * sans base de données ni conteneur — donc rapide et stable.
 *
 * @return DataImportDefinition[]
 */
class IgdbImportConfigurationTest extends TestCase
{
    /** @return array<string, DataImportDefinition> */
    private function definitions(): array
    {
        return [
            'genres' => new IgdbGenreDefinition(),
            'companies' => new IgdbCompanyDefinition(),
            'games' => new IgdbGameDefinition(),
            'extensions' => new IgdbExtensionDefinition(),
        ];
    }

    public function testDefinitionsHaveMetadata(): void
    {
        foreach ($this->definitions() as $def) {
            $this->assertNotEmpty($def->getKey(), 'getKey() ne doit pas être vide');
            $this->assertNotEmpty($def->getName(), 'getName() ne doit pas être vide');
            $this->assertNotEmpty($def->getDescription(), 'getDescription() ne doit pas être vide');
        }
    }

    public function testKeysAreUnique(): void
    {
        $keys = array_map(static fn (DataImportDefinition $d) => $d->getKey(), $this->definitions());
        $this->assertSame($keys, array_unique($keys), 'Les clés des définitions doivent être uniques');
    }

    public function testFetcherServiceClassesExistAndImplementInterface(): void
    {
        foreach ($this->definitions() as $type => $def) {
            $class = $def->getDataFetcherServiceId();
            $this->assertTrue(class_exists($class), "Fetcher introuvable pour {$type}: {$class}");
            $this->assertTrue(
                is_subclass_of($class, DataFetcherInterface::class),
                "{$class} doit implémenter DataFetcherInterface"
            );
        }
    }

    public function testProcessorServiceClassesExistAndImplementInterface(): void
    {
        foreach ($this->definitions() as $type => $def) {
            $class = $def->getDataProcessorServiceId();
            $this->assertTrue(class_exists($class), "Processor introuvable pour {$type}: {$class}");
            $this->assertTrue(
                is_subclass_of($class, DataProcessorInterface::class),
                "{$class} doit implémenter DataProcessorInterface"
            );
        }
    }

    public function testStorageServiceClassesExistAndImplementInterface(): void
    {
        foreach ($this->definitions() as $type => $def) {
            $class = $def->getDataStorageServiceId();
            $this->assertTrue(class_exists($class), "Storage introuvable pour {$type}: {$class}");
            $this->assertTrue(
                is_subclass_of($class, DataStorageInterface::class),
                "{$class} doit implémenter DataStorageInterface"
            );
        }
    }
}
