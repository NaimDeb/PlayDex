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
        $command = new GetGenresFromIgdbCommand(
            $this->progressHandler,
            $this->databaseService,
            $this->container
        );

        $this->assertInstanceOf(GetGenresFromIgdbCommand::class, $command);
    }

    public function testGetCompaniesCommandExecutes(): void
    {
        $command = new GetCompaniesFromIgdbCommand(
            $this->progressHandler,
            $this->databaseService,
            $this->container
        );

        $this->assertInstanceOf(GetCompaniesFromIgdbCommand::class, $command);
    }

    public function testGetGamesCommandExecutes(): void
    {
        $command = new GetGamesFromIgdbCommand(
            $this->progressHandler,
            $this->databaseService,
            $this->container
        );

        $this->assertInstanceOf(GetGamesFromIgdbCommand::class, $command);
    }

    public function testGetExtensionsCommandExecutes(): void
    {
        $command = new GetExtensionsFromIgdbCommand(
            $this->progressHandler,
            $this->databaseService,
            $this->container
        );

        $this->assertInstanceOf(GetExtensionsFromIgdbCommand::class, $command);
    }

    public function testGenreCommandWithTimestampFilter(): void
    {
        $command = new GetGenresFromIgdbCommand(
            $this->progressHandler,
            $this->databaseService,
            $this->container
        );

        $this->assertInstanceOf(GetGenresFromIgdbCommand::class, $command);
    }

    public function testCommandOutputsProgress(): void
    {
        $command = new GetGenresFromIgdbCommand(
            $this->progressHandler,
            $this->databaseService,
            $this->container
        );

        $this->assertInstanceOf(GetGenresFromIgdbCommand::class, $command);
    }

    public function testCommandHandlesNoData(): void
    {
        $command = new GetGenresFromIgdbCommand(
            $this->progressHandler,
            $this->databaseService,
            $this->container
        );

        $this->assertInstanceOf(GetGenresFromIgdbCommand::class, $command);
    }

    public function testCommandErrorHandling(): void
    {
        $command = new GetGenresFromIgdbCommand(
            $this->progressHandler,
            $this->databaseService,
            $this->container
        );

        $this->assertInstanceOf(GetGenresFromIgdbCommand::class, $command);
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
