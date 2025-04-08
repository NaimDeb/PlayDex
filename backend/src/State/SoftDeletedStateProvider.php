<?php

namespace App\State;

use ApiPlatform\Metadata\CollectionOperationInterface;
use ApiPlatform\Metadata\Operation;
use ApiPlatform\State\ProviderInterface;
use Symfony\Component\HttpKernel\Exception\NotFoundHttpException;

class SoftDeletedStateProvider implements ProviderInterface
{
    public function __construct(
        private ProviderInterface $decorated
    ) {}

    public function provide(Operation $operation, array $uriVariables = [], array $context = []): object|array|null
    {
        $result = $this->decorated->provide($operation, $uriVariables, $context);

        // Handle collection
        if ($operation instanceof CollectionOperationInterface && is_array($result)) {
            return array_filter($result, function ($item) {
                // Filter out deleted items if the method exists
                return method_exists($item, 'isDeleted') ? !$item->isDeleted() : true;
            });
        }

        // Handle single item
        if ($result !== null && method_exists($result, 'isDeleted') && $result->isDeleted()) {
            throw new NotFoundHttpException('The requested resource has been deleted.');
        }

        return $result;
    }
}
