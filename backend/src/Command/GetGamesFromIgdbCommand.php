<?php

namespace App\Command;

// ! You HAVE to use --no-debug to avoid memory leaks

use App\Command\Base\AbstractDataImporterCommand;
use App\Config\Api\IGDB\IgdbGameDefinition;
use App\Config\Api\DataImportDefinition;
use App\Service\DatabaseOperationService;
use App\Service\ProgressBarHandlerService;
use Symfony\Component\Console\Attribute\AsCommand;
use Symfony\Component\DependencyInjection\ContainerInterface;

#[AsCommand(
    name: 'app:get-games-from-igdb',
    aliases: ['app:igdb:games'],
    description: 'Fetches the games from IGDB and stores them in the database.',
)]
class GetGamesFromIgdbCommand extends AbstractDataImporterCommand
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
        return new IgdbGameDefinition();
    }
}
