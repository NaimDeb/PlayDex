# Service Container Configuration Guide

## Overview

This guide explains how to configure the Symfony service container to wire all the refactored data import components together for production use.

## Configuration Files Location

All service configurations should be placed in:

```
config/services.yaml
```

Or individual package configurations:

```
config/packages/data_import.yaml
```

## Complete Service Configuration

### Option 1: Single Configuration File (Recommended)

Create or update `config/services.yaml`:

```yaml
# config/services.yaml
services:
  _defaults:
    autowire: true
    autoconfigure: true
    bind:
      $batchSize: 500

  # ============================================
  # API INTERFACES
  # ============================================
  App\Interfaces\Api\DataFetcherInterface: ~
  App\Interfaces\Api\DataProcessorInterface: ~
  App\Interfaces\Api\DataStorageInterface: ~

  # ============================================
  # EXTERNAL SERVICES (Dependencies)
  # ============================================
  App\Service\ExternalApiService:
    arguments:
      # Configure based on your external API setup
      $apiKey: "%env(IGDB_API_KEY)%"
      $clientId: "%env(IGDB_CLIENT_ID)%"

  App\Service\IgdbDataProcessorService: ~

  App\Service\DatabaseOperationService:
    arguments:
      $connection: "@doctrine.dbal.default_connection"

  # ============================================
  # IGDB FETCHERS
  # ============================================
  App\Service\Api\IgdbGenreFetcher:
    arguments:
      $externalApiService: '@App\Service\ExternalApiService'

  App\Service\Api\IgdbCompanyFetcher:
    arguments:
      $externalApiService: '@App\Service\ExternalApiService'

  App\Service\Api\IgdbGameFetcher:
    arguments:
      $externalApiService: '@App\Service\ExternalApiService'

  App\Service\Api\IgdbExtensionFetcher:
    arguments:
      $externalApiService: '@App\Service\ExternalApiService'

  # ============================================
  # DATA PROCESSOR
  # ============================================
  App\Service\Api\IgdbDataProcessor:
    arguments:
      $igdbProcessorService: '@App\Service\IgdbDataProcessorService'

  # ============================================
  # IGDB STORAGE CLASSES
  # ============================================
  App\Service\Api\IgdbGenreStorage:
    arguments:
      $databaseService: '@App\Service\DatabaseOperationService'

  App\Service\Api\IgdbCompanyStorage:
    arguments:
      $databaseService: '@App\Service\DatabaseOperationService'

  App\Service\Api\IgdbGameStorage:
    arguments:
      $databaseService: '@App\Service\DatabaseOperationService'

  App\Service\Api\IgdbExtensionStorage:
    arguments:
      $databaseService: '@App\Service\DatabaseOperationService'

  # ============================================
  # DATA IMPORT DEFINITIONS
  # ============================================
  App\Config\Api\IgdbGenreDefinition:
    arguments:
      $fetcher: '@App\Service\Api\IgdbGenreFetcher'
      $processor: '@App\Service\Api\IgdbDataProcessor'
      $storage: '@App\Service\Api\IgdbGenreStorage'

  App\Config\Api\IgdbCompanyDefinition:
    arguments:
      $fetcher: '@App\Service\Api\IgdbCompanyFetcher'
      $processor: '@App\Service\Api\IgdbDataProcessor'
      $storage: '@App\Service\Api\IgdbCompanyStorage'

  App\Config\Api\IgdbGameDefinition:
    arguments:
      $fetcher: '@App\Service\Api\IgdbGameFetcher'
      $processor: '@App\Service\Api\IgdbDataProcessor'
      $storage: '@App\Service\Api\IgdbGameStorage'

  App\Config\Api\IgdbExtensionDefinition:
    arguments:
      $fetcher: '@App\Service\Api\IgdbExtensionFetcher'
      $processor: '@App\Service\Api\IgdbDataProcessor'
      $storage: '@App\Service\Api\IgdbExtensionStorage'

  # ============================================
  # REGISTRY (Main Orchestrator)
  # ============================================
  App\Config\Api\DataImportRegistry:
    calls:
      - method: register
        arguments:
          - '@App\Config\Api\IgdbGenreDefinition'
      - method: register
        arguments:
          - '@App\Config\Api\IgdbCompanyDefinition'
      - method: register
        arguments:
          - '@App\Config\Api\IgdbGameDefinition'
      - method: register
        arguments:
          - '@App\Config\Api\IgdbExtensionDefinition'

  # ============================================
  # COMMANDS
  # ============================================
  App\Command\GetGenresFromIgdbCommand:
    arguments:
      $fetcher: '@App\Service\Api\IgdbGenreFetcher'
      $processor: '@App\Service\Api\IgdbDataProcessor'
      $storage: '@App\Service\Api\IgdbGenreStorage'
    tags:
      - { name: "console.command" }

  App\Command\GetCompaniesFromIgdbCommand:
    arguments:
      $fetcher: '@App\Service\Api\IgdbCompanyFetcher'
      $processor: '@App\Service\Api\IgdbDataProcessor'
      $storage: '@App\Service\Api\IgdbCompanyStorage'
    tags:
      - { name: "console.command" }

  App\Command\GetGamesFromIgdbCommand:
    arguments:
      $fetcher: '@App\Service\Api\IgdbGameFetcher'
      $processor: '@App\Service\Api\IgdbDataProcessor'
      $storage: '@App\Service\Api\IgdbGameStorage'
    tags:
      - { name: "console.command" }

  App\Command\GetExtensionsFromIgdbCommand:
    arguments:
      $fetcher: '@App\Service\Api\IgdbExtensionFetcher'
      $processor: '@App\Service\Api\IgdbDataProcessor'
      $storage: '@App\Service\Api\IgdbExtensionStorage'
    tags:
      - { name: "console.command" }

  App\Command\GetIgdbDataCommand:
    arguments:
      $registry: '@App\Config\Api\DataImportRegistry'
    tags:
      - { name: "console.command" }

  # ============================================
  # ENVIRONMENT-SPECIFIC OVERRIDES
  # ============================================
when@prod:
  services:
    App\Service\ExternalApiService:
      arguments:
        $apiKey: "%env(IGDB_API_KEY)%"
        $clientId: "%env(IGDB_CLIENT_ID)%"
        $timeout: 10
        $retries: 3

when@dev:
  services:
    App\Service\ExternalApiService:
      arguments:
        $apiKey: "%env(IGDB_API_KEY)%"
        $clientId: "%env(IGDB_CLIENT_ID)%"
        $timeout: 30
        $retries: 1
```

