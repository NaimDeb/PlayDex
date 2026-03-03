# Data Import Architecture - SOLID Design Refactoring

## Overview

The command folder has been refactored to follow SOLID principles and support multiple external APIs (not just IGDB) while making it easy to add or remove data types.

## Architecture Changes

### 1. **Interfaces (Dependency Inversion Principle)**

All components depend on abstractions, not concrete implementations:

- **`DataFetcherInterface`** - Defines contract for fetching data from any external API
- **`DataProcessorInterface`** - Defines contract for processing fetched data
- **`DataStorageInterface`** - Defines contract for storing data in the database

### 2. **Data Import Definitions (Open/Closed Principle)**

Data types are defined through configuration classes that describe what to import:

- **`DataImportDefinition`** - Abstract base class that defines a single data import type
- **`DataImportRegistry`** - Registry that manages all available data types for a provider

**To add a new data type:**

1. Create a new class extending `DataImportDefinition` (e.g., `IgdbPlatformDefinition`)
2. Register it in the service container
3. Add it to the IGDB registry
4. Done! No changes needed to command code

### 3. **IGDB-Specific Definitions**

Current IGDB data types:

- `IgdbGenreDefinition`
- `IgdbCompanyDefinition`
- `IgdbGameDefinition`
- `IgdbExtensionDefinition`

Each definition specifies:

- The data fetcher service to use
- The data processor service to use
- The data storage service to use
- Console-specific options

### 4. **Abstract Base Command (Single Responsibility + Template Method)**

`AbstractDataImporterCommand` provides:

- Common logic for all data import commands
- Automatic progress tracking
- Batch processing (both simple and advanced)
- Error handling
- Memory management

Subclasses only need to:

```php
protected function getDataImportDefinition(): DataImportDefinition
{
    return new IgdbGenreDefinition();
}
```

### 5. **Orchestrator Command (Dependency Inversion)**

`GetIgdbDataCommand` now:

- Uses the `DataImportRegistry` instead of hardcoded command names
- Supports `--only` option to run specific data types
- Supports `--skip` option to exclude specific data types
- Automatically adapts when new data types are registered

## SOLID Principles Applied

### Single Responsibility

- Each class has ONE reason to change
- `AbstractDataImporterCommand` handles import logic
- Data definitions handle configuration
- Registry handles data type management

### Open/Closed

- Open for extension: Add new data types without modifying existing code
- Closed for modification: Existing commands and logic unchanged
- Add new APIs by creating new definition classes and service implementations

### Liskov Substitution

- All `DataFetcherInterface` implementations are interchangeable
- All `DataProcessorInterface` implementations are interchangeable
- All data importer commands work the same way
- Commands can be substituted without breaking functionality

### Interface Segregation

- `DataFetcherInterface` - only fetch concerns
- `DataProcessorInterface` - only processing concerns
- `DataStorageInterface` - only storage concerns
- No "fat" interfaces with unused methods

### Dependency Inversion

- Commands depend on interfaces, not concrete services
- Registry holds references by service IDs, resolved at runtime
- Easy to swap implementations (e.g., different API providers)

## Adding a New Data Type

### Step 1: Create a Definition

```php
// src/Config/Api/IGDB/IgdbPlatformDefinition.php
class IgdbPlatformDefinition extends DataImportDefinition
{
    public function getKey(): string { return 'igdb_platforms'; }
    public function getName(): string { return 'IGDB Platforms'; }
    public function getDescription(): string { return 'Fetches game platforms...'; }
    public function getDataFetcherServiceId(): string { return 'app.api.igdb.platform_fetcher'; }
    public function getDataProcessorServiceId(): string { return 'app.processor.igdb_data_processor'; }
    public function getDataStorageServiceId(): string { return 'app.storage.igdb_platform_storage'; }
}
```

### Step 2: Create Services (if using new implementation)

Implement the interfaces for fetching, processing, and storing platform data.

### Step 3: Register in Container

