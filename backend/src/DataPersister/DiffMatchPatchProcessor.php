<?php

namespace App\DataPersister;

use ApiPlatform\Metadata\Operation;
use ApiPlatform\State\ProcessorInterface;
use ApiPlatform\Symfony\EventListener\EventPriorities;
use App\Entity\Modification;
use App\Entity\Patchnote;
use App\Entity\User;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Bundle\SecurityBundle\Security;
use Symfony\Component\HttpKernel\Exception\BadRequestHttpException;
use DiffMatchPatch\DiffMatchPatch;
use Symfony\Component\HttpFoundation\Exception\BadRequestException;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\RequestStack;
use Symfony\Component\HttpKernel\KernelEvents;

class DiffMatchPatchProcessor implements ProcessorInterface
{

    public function __construct(
        private EntityManagerInterface $entityManager,
        private readonly Security $security,
        private RequestStack $requestStack,
    ) {}

    public function process(mixed $data, Operation $operation, array $uriVariables = [], array $context = []): void
    {
        $user = $this->security->getUser();

        if (!$user) {
            throw new BadRequestHttpException('You are not logged in');
        }

        /**
         * @var Patchnote $modifiedPatchnote
         */
        $modifiedPatchnote = $data;

        // Ensure we're getting the original unmodified entity from the database
        // Detach any tracked entity with same ID first
        if ($this->entityManager->contains($modifiedPatchnote)) {
            $this->entityManager->detach($modifiedPatchnote);
        }

        // Get a clean copy from the database
        $oldPatchnote = $this->entityManager->getRepository(Patchnote::class)->findOneBy(['id' => $modifiedPatchnote->getId()]);

        $oldContent = $oldPatchnote ? $oldPatchnote->getContent() : '';
        $newContent = $modifiedPatchnote->getContent();


        $dmp = new DiffMatchPatch();
        $diffs = $dmp->diff_main($oldContent, $newContent, false);

        // Todo : Use json_encode to not use th deprecated Array format, need to change the DB column.
        // $diffs(json_encode($diffs, JSON_PRETTY_PRINT));

        $this->modifyPatchnote($oldPatchnote, $modifiedPatchnote);
        $this->persistModification($diffs, $user, $oldPatchnote);

        $this->entityManager->flush();
    }

    private function modifyPatchnote(Patchnote $oldPatchnote, Patchnote $newContent): void
    {

        $properties = ['Title', 'Content', 'ReleasedAt', 'Importance', 'SmallDescription'];

        foreach ($properties as $property) {
            $getter = 'get' . $property;
            $setter = 'set' . $property;

            if ($newContent->$getter() !== null) {
                $oldPatchnote->$setter($newContent->$getter());
            }
        }

        $this->entityManager->persist($oldPatchnote);
    }

    private function persistModification(array $difference, User $user, Patchnote $patchnote): void
    {
        $modification = new Modification();
        $modification->setDifference($difference);
        $modification->setUser($user);
        $modification->setPatchnote($patchnote);
        $modification->setCreatedAt(new \DateTimeImmutable());

        $this->entityManager->persist($modification);
    }
}