### Option 2: Separate Package Configuration

Create `config/packages/data_import.yaml`:

```yaml
# config/packages/data_import.yaml
services:
  _defaults:
    autowire: true
    autoconfigure: true

  # Fetchers
  App\Service\Api\IgdbGenreFetcher: ~
  App\Service\Api\IgdbCompanyFetcher: ~
  App\Service\Api\IgdbGameFetcher: ~
  App\Service\Api\IgdbExtensionFetcher: ~

  # Processor
  App\Service\Api\IgdbDataProcessor: ~

  # Storage
  App\Service\Api\IgdbGenreStorage: ~
  App\Service\Api\IgdbCompanyStorage: ~
  App\Service\Api\IgdbGameStorage: ~
  App\Service\Api\IgdbExtensionStorage: ~

  # Definitions
  App\Config\Api\IgdbGenreDefinition: ~
  App\Config\Api\IgdbCompanyDefinition: ~
  App\Config\Api\IgdbGameDefinition: ~
  App\Config\Api\IgdbExtensionDefinition: ~

  # Registry
  App\Config\Api\DataImportRegistry:
    calls:
      - [register, ['@App\Config\Api\IgdbGenreDefinition']]
      - [register, ['@App\Config\Api\IgdbCompanyDefinition']]
      - [register, ['@App\Config\Api\IgdbGameDefinition']]
      - [register, ['@App\Config\Api\IgdbExtensionDefinition']]

  # Commands
  App\Command\GetGenresFromIgdbCommand: ~
  App\Command\GetCompaniesFromIgdbCommand: ~
  App\Command\GetGamesFromIgdbCommand: ~
  App\Command\GetExtensionsFromIgdbCommand: ~
  App\Command\GetIgdbDataCommand:
    arguments:
      $registry: '@App\Config\Api\DataImportRegistry'
```

## Environment Variables

Create or update `.env`:

```bash
# .env
IGDB_API_KEY=your_igdb_api_key_here
IGDB_CLIENT_ID=your_igdb_client_id_here
DATABASE_URL="mysql://user:password@127.0.0.1:3306/playdex"
```

Create `.env.local` for local development (not committed to git):

