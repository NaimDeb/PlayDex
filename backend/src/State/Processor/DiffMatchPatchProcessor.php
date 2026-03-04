<?php

namespace App\State\Processor;

use ApiPlatform\Metadata\Operation;
use App\Entity\Modification;
use App\Entity\Patchnote;
use App\Entity\User;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Bundle\SecurityBundle\Security;
use DiffMatchPatch\DiffMatchPatch;
use Symfony\Component\HttpFoundation\RequestStack;

class DiffMatchPatchProcessor extends AbstractProcessor
{
    public function __construct(
        EntityManagerInterface $entityManager,
        Security $security,
        private RequestStack $requestStack,
    ) {
        parent::__construct($entityManager, $security);
    }

    public function process(mixed $data, Operation $operation, array $uriVariables = [], array $context = []): void
    {
        $user = $this->getAuthenticatedUser();

        $modifiedPatchnote = $data;

        if ($this->entityManager->contains($modifiedPatchnote)) {
            $this->entityManager->detach($modifiedPatchnote);
        }

        $oldPatchnote = $this->entityManager->getRepository(Patchnote::class)->findOneBy(['id' => $modifiedPatchnote->getId()]);

        $oldContent = $oldPatchnote ? $oldPatchnote->getContent() : '';
        $newContent = $modifiedPatchnote->getContent();

        $dmp = new DiffMatchPatch();
        $diffs = $dmp->diff_main($oldContent, $newContent, false);
        $dmp->diff_cleanupSemantic($diffs);
        $dmp->diff_cleanupEfficiency($diffs);

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
        $modification->setCreatedAtValue();

        $this->entityManager->persist($modification);
    }
}
