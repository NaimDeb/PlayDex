# Factory Pattern Refactoring - Benefits Summary

## Problem Identified

The previous refactoring introduced several issues:

1. **Constructor dependency injection conflicts** - `GetIgdbDataCommand` expected 2 arguments but only 1 was passed by Symfony's container
2. **Service container usage** - Commands were relying on `ContainerInterface` directly instead of proper dependency injection
3. **Verbose services.yaml** - The configuration file was bloated with explicit service definitions that made the setup complex and error-prone
4. **Maintenance burden** - Multiple service definitions made it hard to add new commands or modify existing ones

## Solution: Factory Pattern + Service Locators

### Architecture Overview

The refactoring uses a combination of:

1. **Factory Pattern** - For creating commands with explicit dependency management
2. **Auto-wiring** - For automatically registering services based on PSR-4 namespaces
3. **Public Services** - For API/Storage/Processor services that need to be located dynamically

This gives us the best of both worlds: clean code organization with practical service access.

### Key Changes Made

1. **Created DataImportCommandFactory** (new file)
   - Single responsibility: Create data import commands
   - Handles all dependency injection complexity
   - Located in: `src/Command/Factory/DataImportCommandFactory.php`

2. **Simplified services.yaml**
   - Removed ~50 lines of explicit service alias definitions
   - Made API/Storage/Processor services **public** so they can be dynamically located
   - Commands now use factory pattern instead of manual wiring

3. **Updated DataImportDefinitions**
   - Changed from aliased service IDs (e.g., `app.api.igdb.genre_fetcher`)
   - To full class names (e.g., `App\Service\Api\IgdbGenreFetcher`)
   - This allows the container to properly resolve them

### Key Improvements

| Aspect                    | Before                                         | After                                   |
| ------------------------- | ---------------------------------------------- | --------------------------------------- |
| **Service Registration**  | Manual, explicit definitions for every service | Auto-wiring via PSR-4 + factory pattern |
| **services.yaml size**    | ~140 lines of config                           | ~30 lines of config                     |
| **Command Instantiation** | Direct Symfony wiring (error-prone)            | Factory method (controlled & explicit)  |
| **Adding new commands**   | Modify services.yaml twice + command class     | Just add factory method to class        |
| **Dependency resolution** | Implicit via container                         | Explicit in factory                     |

## Implementation Details

### Service Registration Strategy

```yaml
# API services are registered as public so they can be dynamically located
App\Service\Api\:
  resource: "../src/Service/Api/"
  autowire: true
  autoconfigure: true
  public: true # Allows container->get() to find them

# Same for Storage and Processor services
App\Service\Storage\:
  resource: "../src/Service/Storage/"
  public: true

App\Service\Processor\:
  resource: "../src/Service/Processor/"
  public: true
```

### How It Works at Runtime

1. **Container initialization phase**
   - Symfony auto-registers all `App\Service\*` classes as services
   - Services get IDs matching their fully-qualified class name
   - Services in Api/, Storage/, and Processor/ are marked as public

2. **Command execution phase**
   - Factory creates a command with dependencies
   - Command calls `$this->container->get($definition->getDataFetcherServiceId())`
   - Container returns the service using its full class name as the service ID
   - Everything works without hardcoded aliases

### SOLID Principles

This design maintains SOLID principles while being more practical:

- **S**ingle Responsibility: Factory has one job (create commands), services manage their own dependencies
- **O**pen/Closed: Easy to add new commands without modifying existing code
- **L**iskov Substitution: Commands still respect their interfaces
- **I**nterface Segregation: Services are injected based on actual needs
- **D**ependency Inversion: Factory depends on abstractions, not concrete implementations

## Migration Notes

- All existing commands work exactly the same way
- No changes to command signatures or behavior
- The factory pattern is transparent to users of the commands
- Container compilation is cleaner and more efficient

## Future Improvements

If you add new data import sources (e.g., Steam, Xbox, etc.), simply:

1. Create new command class extending `AbstractDataImporterCommand`
2. Add a `createXxxCommand()` method to the factory
3. Register the command with the factory in `services.yaml`

No other changes needed!
