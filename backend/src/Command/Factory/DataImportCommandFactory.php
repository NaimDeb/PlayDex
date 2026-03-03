<?php

namespace App\Command\Factory;

use App\Command\GetCompaniesFromIgdbCommand;
use App\Command\GetExtensionsFromIgdbCommand;
use App\Command\GetGamesFromIgdbCommand;
use App\Command\GetGenresFromIgdbCommand;
use App\Command\GetIgdbDataCommand;
use App\Config\Api\DataImportRegistry;
use App\Repository\UpdateHistoryRepository;
use App\Service\DatabaseOperationService;
use App\Service\ProgressBarHandlerService;
use Symfony\Component\DependencyInjection\ContainerInterface;

/**
 * Factory for creating data import commands with proper dependency injection.
 * This centralizes command instantiation and removes clutter from services.yaml
 */
class DataImportCommandFactory
{
    public function __construct(
        private UpdateHistoryRepository $updateHistoryRepository,
        private DataImportRegistry $igdbRegistry,
        private ProgressBarHandlerService $progressHandler,
        private DatabaseOperationService $dbService,
        private ContainerInterface $container,
    ) {}

    /**
     * Create a GetIgdbDataCommand with all required dependencies.
     */
    public function createGetIgdbDataCommand(): GetIgdbDataCommand
    {
        return new GetIgdbDataCommand(
            $this->updateHistoryRepository,
            $this->igdbRegistry
        );
    }

    /**
     * Create a GetGenresFromIgdbCommand with all required dependencies.
     */
    public function createGetGenresFromIgdbCommand(): GetGenresFromIgdbCommand
    {
        return new GetGenresFromIgdbCommand(
            $this->progressHandler,
            $this->dbService,
            $this->container
        );
    }

    /**
     * Create a GetCompaniesFromIgdbCommand with all required dependencies.
     */
    public function createGetCompaniesFromIgdbCommand(): GetCompaniesFromIgdbCommand
    {
        return new GetCompaniesFromIgdbCommand(
            $this->progressHandler,
            $this->dbService,
            $this->container
        );
    }

    /**
     * Create a GetGamesFromIgdbCommand with all required dependencies.
     */
    public function createGetGamesFromIgdbCommand(): GetGamesFromIgdbCommand
    {
        return new GetGamesFromIgdbCommand(
            $this->progressHandler,
            $this->dbService,
            $this->container
        );
    }

    /**
     * Create a GetExtensionsFromIgdbCommand with all required dependencies.
     */
    public function createGetExtensionsFromIgdbCommand(): GetExtensionsFromIgdbCommand
    {
        return new GetExtensionsFromIgdbCommand(
            $this->progressHandler,
            $this->dbService,
            $this->container
        );
    }
}
