<?php

namespace App\State\Processor;

use ApiPlatform\Metadata\Operation;
use App\Entity\Patchnote;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Bundle\SecurityBundle\Security;
use Symfony\Component\HttpKernel\Exception\BadRequestHttpException;
use App\Service\SoftDeleteService;

class PatchnoteDeleteProcessor extends AbstractProcessor
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
        if (!$data instanceof Patchnote) {
            return;
        }

        if ($data->isDeleted()) {
            throw new BadRequestHttpException('This patchnote has already been deleted.');
        }

        foreach ($data->getModification() as $modification) {
            $modification->setIsDeleted(true);
            $this->entityManager->persist($modification);
            $this->softDeleteService->softDeleteRelatedReports('Modification', $modification->getId());
        }

        $this->softDeleteService->softDeleteWithReports($data, 'Patchnote', 'createdBy');
    }
}
