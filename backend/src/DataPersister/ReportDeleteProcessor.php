<?php

namespace App\DataPersister;

use ApiPlatform\Metadata\Operation;
use ApiPlatform\State\ProcessorInterface;
use App\Entity\Report;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Component\HttpKernel\Exception\BadRequestHttpException;

class ReportDeleteProcessor implements ProcessorInterface
{
    public function __construct(
        private EntityManagerInterface $entityManager
    ) {}

    public function process(mixed $data, Operation $operation, array $uriVariables = [], array $context = []): void
    {
        if (!$data instanceof Report) {
            return;
        }

        // Check if already deleted
        if ($data->isDeleted()) {
            throw new BadRequestHttpException('This report has already been deleted.');
        }

        // Soft delete by setting isDeleted to true
        $data->setIsDeleted(true);

        // Save the changes
        $this->entityManager->persist($data);
        $this->entityManager->flush();
    }
}
