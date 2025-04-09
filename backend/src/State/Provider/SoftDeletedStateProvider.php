<?php

namespace App\State\Provider;

use ApiPlatform\Metadata\Operation;
use ApiPlatform\State\ProviderInterface;
use Doctrine\ORM\EntityManagerInterface;
use Error;
use Symfony\Bundle\SecurityBundle\Security;
use Symfony\Component\DependencyInjection\Attribute\Autowire;
use Symfony\Component\HttpKernel\Exception\NotFoundHttpException;

final class SoftDeletedStateProvider implements ProviderInterface
{
    public function __construct(
        private EntityManagerInterface $entityManager,
        private Security $security,
        #[Autowire(service: 'api_platform.doctrine.orm.state.item_provider')]
        private ProviderInterface $itemProvider,
    ) {}

    public function provide(Operation $operation, array $uriVariables = [], array $context = []): object|array|null
    {
        // Get data from the default provider
        $data = $this->itemProvider->provide($operation, $uriVariables, $context);
        
        // For a single item
        if (!is_array($data) || !isset($data[0])) {
            if (method_exists($data, 'isDeleted') && $data->isDeleted() && !$this->security->isGranted('ROLE_ADMIN')) {
                throw new NotFoundHttpException('Resource not found.');
            }
            return $data;
        }
        
        // For collection
        if (!$this->security->isGranted('ROLE_ADMIN')) {
            return array_filter($data, function ($item) {
                return !method_exists($item, 'isDeleted') || !$item->isDeleted();
            });
        }
        
        return $data;
    }
}

// Todo : Check if works! !!!! !! !! ! !! !! PLEASE CHECK