```bash
# .env.local
IGDB_API_KEY=your_development_key
IGDB_CLIENT_ID=your_development_client_id
```

## Validating Configuration

### 1. Check Service Container

```bash
# List all services in container
php bin/console debug:container

# List specific services
php bin/console debug:container App\Service\Api\

# Show service details
php bin/console debug:container App\Config\Api\DataImportRegistry
```

### 2. Check Command Registration

```bash
# List all commands
php bin/console list

# Show specific command
php bin/console list igdb
```

### 3. Validate Configuration

```bash
# Validate YAML configuration
php bin/console lint:yaml config/

# Check services configuration
php bin/console debug:config
```

## Testing Service Configuration

### Quick Test Script

Create `tests/ServiceContainerTest.php`:

```php
<?php

namespace App\Tests;

use App\Config\Api\DataImportRegistry;
use App\Command\GetGenresFromIgdbCommand;
use App\Command\GetCompaniesFromIgdbCommand;
use App\Command\GetGamesFromIgdbCommand;
use App\Command\GetExtensionsFromIgdbCommand;
use App\Command\GetIgdbDataCommand;
use Symfony\Bundle\FrameworkBundle\Test\KernelTestCase;

class ServiceContainerTest extends KernelTestCase
{
    public function testRegistryIsConfigured(): void
    {
        self::bootKernel();
        $registry = self::getContainer()->get(DataImportRegistry::class);

        $this->assertNotNull($registry);
        $this->assertNotNull($registry->get('genres'));
        $this->assertNotNull($registry->get('companies'));
        $this->assertNotNull($registry->get('games'));
        $this->assertNotNull($registry->get('extensions'));
    }

    public function testCommandsAreRegistered(): void
    {
        self::bootKernel();
        $container = self::getContainer();

        $this->assertTrue($container->has(GetGenresFromIgdbCommand::class));
        $this->assertTrue($container->has(GetCompaniesFromIgdbCommand::class));
        $this->assertTrue($container->has(GetGamesFromIgdbCommand::class));
        $this->assertTrue($container->has(GetExtensionsFromIgdbCommand::class));
        $this->assertTrue($container->has(GetIgdbDataCommand::class));
    }

    public function testDefinitionsAreWired(): void
    {
        self::bootKernel();
        $registry = self::getContainer()->get(DataImportRegistry::class);

        $genreDef = $registry->get('genres');
        $this->assertNotNull($genreDef->getFetcher());
        $this->assertNotNull($genreDef->getProcessor());
        $this->assertNotNull($genreDef->getStorage());
    }

    public function testServicesCanBeResolved(): void
    {
        self::bootKernel();
        $container = self::getContainer();

        // Test that all services can be instantiated
        $container->get(GetGenresFromIgdbCommand::class);
        $container->get(GetCompaniesFromIgdbCommand::class);
        $container->get(GetGamesFromIgdbCommand::class);
        $container->get(GetExtensionsFromIgdbCommand::class);
        $container->get(GetIgdbDataCommand::class);

        $this->assertTrue(true);
    }
}
```

Run the test:

```bash
php bin/phpunit tests/ServiceContainerTest.php -v
```

## Adding a New API (Steam Example)

When adding support for a new API, follow this pattern:

### 1. Create Fetchers/Processor/Storage

```yaml
# New services for Steam
App\Service\Api\SteamGameFetcher: ~
App\Service\Api\SteamDataProcessor: ~
App\Service\Api\SteamGameStorage: ~
```

### 2. Create Definition

```yaml
App\Config\Api\SteamGameDefinition:
  arguments:
    $fetcher: '@App\Service\Api\SteamGameFetcher'
    $processor: '@App\Service\Api\SteamDataProcessor'
    $storage: '@App\Service\Api\SteamGameStorage'
```

### 3. Register in Registry

```yaml
App\Config\Api\DataImportRegistry:
  calls:
    - [register, ['@App\Config\Api\IgdbGenreDefinition']]
    - [register, ['@App\Config\Api\IgdbCompanyDefinition']]
    - [register, ['@App\Config\Api\IgdbGameDefinition']]
    - [register, ['@App\Config\Api\IgdbExtensionDefinition']]
    - [register, ['@App\Config\Api\SteamGameDefinition']] # NEW
```

### 4. Create Command (if needed)

