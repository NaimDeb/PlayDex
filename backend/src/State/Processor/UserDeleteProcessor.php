<?php

namespace App\State\Processor;

use ApiPlatform\Metadata\Operation;
use App\Entity\User;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Component\HttpKernel\Exception\BadRequestHttpException;

class UserDeleteProcessor extends AbstractProcessor
{
    public function __construct(EntityManagerInterface $entityManager)
    {
        parent::__construct($entityManager, null);
    }

    public function process(mixed $data, Operation $operation, array $uriVariables = [], array $context = []): void
    {
        if (!$data instanceof User) {
            return;
        }

        if ($data->isDeleted()) {
            throw new BadRequestHttpException('This user has already been deleted.');
        }

        $this->softDelete($data);
    }
}
