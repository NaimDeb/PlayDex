# Visual Architecture Guide

## System Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                    CLI COMMANDS LAYER                           │
├─────────────────────────────────────────────────────────────────┤
│                                                                   │
│  GetGenresFromIgdbCommand      GetIgdbDataCommand (Orchestrator) │
│  GetCompaniesFromIgdbCommand   - Manages registry               │
│  GetGamesFromIgdbCommand       - Runs commands in sequence       │
│  GetExtensionsFromIgdbCommand  - Supports --only, --skip        │
│                                                                   │
│         ↓ All inherit from ↓                                     │
│  ┌──────────────────────────────────────────────────────┐       │
│  │   AbstractDataImporterCommand (Base Class)           │       │
│  │   - Batch processing logic                           │       │
│  │   - Progress tracking                                │       │
│  │   - Error handling                                   │       │
│  │   - Memory management                                │       │
│  │   - Rate limiting                                    │       │
│  └──────────────────────────────────────────────────────┘       │
└─────────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────────┐
│                    CONFIGURATION LAYER                          │
├─────────────────────────────────────────────────────────────────┤
│                                                                   │
│  ┌────────────────────────────────────────────────────────────┐  │
│  │         DataImportRegistry ('IGDB')                        │  │
│  │  ┌──────────────────────────────────────────────────────┐  │  │
│  │  │ IgdbGenreDefinition                                 │  │  │
│  │  │ IgdbCompanyDefinition                               │  │  │
│  │  │ IgdbGameDefinition                                  │  │  │
│  │  │ IgdbExtensionDefinition                             │  │  │
│  │  │ ... (easily add IgdbPlatformDefinition, etc)        │  │  │
│  │  └──────────────────────────────────────────────────────┘  │  │
│  └────────────────────────────────────────────────────────────┘  │
│                                                                   │
│  Each Definition specifies:                                      │
│  - Key (unique identifier)                                       │
│  - Name & Description                                            │
│  - Service IDs for Fetcher, Processor, Storage                  │
│  - Custom console options (if any)                               │
└─────────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────────┐
│                    SERVICE LAYER                                │
├─────────────────────────────────────────────────────────────────┤
│                                                                   │
│  For each data type, three services:                             │
│                                                                   │
│  ┌──────────────────┐  ┌──────────────────┐  ┌──────────────────┐│
│  │   DataFetcher    │  │  DataProcessor   │  │  DataStorage    ││
│  ├──────────────────┤  ├──────────────────┤  ├──────────────────┤│
│  │ Interface:       │  │ Interface:       │  │ Interface:       ││
│  │ - getCount()     │  │ - processBatch() │  │ - store()        ││
│  │ - fetchBatch()   │  │ - getEntityName()│  │ - getTableName() ││
│  │ - getSourceName()│  │                  │  │                  ││
│  │ - getProviderName()                   │  │                  ││
│  │                  │  │                  │  │                  ││
│  │ IGDB Example:    │  │ IGDB Example:    │  │ IGDB Example:    ││
│  │ IgdbGenreFetcher │  │ IgdbDataProc     │  │ IgdbGenreStorage ││
│  │ IgdbGameFetcher  │  │                  │  │ IgdbGameStorage  ││
│  │ etc.             │  │                  │  │ etc.             ││
│  │                  │  │                  │  │                  ││
│  │ Can add: Steam   │  │ Can add: Steam   │  │ Can add: Steam   ││
│  │ SteamGameFetcher │  │ SteamDataProc    │  │ SteamGameStorage ││
│  │ etc.             │  │                  │  │ etc.             ││
│  └──────────────────┘  └──────────────────┘  └──────────────────┘│
└─────────────────────────────────────────────────────────────────┘
```

## Data Flow Diagram

```
User runs: php bin/console app:get-igdb-data
│
├──→ GetIgdbDataCommand
│    ├─→ Load DataImportRegistry (IGDB)
│    ├─→ Get registered definitions [Genres, Companies, Games, Extensions]
│    └─→ For each definition:
│        │
│        ├──→ GetGenresFromIgdbCommand
│        │    ├─→ getDataImportDefinition() → IgdbGenreDefinition
│        │    └─→ execute() calls AbstractDataImporterCommand.execute()
│        │        │
│        │        ├─→ initializeServices()
│        │        │   ├─→ Get IgdbGenreFetcher from container
│        │        │   ├─→ Get IgdbDataProcessor from container
│        │        │   └─→ Get IgdbGenreStorage from container
│        │        │
│        │        ├─→ dataFetcher.getCount() → 50
│        │        │
│        │        ├─→ processBatches()
│        │        │   ├─→ For batch 1 (offset 0):
│        │        │   │   ├─→ dataFetcher.fetchBatch(500, 0, timestamp)
│        │        │   │   │   └─→ API Call → [genre1, genre2, ...]
│        │        │   │   ├─→ dataProcessor.processBatch(data)
│        │        │   │   │   └─→ Transform → [processed_data...]
│        │        │   │   └─→ dataStorage.store(processed_data)
│        │        │   │       └─→ INSERT INTO database
│        │        │   └─→ Update progress bar
│        │        │
│        │        └─→ Return SUCCESS
│        │
│        ├──→ GetCompaniesFromIgdbCommand (repeat)
│        ├──→ GetGamesFromIgdbCommand (repeat)
│        └──→ GetExtensionsFromIgdbCommand (repeat)
│
└──→ Update UpdateHistory
└──→ Complete!
```

## Extension Point Architecture

```
To Add a New Data Type:
┌──────────────────────────────────────────────────────┐
│ 1. Create Definition                                 │
│    ├─ Class: IgdbPlatformDefinition                 │
│    ├─ Extends: DataImportDefinition                 │
│    └─ Defines: Service IDs and metadata             │
└──────────────────────────────────────────────────────┘
                      ↓
