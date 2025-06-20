<?php
namespace App\Service;

use App\Entity\User;
use App\Entity\Warning;
use Doctrine\ORM\EntityManagerInterface;

class WarningService
{
    public function __construct(
        private EntityManagerInterface $em
    ) {}

    // Todo : Add reason for warning
    public function warnUserForDeletion(
        User $target,
        ?User $admin,
    ): void {
        $warning = new Warning();
        $warning->setReportedUserId($target);
        $warning->setWarnedBy($admin);
        $this->em->persist($warning);
    }
}