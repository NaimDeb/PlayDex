<?php

namespace App\DataPersister;

use ApiPlatform\Metadata\Operation;
use ApiPlatform\State\ProcessorInterface;
use App\Entity\Patchnote;
use App\Entity\Report;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Bundle\SecurityBundle\Security;
use Symfony\Component\HttpKernel\Exception\BadRequestHttpException;
use App\Service\WarningService;

class PatchnoteDeleteProcessor implements ProcessorInterface
{
    public function __construct(
        private EntityManagerInterface $entityManager,
        private WarningService $warningService,
        private Security $security 
    ) {}

    public function process(mixed $data, Operation $operation, array $uriVariables = [], array $context = []): void
    {
        if (!$data instanceof Patchnote) {
            return;
        }

        // Check if already deleted
        if ($data->isDeleted()) {
            throw new BadRequestHttpException('This patchnote has already been deleted.');
        }

        // Soft delete the patchnote
        $data->setIsDeleted(true);

        // Cascade soft delete to all related modifications
        foreach ($data->getModification() as $modification) {
            $modification->setIsDeleted(true);
            $this->entityManager->persist($modification);

            // Find related reports for this modification
            $reports = $this->entityManager->getRepository(Report::class)->findBy([
                'reportableEntity' => 'Modification',
                'reportableId' => $modification->getId(),
                'isDeleted' => false
            ]);

            // Soft delete related reports
            foreach ($reports as $report) {
                $report->setIsDeleted(true);
                $this->entityManager->persist($report);
            }
        }

        // Find related reports for this patchnote
        $reports = $this->entityManager->getRepository(Report::class)->findBy([
            'reportableEntity' => 'Patchnote',
            'reportableId' => $data->getId(),
            'isDeleted' => false
        ]);

        // Soft delete related reports
        foreach ($reports as $report) {
            $report->setIsDeleted(true);
            $this->entityManager->persist($report);
        }

        // Save all changes
        $this->entityManager->persist($data);
        $this->entityManager->flush();

        $author = $data->getCreatedBy(); 
        $admin = $this->security->getUser();

        if ($author && $author !== $admin) {
            $this->warningService->warnUserForDeletion(
                target: $author,
                admin: $admin,
                reason: sprintf('Votre %s a été supprimé par un administrateur.', $data instanceof Patchnote ? 'patchnote' : 'modification')
            );
        }

    }
}