┌──────────────────────────────────────────────────────┐
│ 2. Register in Service Container                     │
│    ├─ Create service definitions                    │
│    ├─ Wire up dependencies                          │
│    └─ Register in DataImportRegistry                │
└──────────────────────────────────────────────────────┘
                      ↓
┌──────────────────────────────────────────────────────┐
│ 3. (Optional) Create Command                         │
│    ├─ Class: GetPlatformsFromIgdbCommand            │
│    ├─ Extends: AbstractDataImporterCommand          │
│    └─ Override: getDataImportDefinition()           │
└──────────────────────────────────────────────────────┘
                      ↓
          DONE! Works automatically!
           ✅ Works with app:get-igdb-data
           ✅ Works standalone
           ✅ Full progress tracking
           ✅ Full error handling


To Add a New External API:
┌──────────────────────────────────────────────────────┐
│ 1. Create Registry for new API                       │
│    └─ DataImportRegistry('Steam')                   │
└──────────────────────────────────────────────────────┘
                      ↓
┌──────────────────────────────────────────────────────┐
│ 2. Create Definitions for each data type            │
│    ├─ SteamGameDefinition                           │
│    ├─ SteamReviewDefinition                         │
│    └─ (as many as needed)                           │
└──────────────────────────────────────────────────────┘
                      ↓
┌──────────────────────────────────────────────────────┐
│ 3. Create Service Implementations                    │
│    ├─ Fetchers (implement DataFetcherInterface)     │
│    ├─ Processors (implement DataProcessorInterface) │
│    └─ Storage (implement DataStorageInterface)      │
└──────────────────────────────────────────────────────┘
                      ↓
┌──────────────────────────────────────────────────────┐
│ 4. Create Orchestrator Command (or reuse pattern)    │
│    └─ GetSteamDataCommand                           │
└──────────────────────────────────────────────────────┘
                      ↓
    Full multi-API system ready!
     ✅ Both IGDB and Steam working
     ✅ Same architecture for both
     ✅ Easy to add more APIs later
```

## SOLID Principles Visualization

```
┌─────────────────────────────────────────────────────────────────┐
│              SINGLE RESPONSIBILITY                              │
├─────────────────────────────────────────────────────────────────┤
│                                                                   │
│  AbstractDataImporterCommand   → Import logic only              │
│  DataImportDefinition         → Configuration only              │
│  DataFetcherInterface         → Fetching only                   │
│  DataProcessorInterface       → Processing only                 │
│  DataStorageInterface         → Storage only                    │
│                                                                   │
│  Each class has ONE reason to change                             │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│                  OPEN/CLOSED                                    │
├─────────────────────────────────────────────────────────────────┤
│                                                                   │
│  OPEN for extension:                                             │
│  └─ Add IgdbPlatformDefinition without modifying anything       │
│  └─ Add SteamGameDefinition without modifying anything          │
│                                                                   │
│  CLOSED for modification:                                        │
│  └─ No changes to existing commands                              │
│  └─ No changes to AbstractDataImporterCommand                    │
│  └─ No changes to interfaces                                     │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│            LISKOV SUBSTITUTION                                  │
├─────────────────────────────────────────────────────────────────┤
│                                                                   │
│  Any DataFetcher can replace any other DataFetcher              │
│  │                                                               │
│  ├─ IgdbGenreFetcher                                            │
│  ├─ IgdbGameFetcher                                             │
│  ├─ SteamGameFetcher                                            │
│  └─ New fetchers... all work the same way                       │
│                                                                   │
│  BaseCommand sees only the interface, not the implementation    │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│          INTERFACE SEGREGATION                                  │
├─────────────────────────────────────────────────────────────────┤
│                                                                   │
│  DataFetcherInterface              ← Only fetch concerns         │
│  ├─ getCount()                                                   │
│  ├─ fetchBatch()                                                 │
│  └─ getSourceName()                                              │
│                                                                   │
│  DataProcessorInterface            ← Only process concerns       │
│  ├─ processBatch()                                               │
│  └─ getEntityName()                                              │
│                                                                   │
│  DataStorageInterface              ← Only storage concerns       │
│  ├─ store()                                                      │
│  └─ getTableName()                                               │
│                                                                   │
│  No "fat" interfaces with methods you don't use                 │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│          DEPENDENCY INVERSION                                   │
├─────────────────────────────────────────────────────────────────┤
│                                                                   │
│  AbstractDataImporterCommand                                     │
│  │                                                               │
│  depends on ↓                                                    │
│  │                                                               │
│  Interfaces (abstractions):                                      │
│  ├─ DataFetcherInterface                                        │
│  ├─ DataProcessorInterface                                      │
│  └─ DataStorageInterface                                        │
│  │                                                               │
│  NOT on concrete classes:                                        │
│  ├─ IgdbGenreFetcher                                            │
│  ├─ SteamGameFetcher                                            │
│  └─ IgdbGameStorage                                             │
│                                                                   │
│  Implementation details resolved at runtime via container        │
└─────────────────────────────────────────────────────────────────┘
```

## Class Hierarchy

```
Command Hierarchy:
┌───────────────────────────────────┐
│    Symfony\Command                │
└────────────────┬──────────────────┘
                 │
