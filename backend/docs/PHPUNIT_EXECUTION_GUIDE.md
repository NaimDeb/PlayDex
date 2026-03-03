# PHPUnit Test Execution Guide

## Prerequisites

Ensure you have PHPUnit installed as a dev dependency in your `composer.json`:

```bash
composer require --dev phpunit/phpunit
```

## Directory Structure

```
tests/
├── Unit/
│   ├── Config/
│   │   └── Api/
│   │       ├── DataImportRegistryTest.php
│   │       └── DataImportDefinitionTest.php
│   ├── Service/
│   │   └── Api/
│   │       ├── IgdbFetcherTest.php
│   │       ├── IgdbDataProcessorTest.php
│   │       └── IgdbStorageTest.php
│   └── Command/
│       └── AbstractDataImporterCommandTest.php
├── Functional/
│   └── Command/
│       ├── DataImportIntegrationTest.php
│       └── RefactoredCommandsTest.php
├── bootstrap.php
├── BaseTestCase.php
└── TEST_SUITE_SUMMARY.md
```

## Running Tests

### 1. Run All Tests

```bash
php bin/phpunit
```

This runs all tests defined in `phpunit.xml.dist` configuration.

### 2. Run Tests by Directory

```bash
# All unit tests
php bin/phpunit tests/Unit/

# All functional tests
php bin/phpunit tests/Functional/

# All config/registry tests
php bin/phpunit tests/Unit/Config/

# All service tests
php bin/phpunit tests/Unit/Service/

# All command tests
php bin/phpunit tests/Unit/Command/
php bin/phpunit tests/Functional/Command/
```

### 3. Run Specific Test Files

```bash
# Registry tests
php bin/phpunit tests/Unit/Config/Api/DataImportRegistryTest.php

# Definition tests
php bin/phpunit tests/Unit/Config/Api/DataImportDefinitionTest.php

# Fetcher tests
php bin/phpunit tests/Unit/Service/Api/IgdbFetcherTest.php

# Processor tests
php bin/phpunit tests/Unit/Service/Api/IgdbDataProcessorTest.php

# Storage tests
php bin/phpunit tests/Unit/Service/Api/IgdbStorageTest.php

# Abstract command tests
php bin/phpunit tests/Unit/Command/AbstractDataImporterCommandTest.php

# Integration tests
php bin/phpunit tests/Functional/Command/DataImportIntegrationTest.php

# Refactored command tests
php bin/phpunit tests/Functional/Command/RefactoredCommandsTest.php
```

### 4. Run Specific Test Methods

```bash
# Single test in a class
php bin/phpunit --filter testGenreStorageStoresSingleItem

# All tests matching pattern
php bin/phpunit --filter "testIgdbGenreFetcher"

# All tests in a class
php bin/phpunit --filter DataImportRegistryTest
```

### 5. Run with Different Output Formats

```bash
# Verbose output (recommended for development)
php bin/phpunit -v

# Very verbose (shows each test method)
php bin/phpunit -vv

# Testdox format (more readable output)
php bin/phpunit --testdox

# Testdox HTML format
php bin/phpunit --testdox-html testdox.html
```

### 6. Stop on First Failure

```bash
# Stop after first failure
php bin/phpunit --stop-on-failure

# Stop after first error
php bin/phpunit --stop-on-error

# Stop after X failures
php bin/phpunit --stop-on-incomplete
```

### 7. Code Coverage Reports

```bash
# HTML coverage report
php bin/phpunit --coverage-html coverage/

# Clover XML format (for CI/CD)
php bin/phpunit --coverage-clover coverage.xml

# Text format (terminal)
php bin/phpunit --coverage-text

# PHP format
php bin/phpunit --coverage-php coverage.php
```

After running HTML coverage, open:

```bash
coverage/index.html
```

### 8. Parallel Execution

If using PHPUnit 10+:

```bash
php bin/phpunit --processes=4
```

### 9. Test with Specific Configuration

```bash
# Using specific phpunit.xml
php bin/phpunit -c phpunit.xml

# Using dist config if no phpunit.xml exists
php bin/phpunit -c phpunit.xml.dist
```

## Common PHPUnit Options

| Option              | Purpose                                         |
| ------------------- | ----------------------------------------------- |
| `-v`                | Verbose output                                  |
| `-vv`               | Very verbose output                             |
| `--testdox`         | Readable test documentation                     |
| `--stop-on-failure` | Stop at first failure                           |
| `--stop-on-error`   | Stop at first error                             |
| `--coverage-html`   | Generate HTML coverage report                   |
| `--coverage-clover` | Generate Clover XML coverage                    |
| `--filter`          | Run tests matching pattern                      |
| `-d`                | Set ini settings (e.g., `-d memory_limit=512M`) |
| `--fail-on-warning` | Treat warnings as failures                      |
| `--fail-on-risky`   | Treat risky tests as failures                   |

## Example Workflows

### Development - Run Single Class

```bash
# Working on fetcher tests
php bin/phpunit -v tests/Unit/Service/Api/IgdbFetcherTest.php
```

### Development - Run Test File with Coverage

```bash
php bin/phpunit -v --coverage-text tests/Unit/Service/Api/IgdbFetcherTest.php
```

### Before Commit - Run All Tests

```bash
php bin/phpunit -v --stop-on-failure
```

### CI/CD Pipeline - Full Report

```bash
php bin/phpunit \
  --coverage-clover coverage.xml \
  --coverage-html coverage/ \
  --testdox-html testdox.html \
  --log-junit junit.xml
```

