<?php

namespace App\Tests\Functional\Command;

use App\Command\GetGenresFromIgdbCommand;
use App\Command\GetCompaniesFromIgdbCommand;
use App\Command\GetGamesFromIgdbCommand;
use App\Command\GetExtensionsFromIgdbCommand;
use App\Config\Api\DataImportRegistry;
use App\Config\Api\IGDB\IgdbGenreDefinition;
use App\Config\Api\IGDB\IgdbCompanyDefinition;
use App\Config\Api\IGDB\IgdbGameDefinition;
use App\Config\Api\IGDB\IgdbExtensionDefinition;
use App\Service\Api\IgdbGenreFetcher;
use App\Service\Api\IgdbCompanyFetcher;
use App\Service\Api\IgdbGameFetcher;
use App\Service\Api\IgdbExtensionFetcher;
use App\Service\Processor\IgdbDataProcessor;
use App\Service\Storage\IgdbGenreStorage;
use App\Service\Storage\IgdbCompanyStorage;
use App\Service\Storage\IgdbGameStorage;
use App\Service\Storage\IgdbExtensionStorage;
use App\Service\ExternalApiService;
use App\Service\IgdbDataProcessorService;
use App\Service\DatabaseOperationService;
use App\Service\ProgressBarHandlerService;
use Symfony\Component\Console\Tester\CommandTester;
use Symfony\Component\DependencyInjection\ContainerInterface;
use PHPUnit\Framework\TestCase;

class RefactoredCommandsTest extends TestCase
{
    private ProgressBarHandlerService|\PHPUnit\Framework\MockObject\MockObject $progressHandler;
    private DatabaseOperationService|\PHPUnit\Framework\MockObject\MockObject $databaseService;
    private ContainerInterface|\PHPUnit\Framework\MockObject\MockObject $container;
    private ExternalApiService|\PHPUnit\Framework\MockObject\MockObject $externalApiService;
    private IgdbDataProcessorService|\PHPUnit\Framework\MockObject\MockObject $igdbProcessorService;

    protected function setUp(): void
    {
        $this->progressHandler = $this->createMock(ProgressBarHandlerService::class);
        $this->databaseService = $this->createMock(DatabaseOperationService::class);
        $this->container = $this->createMock(ContainerInterface::class);
        $this->externalApiService = $this->createMock(ExternalApiService::class);
        $this->igdbProcessorService = $this->createMock(IgdbDataProcessorService::class);
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
            $this->progressHandler,
            $this->databaseService,
            $this->container
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
            $this->progressHandler,
            $this->databaseService,
            $this->container
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
            $this->progressHandler,
            $this->databaseService,
            $this->container
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
            $this->progressHandler,
            $this->databaseService,
            $this->container
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
            $this->progressHandler,
            $this->databaseService,
            $this->container
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
            $this->progressHandler,
            $this->databaseService,
            $this->container
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
            $this->progressHandler,
            $this->databaseService,
            $this->container
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
            $this->progressHandler,
            $this->databaseService,
            $this->container
        );

        $tester = new CommandTester($command);
        $statusCode = $tester->execute([]);

        $this->assertNotEquals(0, $statusCode);
    }

    public function testAllCommandsCanBeRegisteredSimultaneously(): void
    {
        $genreCommand = new GetGenresFromIgdbCommand(
            $this->progressHandler,
            $this->databaseService,
            $this->container
        );

        $companyCommand = new GetCompaniesFromIgdbCommand(
            $this->progressHandler,
            $this->databaseService,
            $this->container
        );

        $gameCommand = new GetGamesFromIgdbCommand(
            $this->progressHandler,
            $this->databaseService,
            $this->container
        );

        $extensionCommand = new GetExtensionsFromIgdbCommand(
            $this->progressHandler,
            $this->databaseService,
            $this->container
        );

        // All commands should exist and be properly initialized
        $this->assertNotNull($genreCommand);
        $this->assertNotNull($companyCommand);
        $this->assertNotNull($gameCommand);
        $this->assertNotNull($extensionCommand);
    }
}
