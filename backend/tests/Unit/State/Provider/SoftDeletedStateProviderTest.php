<?php

namespace App\Tests\Unit\State\Provider;

use ApiPlatform\Metadata\Get;
use ApiPlatform\Metadata\GetCollection;
use ApiPlatform\State\ProviderInterface;
use App\State\Provider\SoftDeletedStateProvider;
use Doctrine\ORM\EntityManagerInterface;
use PHPUnit\Framework\TestCase;
use Symfony\Bundle\SecurityBundle\Security;
use Symfony\Component\HttpKernel\Exception\NotFoundHttpException;

class SoftDeletedStateProviderTest extends TestCase
{
    private EntityManagerInterface $entityManager;
    private Security $security;
    private ProviderInterface $itemProvider;
    private ProviderInterface $collectionProvider;

    protected function setUp(): void
    {
        $this->entityManager = $this->createMock(EntityManagerInterface::class);
        $this->security = $this->createMock(Security::class);
        $this->itemProvider = $this->createMock(ProviderInterface::class);
        $this->collectionProvider = $this->createMock(ProviderInterface::class);
    }

    private function createProvider(): SoftDeletedStateProvider
    {
        return new SoftDeletedStateProvider(
            $this->entityManager,
            $this->security,
            $this->itemProvider,
            $this->collectionProvider
        );
    }

    public function testProvideFiltersDeletedItemsForNonAdmin(): void
    {
        $this->security->method('isGranted')->with('ROLE_ADMIN')->willReturn(false);

        $item1 = $this->createSoftDeletableItem(false);
        $item2 = $this->createSoftDeletableItem(true);
        $item3 = $this->createSoftDeletableItem(false);

        $this->collectionProvider->method('provide')->willReturn([$item1, $item2, $item3]);

        $provider = $this->createProvider();
        $result = $provider->provide(new GetCollection(), []);

        $this->assertCount(2, $result);
    }

    public function testProvideThrowsNotFoundForDeletedSingleItemForNonAdmin(): void
    {
        $this->security->method('isGranted')->with('ROLE_ADMIN')->willReturn(false);

        $deletedItem = $this->createSoftDeletableItem(true);
        $this->itemProvider->method('provide')->willReturn($deletedItem);

        $provider = $this->createProvider();

        $this->expectException(NotFoundHttpException::class);

        $provider->provide(new Get(), []);
    }

    public function testProvideReturnsAllItemsForAdmin(): void
    {
        $this->security->method('isGranted')->with('ROLE_ADMIN')->willReturn(true);

        $item1 = $this->createSoftDeletableItem(false);
        $item2 = $this->createSoftDeletableItem(true);

        $this->collectionProvider->method('provide')->willReturn([$item1, $item2]);

        $provider = $this->createProvider();
        $result = $provider->provide(new GetCollection(), []);

        $this->assertCount(2, $result);
    }

    public function testProvideReturnsNullWhenDataIsNull(): void
    {
        $this->itemProvider->method('provide')->willReturn(null);

        $provider = $this->createProvider();
        $result = $provider->provide(new Get(), []);

        $this->assertNull($result);
    }

    private function createSoftDeletableItem(bool $isDeleted): object
    {
        return new class($isDeleted) {
            public function __construct(private bool $deleted) {}
            public function isDeleted(): bool { return $this->deleted; }
        };
    }
}
