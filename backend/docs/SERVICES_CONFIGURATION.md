# Service Configuration Guide

This file explains how to configure the data import system in your `services.yaml` or service container.

## IGDB Registry Configuration

You need to register the `DataImportRegistry` and populate it with IGDB definitions:

```yaml
# config/services.yaml

services:
  # Base Registry for IGDB
  app.api.igdb.registry:
    class: App\Config\Api\DataImportRegistry
    arguments:
      - "IGDB"
    calls:
      - [register, ["@app.config.igdb.genre_definition"]]
      - [register, ["@app.config.igdb.company_definition"]]
      - [register, ["@app.config.igdb.game_definition"]]
      - [register, ["@app.config.igdb.extension_definition"]]

  # IGDB Data Type Definitions
  app.config.igdb.genre_definition:
    class: App\Config\Api\IGDB\IgdbGenreDefinition
    public: true

  app.config.igdb.company_definition:
    class: App\Config\Api\IGDB\IgdbCompanyDefinition
    public: true

  app.config.igdb.game_definition:
    class: App\Config\Api\IGDB\IgdbGameDefinition
    public: true

  app.config.igdb.extension_definition:
    class: App\Config\Api\IGDB\IgdbExtensionDefinition
    public: true

  # Commands - Dependency Injection
  App\Command\GetGenresFromIgdbCommand:
    arguments:
      - "@app.service.progress_handler"
      - "@app.service.database_operations"
      - "@service_container"
    tags:
      - "console.command"

  App\Command\GetCompaniesFromIgdbCommand:
    arguments:
      - "@app.service.progress_handler"
      - "@app.service.database_operations"
      - "@service_container"
    tags:
      - "console.command"

  App\Command\GetGamesFromIgdbCommand:
    arguments:
      - "@app.service.progress_handler"
      - "@app.service.database_operations"
      - "@service_container"
    tags:
      - "console.command"

  App\Command\GetExtensionsFromIgdbCommand:
    arguments:
      - "@app.service.progress_handler"
      - "@app.service.database_operations"
      - "@service_container"
    tags:
      - "console.command"

  # Orchestrator Command
  App\Command\GetIgdbDataCommand:
    arguments:
      - "@app.repository.update_history"
      - "@app.api.igdb.registry"
    tags:
      - "console.command"

  # Data Fetchers (implement DataFetcherInterface)
  app.api.igdb.genre_fetcher:
    class: App\Service\Api\IgdbGenreFetcher
    arguments:
      - "@app.service.external_api"
    # Add DataFetcherInterface if not explicit

  app.api.igdb.company_fetcher:
    class: App\Service\Api\IgdbCompanyFetcher
    arguments:
      - "@app.service.external_api"

  app.api.igdb.game_fetcher:
    class: App\Service\Api\IgdbGameFetcher
    arguments:
      - "@app.service.external_api"

  app.api.igdb.extension_fetcher:
    class: App\Service\Api\IgdbExtensionFetcher
    arguments:
      - "@app.service.external_api"

  # Data Processors (implement DataProcessorInterface)
  app.processor.igdb_data_processor:
    class: App\Service\Processor\IgdbDataProcessor
    # Shared processor for all IGDB types

  # Data Storage Handlers (implement DataStorageInterface)
  app.storage.igdb_genre_storage:
    class: App\Service\Storage\IgdbGenreStorage
    arguments:
      - "@app.service.database_operations"
      - "@app.processor.igdb_data_processor"

  app.storage.igdb_company_storage:
    class: App\Service\Storage\IgdbCompanyStorage
    arguments:
      - "@app.service.database_operations"
      - "@app.processor.igdb_data_processor"

  app.storage.igdb_game_storage:
    class: App\Service\Storage\IgdbGameStorage
    arguments:
      - "@app.service.database_operations"
      - "@app.processor.igdb_data_processor"

  app.storage.igdb_extension_storage:
    class: App\Service\Storage\IgdbExtensionStorage
    arguments:
      - "@app.service.database_operations"
      - "@app.processor.igdb_data_processor"
```

## Service Implementation Examples

### DataFetcher Implementation

```php
// src/Service/Api/IgdbGenreFetcher.php
namespace App\Service\Api;

use App\Interfaces\Api\DataFetcherInterface;
use App\Service\ExternalApiService;

class IgdbGenreFetcher implements DataFetcherInterface
{
    private ExternalApiService $externalApiService;

    public function __construct(ExternalApiService $externalApiService)
    {
        $this->externalApiService = $externalApiService;
    }

    public function getCount(?int $from = null): int
    {
        return $this->externalApiService->getNumberOfIgdbGenres($from);
    }

    public function fetchBatch(int $limit, int $offset = 0, ?int $from = null): array
    {
        return $this->externalApiService->getIgdbGenres($limit, $offset, $from);
    }

    public function getSourceName(): string
    {
        return 'genres';
    }

    public function getProviderName(): string
    {
        return 'IGDB';
    }
}
```