```yaml
# config/services.yaml
services:
  app.storage.igdb_platform_storage:
    class: App\Service\Storage\IgdbPlatformStorage
    # ... dependencies
```

### Step 4: Register in Registry

```php
// Where the IGDB registry is configured
$registry->register(new IgdbPlatformDefinition());
```

### Step 5: Create Command (Optional)

If you need specific behavior, create a command extending `AbstractDataImporterCommand`:

```php
#[AsCommand(name: 'app:get-platforms-from-igdb')]
class GetPlatformsFromIgdbCommand extends AbstractDataImporterCommand
{
    protected function getDataImportDefinition(): DataImportDefinition
    {
        return new IgdbPlatformDefinition();
    }
}
```

## Adding a New External API (e.g., Steam API)

### Step 1: Create API-Specific Namespace

```
App\Config\Api\Steam\
  SteamGameDefinition.php
  SteamReviewDefinition.php
```

### Step 2: Create Implementation Services

```
App\Service\Api\Steam\
  SteamGameFetcher.php (implements DataFetcherInterface)
  SteamDataProcessor.php (implements DataProcessorInterface)
  SteamStorage.php (implements DataStorageInterface)
```

### Step 3: Register Registry

```php
$steamRegistry = new DataImportRegistry('Steam');
$steamRegistry->register(new SteamGameDefinition());
$steamRegistry->register(new SteamReviewDefinition());
```

### Step 4: Create Orchestrator

```php
#[AsCommand(name: 'app:get-steam-data')]
class GetSteamDataCommand extends Command
{
    // Similar to GetIgdbDataCommand but uses Steam registry
}
```

## Usage Examples

### Run all IGDB imports

```bash
php bin/console app:get-igdb-data
```

### Run specific data types only

```bash
php bin/console app:get-igdb-data --only igdb_genres,igdb_companies
```

### Skip specific data types

```bash
php bin/console app:get-igdb-data --skip igdb_games,igdb_extensions
```

### Force re-import (ignore last update date)

```bash
php bin/console app:get-igdb-data --force
```

### Import individual data types

```bash
php bin/console app:get-genres-from-igdb
php bin/console app:get-games-from-igdb --offset 100 --fetchSize 50
```

## File Structure

```
src/
├── Command/
│   ├── Base/
│   │   └── AbstractDataImporterCommand.php      # Base class for all importers
│   ├── GetGenresFromIgdbCommand.php              # ~30 lines (was 158)
│   ├── GetCompaniesFromIgdbCommand.php           # ~30 lines (was 150)
│   ├── GetGamesFromIgdbCommand.php               # ~30 lines (was 434)
│   ├── GetExtensionsFromIgdbCommand.php          # ~30 lines (was 299)
│   └── GetIgdbDataCommand.php                    # ~100 lines (was 110)
│
├── Config/
│   └── Api/
│       ├── DataImportDefinition.php              # Abstract definition class
│       ├── DataImportRegistry.php                # Registry for managing definitions
│       └── IGDB/
│           ├── IgdbGenreDefinition.php
│           ├── IgdbCompanyDefinition.php
│           ├── IgdbGameDefinition.php
│           └── IgdbExtensionDefinition.php
│
└── Interfaces/
    └── Api/
        ├── DataFetcherInterface.php
        ├── DataProcessorInterface.php
        └── DataStorageInterface.php
```

## Benefits

✅ **Code Reusability** - 85% reduction in command code duplication
✅ **Flexibility** - Add new data types without modifying commands
✅ **Extensibility** - Support multiple external APIs easily
✅ **Maintainability** - Clear separation of concerns
✅ **Testability** - Each interface can be tested independently
✅ **Future-Proof** - Easy to migrate to new APIs when IGDB changes

## Migration Notes

All existing commands work exactly the same way from the user's perspective. The internal refactoring maintains backward compatibility with:

- All console options and arguments
- All progress tracking
- All error handling
- All performance optimizations

The main difference is the code is now cleaner, more maintainable, and ready for expansion.
