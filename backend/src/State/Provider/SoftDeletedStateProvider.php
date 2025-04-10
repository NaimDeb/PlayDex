<?php

namespace App\State\Provider;

use ApiPlatform\Metadata\CollectionOperationInterface;
use ApiPlatform\Metadata\Operation;
use ApiPlatform\State\ProviderInterface;
use Doctrine\Common\Collections\Collection;
use Doctrine\ORM\EntityManagerInterface;
use Error;
use Symfony\Bundle\SecurityBundle\Security;
use Symfony\Component\DependencyInjection\Attribute\Autowire;
use Symfony\Component\HttpKernel\Exception\NotFoundHttpException;
use Symfony\Component\HttpKernel\HttpCache\Esi;

final class SoftDeletedStateProvider implements ProviderInterface
{
    public function __construct(
        private EntityManagerInterface $entityManager,
        private Security $security,
        #[Autowire(service: 'api_platform.doctrine.orm.state.item_provider')]
        private ProviderInterface $itemProvider,
        #[Autowire(service: 'api_platform.doctrine.orm.state.collection_provider')]
        private ProviderInterface $collectionProvider,

    ) {}

    public function provide(Operation $operation, array $uriVariables = [], array $context = []): object|array|null
    {
        // Get data from the default provider
        $data = $operation instanceof CollectionOperationInterface
            ? $this->collectionProvider->provide($operation, $uriVariables, $context)
            : $this->itemProvider->provide($operation, $uriVariables, $context);

        // Only for non admins, admins can see deleted items
        if (!$this->security->isGranted('ROLE_ADMIN')) {
            // For a single item
            if ($operation instanceof CollectionOperationInterface === false) {
                if (method_exists($data, 'isDeleted') && $data->isDeleted()) {
                    throw new NotFoundHttpException('Resource not found.');
                }
                return $data;
            }

            $filteredData = [];
            foreach ($data as $item) {
                if (method_exists($item, 'isDeleted') && $item->isDeleted() !== true) {
                    $filteredData[] = $item;
                }
            }
            return $filteredData;
        }

        return $data;
    }
}
