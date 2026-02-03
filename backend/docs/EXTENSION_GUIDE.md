# Extension Guide - How to Use the New Architecture

## Quick Start: Adding a New Data Type to IGDB

Let's say you want to add support for importing "Platforms" from IGDB.

### Step 1: Create the Definition

Create `src/Config/Api/IGDB/IgdbPlatformDefinition.php`:

```php
<?php

namespace App\Config\Api\IGDB;

use App\Config\Api\DataImportDefinition;

class IgdbPlatformDefinition extends DataImportDefinition
{
    public function getKey(): string
    {
        return 'igdb_platforms';
    }

    public function getName(): string
    {
        return 'IGDB Platforms';
    }

    public function getDescription(): string
    {
        return 'Fetches gaming platforms from IGDB and stores them in the database.';
    }

    public function getDataFetcherServiceId(): string
    {
        return 'app.api.igdb.platform_fetcher';
    }

    public function getDataProcessorServiceId(): string
    {
        return 'app.processor.igdb_data_processor';
    }

    public function getDataStorageServiceId(): string
    {
        return 'app.storage.igdb_platform_storage';
    }
}
```

### Step 2: Register Services

Add to `config/services.yaml`:

```yaml
services:
  app.config.igdb.platform_definition:
    class: App\Config\Api\IGDB\IgdbPlatformDefinition
    public: true

  app.api.igdb.platform_fetcher:
    class: App\Service\Api\IgdbPlatformFetcher
    arguments:
      - "@app.service.external_api"

  app.storage.igdb_platform_storage:
    class: App\Service\Storage\IgdbPlatformStorage
    arguments:
      - "@app.service.database_operations"
      - "@app.processor.igdb_data_processor"
```

And register in the IGDB registry:

```yaml
app.api.igdb.registry:
  class: App\Config\Api\DataImportRegistry
  arguments:
    - "IGDB"
  calls:
    - [register, ["@app.config.igdb.genre_definition"]]
    - [register, ["@app.config.igdb.company_definition"]]
    - [register, ["@app.config.igdb.game_definition"]]
    - [register, ["@app.config.igdb.extension_definition"]]
    - [register, ["@app.config.igdb.platform_definition"]] # ← Add this
```

### Step 3: Create the Fetcher

Create `src/Service/Api/IgdbPlatformFetcher.php`:

```php
<?php

namespace App\Service\Api;

use App\Interfaces\Api\DataFetcherInterface;
use App\Service\ExternalApiService;

class IgdbPlatformFetcher implements DataFetcherInterface
{
    private ExternalApiService $externalApiService;

    public function __construct(ExternalApiService $externalApiService)
    {
        $this->externalApiService = $externalApiService;
    }

    public function getCount(?int $from = null): int
    {
        return $this->externalApiService->getNumberOfIgdbPlatforms($from);
    }

    public function fetchBatch(int $limit, int $offset = 0, ?int $from = null): array
    {
        return $this->externalApiService->getIgdbPlatforms($limit, $offset, $from);
    }

    public function getSourceName(): string
    {
        return 'platforms';
    }

    public function getProviderName(): string
    {
        return 'IGDB';
    }
}
```

### Step 4: Create the Storage

Create `src/Service/Storage/IgdbPlatformStorage.php`:

```php
<?php

namespace App\Service\Storage;

use App\Interfaces\Api\DataStorageInterface;
use App\Service\DatabaseOperationService;
use App\Service\Processor\IgdbDataProcessor;

class IgdbPlatformStorage implements DataStorageInterface
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

        $sql = 'INSERT INTO platform (api_id, name)
                VALUES (:apiId, :name)
                ON DUPLICATE KEY UPDATE
                name = VALUES(name)';

        $stmt = $this->dbService->prepareInsertStatement($connection, $sql);

        $this->dbService->executeTransaction(
            $connection,
            $stmt,
            $data,
            [$this->processor, 'processPlatforms'],  // or your custom processor
            $progressBar
        );
    }

    public function getTableName(): string
    {
        return 'platform';
    }
}
```

