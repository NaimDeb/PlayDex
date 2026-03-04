<?php

namespace App\State\Processor;

use ApiPlatform\Metadata\Operation;
use App\Entity\Report;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Component\HttpKernel\Exception\BadRequestHttpException;

class ReportDeleteProcessor extends AbstractProcessor
{
    public function __construct(EntityManagerInterface $entityManager)
    {
        parent::__construct($entityManager, null);
    }

    public function process(mixed $data, Operation $operation, array $uriVariables = [], array $context = []): void
    {
        if (!$data instanceof Report) {
            return;
        }

        if ($data->isDeleted()) {
            throw new BadRequestHttpException('This report has already been deleted.');
        }

        $this->softDelete($data);
    }
}
