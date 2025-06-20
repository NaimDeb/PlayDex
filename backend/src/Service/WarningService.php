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

    public function warnUserForDeletion(
        User $target,
        ?User $admin,
        string $reason = 'Un de vos contenus a été supprimé.',
    ): void {
        $warning = new Warning();
        $warning->setReportedUserId($target);
        $warning->setWarnedBy($admin);
        $warning->setReason($reason);
        $this->em->persist($warning);
    }
}