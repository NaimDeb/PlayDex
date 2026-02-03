<?php

namespace App\Command;

// ! You HAVE to use --no-debug to avoid memory leaks

use App\Command\Base\AbstractDataImporterCommand;
use App\Config\Api\IGDB\IgdbExtensionDefinition;
use App\Config\Api\DataImportDefinition;
use App\Service\DatabaseOperationService;
use App\Service\ProgressBarHandlerService;
use Symfony\Component\Console\Attribute\AsCommand;
use Symfony\Component\DependencyInjection\ContainerInterface;

#[AsCommand(
    name: 'app:get-extensions-from-igdb',
    aliases: ['app:igdb:extensions'],
    description: 'Fetches the extensions/DLCs from IGDB and stores them in the database.',
)]
class GetExtensionsFromIgdbCommand extends AbstractDataImporterCommand
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
        return new IgdbExtensionDefinition();
    }
}
