<?php

namespace App\Command;

use App\Command\Base\AbstractDataImporterCommand;
use App\Config\Api\IGDB\IgdbCompanyDefinition;
use App\Config\Api\DataImportDefinition;
use App\Service\DatabaseOperationService;
use App\Service\ProgressBarHandlerService;
use Symfony\Component\Console\Attribute\AsCommand;
use Symfony\Component\DependencyInjection\ContainerInterface;

#[AsCommand(
    name: 'app:get-companies-from-igdb',
    aliases: ['app:igdb:companies'],
    description: 'Fetches the companies from IGDB and stores them in the database.',
)]
class GetCompaniesFromIgdbCommand extends AbstractDataImporterCommand
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
        return new IgdbCompanyDefinition();
    }
}