### Performance Testing

```bash
# Time each test
php bin/phpunit -v --process-isolation

# Check memory usage
php bin/phpunit -v -d memory_limit=1024M
```

## Test Output Examples

### Verbose Output

```
PHPUnit 10.x by Sebastian Bergmann

Tests: 8, Assertions: 23, Failures: 0, Errors: 0

 ✓ testRegistryInitialization
 ✓ testRegisterDefinition
 ✓ testGetDefinition
 ✓ testGetNonExistentDefinition
 ✓ testUnregisterDefinition
 ✓ testFluentInterface
 ✓ testCountDefinitions
 ✓ testGetAllDefinitions

Time: 0.456 seconds, Memory: 4.5MB

OK (8 tests, 23 assertions)
```

### Testdox Format

```
DataImportRegistry
 ✓ Registry can be initialized
 ✓ Definition can be registered
 ✓ Definition can be retrieved
 ✓ Nonexistent definition returns null
 ✓ Definition can be unregistered
 ✓ Register returns fluent interface
 ✓ Definitions can be counted
 ✓ All definitions can be retrieved
```

## Troubleshooting

### Tests Can't Find Classes

**Problem**: `Class not found` errors

**Solution**:

```bash
# Regenerate Composer autoloader
composer dump-autoload

# Then run tests
php bin/phpunit
```

### Memory Issues

**Problem**: `Allowed memory size exhausted`

**Solution**:

```bash
php -d memory_limit=512M bin/phpunit tests/
```

### Timeout Issues

**Problem**: Tests timeout

**Solution**:

```bash
# Increase timeout (in seconds)
php bin/phpunit --timeout=30 tests/
```

### Bootstrap Errors

**Problem**: `bootstrap.php` not found

**Solution**: Ensure `tests/bootstrap.php` exists and is configured in `phpunit.xml.dist`:

```xml
<phpunit bootstrap="tests/bootstrap.php">
    ...
</phpunit>
```

## Integration with IDEs

### VS Code

Install "PHPUnit Test Explorer" extension:

```
Publisher: Recca0120
ID: phpunit-test-explorer
```

Then run tests from the Test Explorer panel.

### PhpStorm/Jetbrains IDEs

Tests should run directly from the IDE:

1. Right-click test file
2. Select "Run PHPUnit Tests"

### Vim/Neovim

Use vim-test plugin:

```vim
:TestFile      " Run current file
:TestNearest   " Run nearest test
:TestSuite     " Run all tests
```

## CI/CD Examples

### GitHub Actions

```yaml
name: Tests

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: shivammathur/setup-php@v2
        with:
          php-version: "8.2"
      - run: composer install
      - run: php bin/phpunit
```

### GitLab CI

```yaml
test:
  stage: test
  script:
    - composer install
    - php bin/phpunit
  artifacts:
    reports:
      junit: junit.xml
```

### Azure DevOps

```yaml
steps:
  - task: Composer@0
  - script: php bin/phpunit
    displayName: "Run PHPUnit"
```

## Tips for Writing Tests

### 1. **Use Mocks for External Dependencies**

```php
$externalService = $this->createMock(ExternalApiService::class);
$externalService->expects($this->once())->method('getNumberOfIgdbGenres')->willReturn(42);
```

### 2. **Use Named Arguments for Clarity**

```php
$tester->execute([
    '--from' => 1704067200,
    '--batch-size' => 50,
]);
```

### 3. **Test Error Conditions**

```php
$this->expectException(\Exception::class);
$this->expectExceptionMessage('API Error');
```

### 4. **Use Callbacks for Complex Assertions**

```php
$mock->method('store')->willReturnCallback(function($data) {
    return count($data) > 0;
});
```

### 5. **Keep Tests Small and Focused**

- One assertion per test when possible
- Test name should clearly describe what is being verified
- Use descriptive variable names

## Performance Optimization

### Run Only Changed Tests

If using git hooks or CI systems that detect changes:

```bash
# Detect which files changed
git diff --name-only

# Run tests for changed files only (requires custom implementation)
php bin/phpunit tests/Unit/Service/Api/IgdbFetcherTest.php
```

### Parallel Test Execution

```bash
# Run 4 test processes in parallel
php bin/phpunit --processes=4

# Run with process isolation (slower but safer)
php bin/phpunit --process-isolation
```

### Skip Long-Running Tests

```bash
# Mark slow tests with @group slow
php bin/phpunit --exclude-group slow
```

## Next Steps

1. **Run the full test suite**:

   ```bash
   php bin/phpunit
   ```

2. **Generate coverage report**:

   ```bash
   php bin/phpunit --coverage-html coverage/
   ```

3. **Review test output** and ensure all tests pass

4. **Configure CI/CD** to run tests on every commit

5. **Add test execution** to pre-commit hooks:
   ```bash
   # In .git/hooks/pre-commit
   #!/bin/bash
   php bin/phpunit || exit 1
   ```

## Test Maintenance Schedule

- **Daily**: Run full test suite before merging
- **Weekly**: Review test coverage and identify untested paths
- **Monthly**: Refactor old tests, update fixtures
- **As needed**: Add tests for bug fixes and new features

## Resources

- [PHPUnit Official Documentation](https://phpunit.de/documentation.html)
- [PHPUnit Best Practices](https://phpunit.de/articles.html)
- [Mocking Documentation](https://phpunit.de/manual/current/en/test-doubles.html)

---

**Happy Testing!** 🧪
