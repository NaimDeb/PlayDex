<?php

namespace App\State\Processor;

use ApiPlatform\Metadata\Operation;
use App\Entity\Modification;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Bundle\SecurityBundle\Security;
use Symfony\Component\HttpKernel\Exception\BadRequestHttpException;
use App\Service\SoftDeleteService;

class ModificationDeleteProcessor extends AbstractProcessor
{
    public function __construct(
        EntityManagerInterface $entityManager,
        private SoftDeleteService $softDeleteService,
        Security $security
    ) {
        parent::__construct($entityManager, $security);
    }

    public function process(mixed $data, Operation $operation, array $uriVariables = [], array $context = []): void
    {
        if (!$data instanceof Modification) {
            return;
        }

        if ($data->isDeleted()) {
            throw new BadRequestHttpException('This modification has already been deleted.');
        }

        $this->softDeleteService->softDeleteWithReports($data, 'Modification', 'user');
    }
}
