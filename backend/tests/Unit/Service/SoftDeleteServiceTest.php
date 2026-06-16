<?php

declare(strict_types=1);

namespace App\Tests\Unit\Service;

use App\Entity\Patchnote;
use App\Entity\Report;
use App\Entity\User;
use App\Service\SoftDeleteService;
use App\Service\WarningService;
use Doctrine\ORM\EntityManagerInterface;
use Doctrine\ORM\EntityRepository;
use PHPUnit\Framework\TestCase;
use Symfony\Bundle\SecurityBundle\Security;

/**
 * Tests de la suppression logique en cascade (modération).
 *
 * softDeleteWithReports() doit : marquer l'entité supprimée, soft-delete ses
 * signalements liés, et avertir l'auteur si ce n'est pas lui qui supprime.
 */
class SoftDeleteServiceTest extends TestCase
{
    /** Affecte un id à une entité (Doctrine ne le fait qu'en base). */
    private function setId(object $entity, int $id): void
    {
        $ref = new \ReflectionProperty($entity, 'id');
        $ref->setAccessible(true);
        $ref->setValue($entity, $id);
    }

    public function testSoftDeleteMarksEntityAndCascadesReports(): void
    {
        $author = (new User())->setEmail('author@test.com');
        $admin = (new User())->setEmail('moderator@test.com');

        $patchnote = (new Patchnote())->setTitle('À modérer')->setCreatedBy($author);
        $this->setId($patchnote, 1);
        $report = (new Report())->setReason('Contenu inapproprié');

        $reportRepo = $this->createMock(EntityRepository::class);
        $reportRepo->method('findBy')->willReturn([$report]);

        $em = $this->createMock(EntityManagerInterface::class);
        $em->method('getRepository')->with(Report::class)->willReturn($reportRepo);
        $em->expects($this->atLeastOnce())->method('persist');
        $em->expects($this->once())->method('flush');

        $security = $this->createMock(Security::class);
        $security->method('getUser')->willReturn($admin); // c'est l'admin qui supprime

        $warningService = $this->createMock(WarningService::class);
        $warningService->expects($this->once())
            ->method('warnUserForDeletion')
            ->with($author, $admin);

        $service = new SoftDeleteService($em, $security, $warningService);
        $service->softDeleteWithReports($patchnote, Patchnote::class, 'createdBy');

        $this->assertTrue($patchnote->isDeleted());
        $this->assertTrue($report->isDeleted()); // signalement lié soft-deleted
    }

    public function testAuthorIsNotWarnedWhenDeletingOwnContent(): void
    {
        $author = (new User())->setEmail('selfdel@test.com');

        $patchnote = (new Patchnote())->setTitle('Auto-suppression')->setCreatedBy($author);
        $this->setId($patchnote, 2);

        $reportRepo = $this->createMock(EntityRepository::class);
        $reportRepo->method('findBy')->willReturn([]);

        $em = $this->createMock(EntityManagerInterface::class);
        $em->method('getRepository')->willReturn($reportRepo);

        $security = $this->createMock(Security::class);
        $security->method('getUser')->willReturn($author); // l'auteur supprime lui-même

        $warningService = $this->createMock(WarningService::class);
        $warningService->expects($this->never())->method('warnUserForDeletion');

        $service = new SoftDeleteService($em, $security, $warningService);
        $service->softDeleteWithReports($patchnote, Patchnote::class, 'createdBy');

        $this->assertTrue($patchnote->isDeleted());
    }

    public function testNoWarningWhenNoAuthorPropertyGiven(): void
    {
        $patchnote = (new Patchnote())->setTitle('Sans auteur ciblé');
        $this->setId($patchnote, 3);

        $reportRepo = $this->createMock(EntityRepository::class);
        $reportRepo->method('findBy')->willReturn([]);

        $em = $this->createMock(EntityManagerInterface::class);
        $em->method('getRepository')->willReturn($reportRepo);

        $warningService = $this->createMock(WarningService::class);
        $warningService->expects($this->never())->method('warnUserForDeletion');

        $service = new SoftDeleteService($em, $this->createMock(Security::class), $warningService);
        $service->softDeleteWithReports($patchnote, Patchnote::class, null);

        $this->assertTrue($patchnote->isDeleted());
    }
}
