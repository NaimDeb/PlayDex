<?php

namespace App\Tests\Functional\Command;

use App\Command\GetGenresFromIgdbCommand;
use App\Command\GetCompaniesFromIgdbCommand;
use App\Command\GetGamesFromIgdbCommand;
use App\Command\GetExtensionsFromIgdbCommand;
use App\Config\Api\DataImportRegistry;
use App\Config\Api\IgdbGenreDefinition;
use App\Config\Api\IgdbCompanyDefinition;
use App\Config\Api\IgdbGameDefinition;
use App\Config\Api\IgdbExtensionDefinition;
use App\Service\Api\IgdbGenreFetcher;
use App\Service\Api\IgdbCompanyFetcher;
use App\Service\Api\IgdbGameFetcher;
use App\Service\Api\IgdbExtensionFetcher;
use App\Service\Api\IgdbDataProcessor;
use App\Service\Api\IgdbGenreStorage;
use App\Service\Api\IgdbCompanyStorage;
use App\Service\Api\IgdbGameStorage;
use App\Service\Api\IgdbExtensionStorage;
use App\Service\ExternalApiService;
use App\Service\IgdbDataProcessorService;
use App\Service\DatabaseOperationService;
use Symfony\Component\Console\Tester\CommandTester;
use PHPUnit\Framework\TestCase;

class RefactoredCommandsTest extends TestCase
{
    private DataImportRegistry $registry;
    private ExternalApiService|\PHPUnit\Framework\MockObject\MockObject $externalApiService;
    private IgdbDataProcessorService|\PHPUnit\Framework\MockObject\MockObject $igdbProcessorService;
    private DatabaseOperationService|\PHPUnit\Framework\MockObject\MockObject $databaseService;

    protected function setUp(): void
    {
        $this->externalApiService = $this->createMock(ExternalApiService::class);
        $this->igdbProcessorService = $this->createMock(IgdbDataProcessorService::class);
        $this->databaseService = $this->createMock(DatabaseOperationService::class);

        $this->registry = new DataImportRegistry();
        $this->registerAllDefinitions();
    }

    private function registerAllDefinitions(): void
    {
        $this->registry
            ->register(new IgdbGenreDefinition(
                new IgdbGenreFetcher($this->externalApiService),
                new IgdbDataProcessor($this->igdbProcessorService),
                new IgdbGenreStorage($this->databaseService)
            ))
            ->register(new IgdbCompanyDefinition(
                new IgdbCompanyFetcher($this->externalApiService),
                new IgdbDataProcessor($this->igdbProcessorService),
                new IgdbCompanyStorage($this->databaseService)
            ))
            ->register(new IgdbGameDefinition(
                new IgdbGameFetcher($this->externalApiService),
                new IgdbDataProcessor($this->igdbProcessorService),
                new IgdbGameStorage($this->databaseService)
            ))
            ->register(new IgdbExtensionDefinition(
                new IgdbExtensionFetcher($this->externalApiService),
                new IgdbDataProcessor($this->igdbProcessorService),
                new IgdbExtensionStorage($this->databaseService)
            ));
    }

    public function testGetGenresCommandExecutes(): void
    {
        $this->externalApiService
            ->expects($this->once())
            ->method('getNumberOfIgdbGenres')
            ->willReturn(1);

        $this->externalApiService
            ->expects($this->once())
            ->method('getIgdbGenres')
            ->willReturn([['id' => 1, 'name' => 'Action']]);

        $this->igdbProcessorService
            ->expects($this->once())
            ->method('processGenres')
            ->willReturnArgument(0);

        $this->databaseService
            ->expects($this->once())
            ->method('insertOrUpdateGenre')
            ->willReturn(true);

        $command = new GetGenresFromIgdbCommand(
            $this->registry->get('genres')->getFetcher(),
            $this->registry->get('genres')->getProcessor(),
            $this->registry->get('genres')->getStorage()
        );

        $tester = new CommandTester($command);
        $statusCode = $tester->execute([]);

        $this->assertEquals(0, $statusCode);
    }

    public function testGetCompaniesCommandExecutes(): void
    {
        $this->externalApiService
            ->expects($this->once())
            ->method('getNumberOfIgdbCompanies')
            ->willReturn(1);

        $this->externalApiService
            ->expects($this->once())
            ->method('getIgdbCompanies')
            ->willReturn([['id' => 1, 'name' => 'Nintendo']]);

        $this->igdbProcessorService
            ->expects($this->once())
            ->method('processCompanies')
            ->willReturnArgument(0);

        $this->databaseService
            ->expects($this->once())
            ->method('insertOrUpdateCompany')
            ->willReturn(true);

        $command = new GetCompaniesFromIgdbCommand(
            $this->registry->get('companies')->getFetcher(),
            $this->registry->get('companies')->getProcessor(),
            $this->registry->get('companies')->getStorage()
        );

        $tester = new CommandTester($command);
        $statusCode = $tester->execute([]);

        $this->assertEquals(0, $statusCode);
    }

    public function testGetGamesCommandExecutes(): void
    {
        $this->externalApiService
            ->expects($this->once())
            ->method('getNumberOfIgdbGames')
            ->willReturn(1);

        $this->externalApiService
            ->expects($this->once())
            ->method('getIgdbGames')
            ->willReturn([['id' => 1, 'name' => 'Zelda']]);

        $this->igdbProcessorService
            ->expects($this->once())
            ->method('processGames')
            ->willReturnArgument(0);

        $this->databaseService
            ->expects($this->once())
            ->method('insertOrUpdateGame')
            ->willReturn(true);

        $command = new GetGamesFromIgdbCommand(
            $this->registry->get('games')->getFetcher(),
            $this->registry->get('games')->getProcessor(),
            $this->registry->get('games')->getStorage()
        );

        $tester = new CommandTester($command);
        $statusCode = $tester->execute([]);

        $this->assertEquals(0, $statusCode);
    }

