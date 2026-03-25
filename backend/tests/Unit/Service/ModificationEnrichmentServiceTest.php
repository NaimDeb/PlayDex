<?php

namespace App\Tests\Unit\Service;

use App\Entity\Modification;
use App\Entity\Patchnote;
use App\Entity\User;
use App\Repository\ReportRepository;
use App\Service\ModificationEnrichmentService;
use PHPUnit\Framework\TestCase;

class ModificationEnrichmentServiceTest extends TestCase
{
    private ReportRepository $reportRepository;
    private ModificationEnrichmentService $service;

    protected function setUp(): void
    {
        $this->reportRepository = $this->createMock(ReportRepository::class);
        $this->service = new ModificationEnrichmentService($this->reportRepository);
    }

    public function testEnrichModificationAddsReportCount(): void
    {
        $modification = $this->createMock(Modification::class);
        $modification->method('getId')->willReturn(1);
        $modification->method('getCreatedAt')->willReturn(new \DateTimeImmutable());
        $modification->method('getUser')->willReturn(new User());
        $modification->method('getPatchnote')->willReturn(new Patchnote());
        $modification->method('getDifference')->willReturn([]);
        $modification->method('isDeleted')->willReturn(false);

        $this->reportRepository->method('countReportsForEntity')
            ->with('Modification', 1)
            ->willReturn(5);

        $result = $this->service->enrichModification($modification);

        $this->assertEquals(5, $result['reportCount']);
    }

    public function testEnrichModificationReturnsAllFields(): void
    {
        $modification = $this->createMock(Modification::class);
        $modification->method('getId')->willReturn(1);
        $modification->method('getCreatedAt')->willReturn(new \DateTimeImmutable());
        $modification->method('getUser')->willReturn(new User());
        $modification->method('getPatchnote')->willReturn(new Patchnote());
        $modification->method('getDifference')->willReturn(['diff']);
        $modification->method('isDeleted')->willReturn(false);

        $this->reportRepository->method('countReportsForEntity')->willReturn(0);

        $result = $this->service->enrichModification($modification);

        $this->assertArrayHasKey('id', $result);
        $this->assertArrayHasKey('createdAt', $result);
        $this->assertArrayHasKey('user', $result);
        $this->assertArrayHasKey('patchnote', $result);
        $this->assertArrayHasKey('difference', $result);
        $this->assertArrayHasKey('isDeleted', $result);
        $this->assertArrayHasKey('reportCount', $result);
    }

    public function testEnrichModificationsProcessesMultiple(): void
    {
        $mod1 = $this->createMock(Modification::class);
        $mod1->method('getId')->willReturn(1);
        $mod1->method('getCreatedAt')->willReturn(new \DateTimeImmutable());
        $mod1->method('getUser')->willReturn(null);
        $mod1->method('getPatchnote')->willReturn(null);
        $mod1->method('getDifference')->willReturn([]);
        $mod1->method('isDeleted')->willReturn(false);

        $mod2 = $this->createMock(Modification::class);
        $mod2->method('getId')->willReturn(2);
        $mod2->method('getCreatedAt')->willReturn(new \DateTimeImmutable());
        $mod2->method('getUser')->willReturn(null);
        $mod2->method('getPatchnote')->willReturn(null);
        $mod2->method('getDifference')->willReturn([]);
        $mod2->method('isDeleted')->willReturn(false);

        $this->reportRepository->method('countReportsForEntity')->willReturn(0);

        $result = $this->service->enrichModifications([$mod1, $mod2]);

        $this->assertCount(2, $result);
    }
}
