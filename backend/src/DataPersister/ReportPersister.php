<?php

namespace App\DataPersister;

use ApiPlatform\Metadata\Operation;
use ApiPlatform\State\ProcessorInterface;
use App\Entity\Report;
use App\Interfaces\ReportableInterface;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Bundle\SecurityBundle\Security;

class ReportPersister implements ProcessorInterface
{
    public function __construct(
        private readonly EntityManagerInterface $entityManager,
        private readonly Security $security,
    ) {}

    public function process(mixed $data, Operation $operation, array $uriVariables = [], array $context = []): Report
    {
        // Check if the data is an instance of Report
        if (!$data instanceof Report) {
            return $data;
        }

        // Check if the user is authenticated
        $user = $this->security->getUser();
        if (!$user) {
            throw new \Symfony\Component\Security\Core\Exception\AccessDeniedException('Not authenticated');
        }

        // Validate the reportable entity class and ID
        $reportableEntityClass = "App\\Entity\\" . $data->getReportableEntity();
        if (!class_exists($reportableEntityClass) || !in_array(ReportableInterface::class, class_implements($reportableEntityClass))) {
            throw new \InvalidArgumentException('The specified reportable entity does not implement ReportableInterface.');
        }


        $repository = $this->entityManager->getRepository($reportableEntityClass);
        $reportableId = $data->getReportableId();
        $entity = $repository->find($reportableId);

        // Check if the entity exists
        if (!$entity) {
            throw new \InvalidArgumentException('The entity with the ID: ' . $reportableId . ' does not exist.');
        }

        // Check if the user has already reported this entity
        $existingReport = $this->entityManager->getRepository(Report::class)->findOneBy([
            'reportedBy' => $user,
            'reportableId' => $reportableId,
            'reportableEntity' => $data->getReportableEntity(),
        ]);

        if ($existingReport) {
            throw new \InvalidArgumentException('You have already reported this entity.');
        }

        // Set the reportable entity and ID
        $data->setReportedBy($user);
        $data->setReportedAt(new \DateTimeImmutable());
        $data->setReportableEntity($reportableEntityClass);

        $this->entityManager->persist($data);
        $this->entityManager->flush();

        return $data;
    }
}