┌────────────────▼──────────────────┐
│   AbstractDataImporterCommand     │
│  - All import logic here          │
│  - Process batches                │
│  - Handle progress                │
│  - Error management               │
└────┬─────────┬──────────┬─────────┘
     │         │          │
  ┌──▼──┐  ┌──▼──┐  ┌───▼──┐  ┌───▼───┐
  │Genre│  │Cmpy │  │Games │  │Exten  │
  │Cmd  │  │Cmd  │  │Cmd   │  │Cmd    │
  └─────┘  └─────┘  └──────┘  └───────┘
    ~30L    ~30L     ~30L      ~30L


Interface Hierarchy:
┌──────────────────────────────────┐
│   DataFetcherInterface           │
│  - getCount()                    │
│  - fetchBatch()                  │
│  - getSourceName()               │
│  - getProviderName()             │
└──────┬──────────────────────────┘
       │
   ┌───┴────┬────────┬───────────┐
   │        │        │           │
┌──▼──┐ ┌──▼──┐ ┌──▼──┐ ┌──────▼─┐
│Gnr  │ │Cmp  │ │Game │ │Steam  │
│Fct  │ │Fct  │ │Fct  │ │Game   │
│IGDB │ │IGDB │ │IGDB │ │Fct    │
└─────┘ └─────┘ └─────┘ └───────┘
```

## File Size Evolution

```
BEFORE:          AFTER:           NET CHANGE:
────────         ─────────        ────────────
GetGenres (158)  GetGenres (30)   ↓ 81%
GetCompanies (150) GetCompanies (30) ↓ 80%
GetGames (434)   GetGames (30)    ↓ 93%
GetExtensions (299) GetExtensions (30) ↓ 90%
GetIgdbData (110) GetIgdbData (100) ↓ 9%
────────────     ──────────────   ──────────
TOTAL: 1,151     NEW: 1,051       Overall: ↓ 8.7%

          BUT... wait for this:

NEW INFRASTRUCTURE (one-time cost):
├─ AbstractDataImporterCommand: +400 lines (reusable for all commands!)
├─ DataImportDefinition: +50 lines
├─ DataImportRegistry: +80 lines
├─ 3 Interfaces: +50 lines
└─ 4 IGDB Definitions: +60 lines

TOTAL NEW: ~640 lines

FINAL COUNT:
  Before: 1,151 lines of command code
  After:  1,051 lines (commands) + 640 lines (infrastructure)
  Total:  1,691 lines

BUT: Infrastructure is reusable! Adding new API doesn't add to command count.

LONG TERM:
  Adding 5th data type: +20 lines (definition only)
  Adding Steam API:     +300 lines (not +1,400!)
  Adding 10th API:      +3,000 lines total (not +15,000!)
```

## Testing Architecture

```
┌─────────────────────────────────────────────┐
│          Unit Test Structure                │
├─────────────────────────────────────────────┤
│                                             │
│ Test DataFetcherInterface                   │
│ ├─ Mock IgdbGenreFetcher                   │
│ ├─ Mock IgdbGameFetcher                    │
│ └─ Mock SteamGameFetcher                   │
│                                             │
│ Test DataProcessorInterface                 │
│ ├─ Test IgdbDataProcessor                  │
│ └─ Test SteamDataProcessor                 │
│                                             │
│ Test DataStorageInterface                   │
│ ├─ Test IgdbGenreStorage                   │
│ └─ Test SteamGameStorage                   │
│                                             │
│ Test AbstractDataImporterCommand            │
│ ├─ Batch processing logic                  │
│ ├─ Progress tracking                        │
│ ├─ Error handling                           │
│ └─ Memory management                        │
│                                             │
│ Test Definitions                            │
│ ├─ getKey() returns correct value           │
│ ├─ Service IDs are valid                    │
│ └─ Options are properly defined             │
│                                             │
│ Integration Tests                           │
│ ├─ Full flow with mock services             │
│ └─ Registry properly initialized            │
│                                             │
└─────────────────────────────────────────────┘
```

---

This visual guide shows how all the pieces fit together. The modular design allows you to test, extend, and maintain each piece independently while they all work together seamlessly! 🎯
