<?php

namespace App\Command;

use App\Command\Base\AbstractDataImporterCommand;
use App\Config\Api\IGDB\IgdbGenreDefinition;
use App\Config\Api\DataImportDefinition;
use App\Service\DatabaseOperationService;
use App\Service\ProgressBarHandlerService;
use Symfony\Component\Console\Attribute\AsCommand;
use Symfony\Component\DependencyInjection\ContainerInterface;

#[AsCommand(
    name: 'app:get-genres-from-igdb',
    aliases: ['app:fetch-genres'],
    description: 'Fetches the genres from IGDB and stores them in the database.',
)]
class GetGenresFromIgdbCommand extends AbstractDataImporterCommand
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
        return new IgdbGenreDefinition();
    }
}
