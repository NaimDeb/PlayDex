<?php

namespace App\Tests\Unit\State\Provider;

use ApiPlatform\Metadata\Get;
use ApiPlatform\Metadata\GetCollection;
use ApiPlatform\State\ProviderInterface;
use App\Entity\Modification;
use App\Entity\Patchnote;
use App\Repository\ReportRepository;
use App\State\Provider\AdminModificationProvider;
use Doctrine\ORM\EntityManagerInterface;
use PHPUnit\Framework\TestCase;

class AdminModificationProviderTest extends TestCase
{
    private EntityManagerInterface $entityManager;
    private ReportRepository $reportRepository;
    private ProviderInterface $collectionProvider;
    private AdminModificationProvider $provider;

    protected function setUp(): void
    {
        $this->entityManager = $this->createMock(EntityManagerInterface::class);
        $this->reportRepository = $this->createMock(ReportRepository::class);
        $this->collectionProvider = $this->createMock(ProviderInterface::class);

        $this->provider = new AdminModificationProvider(
            $this->entityManager,
            $this->reportRepository,
            $this->collectionProvider
        );
    }

    public function testProvideFiltersDeletedModifications(): void
    {
        $mod1 = $this->createModificationMock(false, false, 1);
        $mod2 = $this->createModificationMock(true, false, 2); // deleted

        $this->collectionProvider->method('provide')->willReturn([$mod1, $mod2]);
        $this->reportRepository->method('countReportsForEntity')->willReturn(0);

        $result = $this->provider->provide(new GetCollection(), []);

        $this->assertCount(1, $result);
    }

    public function testProvideFiltersModificationsWithDeletedPatchnotes(): void
    {
        $deletedPatchnote = $this->createMock(Patchnote::class);
        $deletedPatchnote->method('isDeleted')->willReturn(true);

        $mod = $this->createMock(Modification::class);
        $mod->method('isDeleted')->willReturn(false);
        $mod->method('getPatchnote')->willReturn($deletedPatchnote);

        $this->collectionProvider->method('provide')->willReturn([$mod]);

        $result = $this->provider->provide(new GetCollection(), []);

        $this->assertCount(0, $result);
    }

    public function testProvideAddsReportCount(): void
    {
        $patchnote = $this->createMock(Patchnote::class);
        $patchnote->method('isDeleted')->willReturn(false);

        $mod = $this->createMock(Modification::class);
        $mod->method('isDeleted')->willReturn(false);
        $mod->method('getPatchnote')->willReturn($patchnote);
        $mod->method('getId')->willReturn(42);
        $mod->expects($this->once())->method('setReportCount')->with(3);

        $this->collectionProvider->method('provide')->willReturn([$mod]);
        $this->reportRepository->method('countReportsForEntity')
            ->with('Modification', 42)
            ->willReturn(3);

        $result = $this->provider->provide(new GetCollection(), []);

        $this->assertCount(1, $result);
    }

    public function testProvideReturnsDataForNonCollectionOperation(): void
    {
        $data = new \stdClass();
        $this->collectionProvider->method('provide')->willReturn($data);

        $result = $this->provider->provide(new Get(), []);

        $this->assertSame($data, $result);
    }

    private function createModificationMock(bool $isDeleted, bool $patchnoteDeleted, int $id): Modification
    {
        $patchnote = $this->createMock(Patchnote::class);
        $patchnote->method('isDeleted')->willReturn($patchnoteDeleted);

        $mod = $this->createMock(Modification::class);
        $mod->method('isDeleted')->willReturn($isDeleted);
        $mod->method('getPatchnote')->willReturn($patchnote);
        $mod->method('getId')->willReturn($id);

        return $mod;
    }
}