    public function testGetExtensionsCommandExecutes(): void
    {
        $this->externalApiService
            ->expects($this->once())
            ->method('getNumberOfIgdbExtensions')
            ->willReturn(1);

        $this->externalApiService
            ->expects($this->once())
            ->method('getIgdbExtensions')
            ->willReturn([['id' => 1, 'name' => 'DLC']]);

        $this->igdbProcessorService
            ->expects($this->once())
            ->method('processExtensions')
            ->willReturnArgument(0);

        $this->databaseService
            ->expects($this->once())
            ->method('insertOrUpdateExtension')
            ->willReturn(true);

        $command = new GetExtensionsFromIgdbCommand(
            $this->registry->get('extensions')->getFetcher(),
            $this->registry->get('extensions')->getProcessor(),
            $this->registry->get('extensions')->getStorage()
        );

        $tester = new CommandTester($command);
        $statusCode = $tester->execute([]);

        $this->assertEquals(0, $statusCode);
    }

    public function testGenreCommandWithTimestampFilter(): void
    {
        $timestamp = 1704067200;

        $this->externalApiService
            ->expects($this->once())
            ->method('getNumberOfIgdbGenres')
            ->with($timestamp)
            ->willReturn(0);

        $command = new GetGenresFromIgdbCommand(
            $this->registry->get('genres')->getFetcher(),
            $this->registry->get('genres')->getProcessor(),
            $this->registry->get('genres')->getStorage()
        );

        $tester = new CommandTester($command);
        $statusCode = $tester->execute(['--from' => $timestamp]);

        $this->assertEquals(0, $statusCode);
    }

    public function testCommandOutputsProgress(): void
    {
        $this->externalApiService
            ->expects($this->once())
            ->method('getNumberOfIgdbGenres')
            ->willReturn(10);

        $this->externalApiService
            ->expects($this->atLeast(1))
            ->method('getIgdbGenres')
            ->willReturn([['id' => 1, 'name' => 'Action']]);

        $this->igdbProcessorService
            ->expects($this->atLeast(1))
            ->method('processGenres')
            ->willReturnArgument(0);

        $this->databaseService
            ->expects($this->atLeast(1))
            ->method('insertOrUpdateGenre')
            ->willReturn(true);

        $command = new GetGenresFromIgdbCommand(
            $this->registry->get('genres')->getFetcher(),
            $this->registry->get('genres')->getProcessor(),
            $this->registry->get('genres')->getStorage()
        );

        $tester = new CommandTester($command);
        $tester->execute([]);
        $output = $tester->getDisplay();

        $this->assertNotEmpty($output);
    }

    public function testCommandHandlesNoData(): void
    {
        $this->externalApiService
            ->expects($this->once())
            ->method('getNumberOfIgdbGenres')
            ->willReturn(0);

        $this->externalApiService
            ->expects($this->never())
            ->method('getIgdbGenres');

        $command = new GetGenresFromIgdbCommand(
            $this->registry->get('genres')->getFetcher(),
            $this->registry->get('genres')->getProcessor(),
            $this->registry->get('genres')->getStorage()
        );

        $tester = new CommandTester($command);
        $statusCode = $tester->execute([]);

        $this->assertEquals(0, $statusCode);
    }

    public function testCommandErrorHandling(): void
    {
        $this->externalApiService
            ->expects($this->once())
            ->method('getNumberOfIgdbGenres')
            ->willThrowException(new \Exception('API Error'));

        $command = new GetGenresFromIgdbCommand(
            $this->registry->get('genres')->getFetcher(),
            $this->registry->get('genres')->getProcessor(),
            $this->registry->get('genres')->getStorage()
        );

        $tester = new CommandTester($command);
        $statusCode = $tester->execute([]);

        $this->assertNotEquals(0, $statusCode);
    }

    public function testAllCommandsCanBeRegisteredSimultaneously(): void
    {
        $genreCommand = new GetGenresFromIgdbCommand(
            $this->registry->get('genres')->getFetcher(),
            $this->registry->get('genres')->getProcessor(),
            $this->registry->get('genres')->getStorage()
        );

        $companyCommand = new GetCompaniesFromIgdbCommand(
            $this->registry->get('companies')->getFetcher(),
            $this->registry->get('companies')->getProcessor(),
            $this->registry->get('companies')->getStorage()
        );

        $gameCommand = new GetGamesFromIgdbCommand(
            $this->registry->get('games')->getFetcher(),
            $this->registry->get('games')->getProcessor(),
            $this->registry->get('games')->getStorage()
        );

        $extensionCommand = new GetExtensionsFromIgdbCommand(
            $this->registry->get('extensions')->getFetcher(),
            $this->registry->get('extensions')->getProcessor(),
            $this->registry->get('extensions')->getStorage()
        );

        // All commands should exist and be properly initialized
        $this->assertNotNull($genreCommand);
        $this->assertNotNull($companyCommand);
        $this->assertNotNull($gameCommand);
        $this->assertNotNull($extensionCommand);
    }
}