### Step 5: Create Command (Optional)

Create `src/Command/GetPlatformsFromIgdbCommand.php`:

```php
<?php

namespace App\Command;

use App\Command\Base\AbstractDataImporterCommand;
use App\Config\Api\IGDB\IgdbPlatformDefinition;
use App\Config\Api\DataImportDefinition;
use App\Service\DatabaseOperationService;
use App\Service\ProgressBarHandlerService;
use Symfony\Component\Console\Attribute\AsCommand;
use Symfony\Component\DependencyInjection\ContainerInterface;

#[AsCommand(
    name: 'app:get-platforms-from-igdb',
    aliases: ['app:igdb:platforms'],
    description: 'Fetches the platforms from IGDB and stores them in the database.',
)]
class GetPlatformsFromIgdbCommand extends AbstractDataImporterCommand
{
    public function __construct(
        ProgressBarHandlerService $progressHandler,
        DatabaseOperationService $dbService,
        ContainerInterface $container
    ) {
        parent::__construct($progressHandler, $dbService, $container);
    }

    protected function getDataImportDefinition(): DataImportDefinition
    {
        return new IgdbPlatformDefinition();
    }
}
```

### Done! 🎉

Now you can:

```bash
# Run just platforms
php bin/console app:get-platforms-from-igdb

# Run all IGDB imports including platforms
php bin/console app:get-igdb-data

# Run only platforms (skip others)
php bin/console app:get-igdb-data --only igdb_platforms

# Run all except platforms
php bin/console app:get-igdb-data --skip igdb_platforms
```

---

## Advanced: Adding a New External API (Steam)

### Step 1: Create Registry

Create `src/Config/Api/Steam/SteamDataImportRegistry.php` OR register in services:

```yaml
app.api.steam.registry:
  class: App\Config\Api\DataImportRegistry
  arguments:
    - "Steam"
  calls:
    - [register, ["@app.config.steam.game_definition"]]
    - [register, ["@app.config.steam.review_definition"]]
```

### Step 2: Create Definitions

`src/Config/Api/Steam/SteamGameDefinition.php`:

```php
<?php

namespace App\Config\Api\Steam;

use App\Config\Api\DataImportDefinition;

class SteamGameDefinition extends DataImportDefinition
{
    public function getKey(): string { return 'steam_games'; }
    public function getName(): string { return 'Steam Games'; }
    public function getDescription(): string { return 'Fetches games from Steam API...'; }
    public function getDataFetcherServiceId(): string { return 'app.api.steam.game_fetcher'; }
    public function getDataProcessorServiceId(): string { return 'app.processor.steam_data_processor'; }
    public function getDataStorageServiceId(): string { return 'app.storage.steam_game_storage'; }
}
```

`src/Config/Api/Steam/SteamReviewDefinition.php`:

```php
<?php

namespace App\Config\Api\Steam;

use App\Config\Api\DataImportDefinition;

class SteamReviewDefinition extends DataImportDefinition
{
    public function getKey(): string { return 'steam_reviews'; }
    public function getName(): string { return 'Steam Reviews'; }
    public function getDescription(): string { return 'Fetches reviews from Steam API...'; }
    public function getDataFetcherServiceId(): string { return 'app.api.steam.review_fetcher'; }
    public function getDataProcessorServiceId(): string { return 'app.processor.steam_data_processor'; }
    public function getDataStorageServiceId(): string { return 'app.storage.steam_review_storage'; }
}
```

### Step 3: Create Services

```yaml
services:
  # Steam Client/API
  app.service.steam_client:
    class: App\Service\SteamApiClient
    arguments:
      - "%env(STEAM_API_KEY)%"

  # Steam Fetchers
  app.api.steam.game_fetcher:
    class: App\Service\Api\SteamGameFetcher
    arguments:
      - "@app.service.steam_client"

  app.api.steam.review_fetcher:
    class: App\Service\Api\SteamReviewFetcher
    arguments:
      - "@app.service.steam_client"

  # Steam Processor
  app.processor.steam_data_processor:
    class: App\Service\Processor\SteamDataProcessor

  # Steam Storage
  app.storage.steam_game_storage:
    class: App\Service\Storage\SteamGameStorage
    arguments:
      - "@app.service.database_operations"
      - "@app.processor.steam_data_processor"

  app.storage.steam_review_storage:
    class: App\Service\Storage\SteamReviewStorage
    arguments:
      - "@app.service.database_operations"
      - "@app.processor.steam_data_processor"
```