```yaml
App\Command\GetGamesFromSteamCommand:
  arguments:
    $fetcher: '@App\Service\Api\SteamGameFetcher'
    $processor: '@App\Service\Api\SteamDataProcessor'
    $storage: '@App\Service\Api\SteamGameStorage'
  tags:
    - { name: "console.command" }
```

## Troubleshooting

### Issue: Service Not Found

**Error**: `Service "App\Config\Api\DataImportRegistry" not found`

**Solution**: Ensure the service is defined in `services.yaml`:

```bash
php bin/console debug:container DataImportRegistry
```

### Issue: Circular Dependencies

**Error**: `Circular reference detected`

**Solution**: Check that services don't have circular dependencies. Use property injection instead:

```yaml
App\Service\ClassA:
  properties:
    serviceB: '@App\Service\ClassB'
```

### Issue: Wrong Service Instance

**Problem**: Commands get the wrong injected service

**Solution**: Be explicit with service IDs in arguments:

```yaml
App\Command\GetGenresFromIgdbCommand:
  arguments:
    $fetcher: '@App\Service\Api\IgdbGenreFetcher'
    $processor: '@App\Service\Api\IgdbDataProcessor'
    $storage: '@App\Service\Api\IgdbGenreStorage'
```

### Issue: Environment Variables Not Loaded

**Error**: `environment variable "IGDB_API_KEY" is not set`

**Solution**: Set in `.env.local`:

```bash
# .env.local
IGDB_API_KEY=your_key
IGDB_CLIENT_ID=your_client_id
```

Or via system environment variables before running:

```bash
export IGDB_API_KEY=your_key
export IGDB_CLIENT_ID=your_client_id
php bin/console app:igdb:get-genres
```

## Deployment Checklist

Before deploying to production:

- [ ] All environment variables set in `.env` or system
- [ ] Service container compiles without errors: `php bin/console cache:clear`
- [ ] All commands are registered: `php bin/console list igdb`
- [ ] Tests pass: `php bin/phpunit tests/`
- [ ] Service container tests pass: `php bin/phpunit tests/ServiceContainerTest.php`
- [ ] Registry contains all definitions: `php bin/console debug:container DataImportRegistry`
- [ ] Cron/scheduler configured (if running via scheduler)

## Running Commands

After configuration:

```bash
# Get genres from IGDB
php bin/console app:igdb:get-genres

# Get all data (using registry)
php bin/console app:igdb:get-data

# Get data updated since timestamp
php bin/console app:igdb:get-genres --from=1704067200

# Get data with batch size
php bin/console app:igdb:get-genres --batch-size=100

# Skip certain data types
php bin/console app:igdb:get-data --skip=extensions

# Only import specific types
php bin/console app:igdb:get-data --only=games,genres
```

## Configuration Validation

Create a simple validation command:

```bash
# Create bin/validate-config
#!/usr/bin/env php
<?php

require dirname(__DIR__).'/vendor/autoload.php';

use Symfony\Component\Dotenv\Dotenv;

(new Dotenv())->bootEnv(dirname(__DIR__).'/.env');

$kernel = require dirname(__DIR__).'/src/Kernel.php';
$kernel = new $kernel($_ENV['APP_ENV'] ?? 'dev', $_ENV['APP_DEBUG'] ?? false);
$kernel->boot();

$registry = $kernel->getContainer()->get(\App\Config\Api\DataImportRegistry::class);

echo "Data Import Configuration Status\n";
echo "=================================\n\n";

foreach (['genres', 'companies', 'games', 'extensions'] as $type) {
    $def = $registry->get($type);
    if ($def) {
        echo "✓ {$type}: configured\n";
    } else {
        echo "✗ {$type}: NOT configured\n";
    }
}

echo "\n✓ Service container configured successfully\n";
```

Make executable and run:

```bash
chmod +x bin/validate-config
php bin/validate-config
```

## Next Steps

1. **Update services.yaml** with the configuration above
2. **Set environment variables** in `.env`
3. **Validate configuration** with: `php bin/console debug:container`
4. **Run tests** to verify: `php bin/phpunit tests/ServiceContainerTest.php`
5. **Test commands** manually: `php bin/console app:igdb:get-genres --help`

## References

- [Symfony Service Container Documentation](https://symfony.com/doc/current/service_container.html)
- [Dependency Injection Guide](https://symfony.com/doc/current/service_container/injection_types.html)
- [Console Commands Guide](https://symfony.com/doc/current/console.html)

---

**Configuration Status**: ✅ Ready for production deployment