### DataProcessor Implementation

```php
// src/Service/Processor/IgdbDataProcessor.php
namespace App\Service\Processor;

use App\Interfaces\Api\DataProcessorInterface;

class IgdbDataProcessor implements DataProcessorInterface
{
    public function processBatch(array $data): array
    {
        // Transform raw API data to database format
        return array_map(fn($item) => [
            'api_id' => $item['id'],
            'name' => $item['name'],
        ], $data);
    }

    public function getEntityName(): string
    {
        return 'Genre';
    }
}
```

### DataStorage Implementation

```php
// src/Service/Storage/IgdbGenreStorage.php
namespace App\Service\Storage;

use App\Interfaces\Api\DataStorageInterface;
use App\Service\DatabaseOperationService;
use App\Service\Processor\IgdbDataProcessor;

class IgdbGenreStorage implements DataStorageInterface
{
    private DatabaseOperationService $dbService;
    private IgdbDataProcessor $processor;

    public function __construct(
        DatabaseOperationService $dbService,
        IgdbDataProcessor $processor
    ) {
        $this->dbService = $dbService;
        $this->processor = $processor;
    }

    public function store(array $data, $progressBar = null): void
    {
        $this->dbService->setMemoryLimit();
        $connection = $this->dbService->getConnection();

        $sql = 'INSERT INTO genre (api_id, name)
                VALUES (:apiId, :name)
                ON DUPLICATE KEY UPDATE
                name = VALUES(name)';

        $stmt = $this->dbService->prepareInsertStatement($connection, $sql);

        $this->dbService->executeTransaction(
            $connection,
            $stmt,
            $data,
            [$this->processor, 'processBatch'],
            $progressBar
        );
    }

    public function getTableName(): string
    {
        return 'genre';
    }
}
```

## Adding Services for a New External API (e.g., Steam)

```yaml
services:
  # Steam Registry
  app.api.steam.registry:
    class: App\Config\Api\DataImportRegistry
    arguments:
      - "Steam"
    calls:
      - [register, ["@app.config.steam.game_definition"]]
      - [register, ["@app.config.steam.review_definition"]]

  # Steam Data Type Definitions
  app.config.steam.game_definition:
    class: App\Config\Api\Steam\SteamGameDefinition
    public: true

  app.config.steam.review_definition:
    class: App\Config\Api\Steam\SteamReviewDefinition
    public: true

  # Steam Data Fetchers
  app.api.steam.game_fetcher:
    class: App\Service\Api\SteamGameFetcher
    arguments:
      - "@app.service.steam_client"

  app.api.steam.review_fetcher:
    class: App\Service\Api\SteamReviewFetcher
    arguments:
      - "@app.service.steam_client"

  # Steam Data Processor
  app.processor.steam_data_processor:
    class: App\Service\Processor\SteamDataProcessor

  # Steam Storage Handlers
  app.storage.steam_game_storage:
    class: App\Service\Storage\SteamGameStorage
    arguments:
      - "@app.service.database_operations"
      - "@app.processor.steam_data_processor"

  # Steam Orchestrator Command
  App\Command\GetSteamDataCommand:
    arguments:
      - "@app.repository.update_history"
      - "@app.api.steam.registry"
    tags:
      - "console.command"
```

## Environment-Specific Configuration

If you need different fetchers for different environments:

```yaml
services:
  app.api.igdb.genre_fetcher:
    class: '%env(IGDB_FETCHER_CLASS|default:App\Service\Api\IgdbGenreFetcher)%'
    arguments:
      - "@app.service.external_api"
```

## Testing Configuration

For unit tests, use a mock registry:

```php
// tests/Unit/Command/GetGenresFromIgdbCommandTest.php
public function setUp(): void
{
    $registry = new DataImportRegistry('IGDB');
    $registry->register(new IgdbGenreDefinition());

    $this->command = new GetGenresFromIgdbCommand(
        $this->progressHandler,
        $this->dbService,
        $this->createMockContainer($registry)
    );
}
```

## Notes

- The `ContainerInterface` is passed to commands to lazily resolve services at runtime
- Service IDs follow the pattern: `app.{component}.{provider}.{entity}`
- All fetchers, processors, and storage classes must implement their respective interfaces
- The registry pattern allows adding/removing data types without code changes