### Step 4: Create Fetchers

`src/Service/Api/SteamGameFetcher.php`:

```php
<?php

namespace App\Service\Api;

use App\Interfaces\Api\DataFetcherInterface;
use App\Service\SteamApiClient;

class SteamGameFetcher implements DataFetcherInterface
{
    private SteamApiClient $steamClient;

    public function __construct(SteamApiClient $steamClient)
    {
        $this->steamClient = $steamClient;
    }

    public function getCount(?int $from = null): int
    {
        return $this->steamClient->getTotalGameCount($from);
    }

    public function fetchBatch(int $limit, int $offset = 0, ?int $from = null): array
    {
        return $this->steamClient->getGames($limit, $offset, $from);
    }

    public function getSourceName(): string
    {
        return 'games';
    }

    public function getProviderName(): string
    {
        return 'Steam';
    }
}
```

### Step 5: Create Processor

`src/Service/Processor/SteamDataProcessor.php`:

```php
<?php

namespace App\Service\Processor;

use App\Interfaces\Api\DataProcessorInterface;

class SteamDataProcessor implements DataProcessorInterface
{
    public function processBatch(array $data): array
    {
        return array_map(fn($item) => [
            'steam_id' => $item['appid'],
            'name' => $item['name'],
            'price' => $item['price_overview']['final'] ?? null,
            'release_date' => $item['release_date']['date'] ?? null,
        ], $data);
    }

    public function getEntityName(): string
    {
        return 'SteamGame';
    }
}
```

### Step 6: Create Storage

`src/Service/Storage/SteamGameStorage.php`:

```php
<?php

namespace App\Service\Storage;

use App\Interfaces\Api\DataStorageInterface;
use App\Service\DatabaseOperationService;
use App\Service\Processor\SteamDataProcessor;

class SteamGameStorage implements DataStorageInterface
{
    private DatabaseOperationService $dbService;
    private SteamDataProcessor $processor;

    public function __construct(
        DatabaseOperationService $dbService,
        SteamDataProcessor $processor
    ) {
        $this->dbService = $dbService;
        $this->processor = $processor;
    }

    public function store(array $data, $progressBar = null): void
    {
        $this->dbService->setMemoryLimit();
        $connection = $this->dbService->getConnection();

        $sql = 'INSERT INTO steam_game (steam_id, name, price, release_date)
                VALUES (:steamId, :name, :price, :releaseDate)
                ON DUPLICATE KEY UPDATE
                name = VALUES(name),
                price = VALUES(price)';

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
        return 'steam_game';
    }
}
```

### Step 7: Create Orchestrator Command

`src/Command/GetSteamDataCommand.php`:

```php
<?php

namespace App\Command;

use App\Config\Api\DataImportRegistry;
use App\Entity\UpdateHistory;
use App\Repository\UpdateHistoryRepository;
use Symfony\Component\Console\Attribute\AsCommand;
use Symfony\Component\Console\Command\Command;
use Symfony\Component\Console\Input\ArrayInput;
use Symfony\Component\Console\Input\InputInterface;
use Symfony\Component\Console\Input\InputOption;
use Symfony\Component\Console\Output\OutputInterface;
use Symfony\Component\Console\Style\SymfonyStyle;

#[AsCommand(
    name: 'app:get-steam-data',
    description: 'Executes all Steam import commands in sequence',
)]
class GetSteamDataCommand extends Command
{
    private UpdateHistoryRepository $updateHistoryRepository;
    private DataImportRegistry $steamRegistry;

    public function __construct(
        UpdateHistoryRepository $updateHistoryRepository,
        DataImportRegistry $steamRegistry
    ) {
        parent::__construct();
        $this->updateHistoryRepository = $updateHistoryRepository;
        $this->steamRegistry = $steamRegistry;
    }

    protected function configure(): void
    {
        $this->setDescription('Executes all Steam import commands in sequence');
        $this->addOption('force', null, InputOption::VALUE_NONE, 'Force execution');
        $this->addOption('skip', null, InputOption::VALUE_OPTIONAL, 'Skip specific data types');
        $this->addOption('only', null, InputOption::VALUE_OPTIONAL, 'Run only specific data types');
    }

    protected function execute(InputInterface $input, OutputInterface $output): int
    {
        $io = new SymfonyStyle($input, $output);
        $io->title('Starting Steam Data Import Process');

        $latestUpdateDate = $this->updateHistoryRepository->getLatestUpdateDate();

        // Similar logic to GetIgdbDataCommand...
        // Build commands, execute them, etc.

        $updateHistory = new UpdateHistory();
        $entityManager = $this->updateHistoryRepository->getEntityManager();
        $entityManager->persist($updateHistory);
        $entityManager->flush();

        $io->success('All Steam import commands have been successfully executed!');
        return Command::SUCCESS;
    }
}
```

### Done! 🎉

Now you have Steam API support with the exact same architecture as IGDB:

```bash
php bin/console app:get-steam-data
php bin/console app:get-steam-data --only steam_games
php bin/console app:get-steam-data --skip steam_reviews
```

---

## Design Pattern Reminders

### When Adding Implementation Classes

✅ **DO:**

- Implement the appropriate interface (`DataFetcherInterface`, etc.)
- Use dependency injection for all dependencies
- Keep single responsibility
- Document special behavior in comments

❌ **DON'T:**

- Create hard dependencies between services
- Mix concerns (fetching + processing in same class)
- Hardcode configuration values
- Skip error handling

### When Adding Definitions

✅ **DO:**

- Extend `DataImportDefinition`
- Provide clear, descriptive names
- Use consistent service ID naming patterns
- Document any special options needed

❌ **DON'T:**

- Hardcode implementation logic
- Use inconsistent naming
- Reference concrete classes (use service IDs)
- Make definitions do more than describe

### When Modifying Commands

✅ **DO:**

- Override `getDataImportDefinition()` only
- Override `configureAdditionalOptions()` if needed special CLI options
- Override `validateAdditionalOptions()` for custom validation

❌ **DON'T:**

- Override `execute()` (use the base implementation)
- Add business logic to commands
- Create duplicate batch processing logic

---

## Troubleshooting

### "Service not found" Error

Make sure you registered the service ID in `services.yaml` and it matches the ID in your definition's getter methods.

### "DataFetcher returns wrong format"

Check that your fetcher returns an array of items. Each item should have at minimum an `id` field.

### Command not appearing in list

Ensure you added the `#[AsCommand(...)]` attribute and registered the command in `services.yaml` with `tags: ['console.command']`.

### Data not being stored

Check:

1. Database table exists
2. Column names match your SQL in storage class
3. Processor is returning correct format (keys matching SQL placeholders)

---

## Complete Example File Tree

Adding Steam API to the project:

```
src/
├── Command/
│   ├── GetSteamDataCommand.php          ← new
│   └── ... (existing IGDB commands)
│
├── Config/Api/
│   └── Steam/                            ← new directory
│       ├── SteamGameDefinition.php       ← new
│       └── SteamReviewDefinition.php     ← new
│
└── Service/
    ├── Api/
    │   ├── SteamGameFetcher.php          ← new
    │   ├── SteamReviewFetcher.php        ← new
    │   └── ... (existing IGDB fetchers)
    │
    ├── Processor/
    │   ├── SteamDataProcessor.php        ← new
    │   └── ... (existing processors)
    │
    └── Storage/
        ├── SteamGameStorage.php          ← new
        ├── SteamReviewStorage.php        ← new
        └── ... (existing storage classes)
```

That's all that's needed for full Steam API integration! 🚀
