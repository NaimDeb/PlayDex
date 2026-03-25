<?php

namespace App\Tests\Unit\State\Provider;

use ApiPlatform\Metadata\Get;
use ApiPlatform\Metadata\GetCollection;
use ApiPlatform\State\ProviderInterface;
use App\Entity\Game;
use App\Entity\Modification;
use App\Entity\Patchnote;
use App\Entity\Report;
use App\Entity\User;
use App\Repository\ModificationRepository;
use App\Repository\PatchnoteRepository;
use App\State\Provider\AdminReportProvider;
use Doctrine\ORM\EntityManagerInterface;
use PHPUnit\Framework\TestCase;

class AdminReportProviderTest extends TestCase
{
    private EntityManagerInterface $entityManager;
    private PatchnoteRepository $patchnoteRepository;
    private ModificationRepository $modificationRepository;
    private ProviderInterface $collectionProvider;
    private AdminReportProvider $provider;

    protected function setUp(): void
    {
        $this->entityManager = $this->createMock(EntityManagerInterface::class);
        $this->patchnoteRepository = $this->createMock(PatchnoteRepository::class);
        $this->modificationRepository = $this->createMock(ModificationRepository::class);
        $this->collectionProvider = $this->createMock(ProviderInterface::class);

        $this->provider = new AdminReportProvider(
            $this->entityManager,
            $this->patchnoteRepository,
            $this->modificationRepository,
            $this->collectionProvider
        );
    }

    public function testProvideEnrichesReportsWithPatchnoteDetails(): void
    {
        $user = new User();
        $user->setUsername('author');

        $game = new Game();

        $patchnote = $this->createMock(Patchnote::class);
        $patchnote->method('getId')->willReturn(1);
        $patchnote->method('getTitle')->willReturn('Test Patchnote');
        $patchnote->method('getCreatedBy')->willReturn($user);
        $patchnote->method('getGame')->willReturn($game);

        $report = new Report();
        $report->setReportableEntity('App\\Entity\\Patchnote');
        $report->setReportableId(1);
        $report->setReason('test');

        $this->collectionProvider->method('provide')->willReturn([$report]);
        $this->patchnoteRepository->method('find')->with(1)->willReturn($patchnote);

        $result = $this->provider->provide(new GetCollection(), []);

        $this->assertCount(1, $result);
        $this->assertEquals('Patchnote', $result[0]->entityDetails['type']);
        $this->assertEquals('Test Patchnote', $result[0]->entityDetails['title']);
    }

    public function testProvideSkipsDeletedReports(): void
    {
        $report = new Report();
        $report->setIsDeleted(true);
        $report->setReportableEntity('Patchnote');
        $report->setReportableId(1);

        $this->collectionProvider->method('provide')->willReturn([$report]);

        $result = $this->provider->provide(new GetCollection(), []);

        $this->assertCount(0, $result);
    }

    public function testProvideHandlesUnknownEntityType(): void
    {
        $report = new Report();
        $report->setReportableEntity('UnknownEntity');
        $report->setReportableId(1);
        $report->setReason('test');

        $this->collectionProvider->method('provide')->willReturn([$report]);

        $result = $this->provider->provide(new GetCollection(), []);

        $this->assertCount(1, $result);
        $this->assertEquals('UnknownEntity', $result[0]->entityDetails['type']);
        $this->assertEquals('Entité inconnue', $result[0]->entityDetails['title']);
    }

    public function testProvideReturnsDataForNonCollectionOperation(): void
    {
        $data = new \stdClass();
        $this->collectionProvider->method('provide')->willReturn($data);

        $result = $this->provider->provide(new Get(), []);

        $this->assertSame($data, $result);
    }
}
