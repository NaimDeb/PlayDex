<?php

namespace App\State\Provider;

use ApiPlatform\Metadata\CollectionOperationInterface;
use ApiPlatform\Metadata\Operation;
use ApiPlatform\State\ProviderInterface;
use Symfony\Component\HttpKernel\Exception\NotFoundHttpException;

final class SoftDeletedStateProvider implements ProviderInterface
{
    public function __construct(
    ) {}

    public function provide(Operation $operation, array $uriVariables = [], array $context = []): object|array|null
    {

        // Call the decorated provider to get the result
        $result = $this->provide($operation, $uriVariables, $context);   


        // Handle collection
        if ($operation instanceof CollectionOperationInterface && is_array($result)) {
            return array_filter($result, function ($item) {
                // Filter out deleted items if the method exists
                return method_exists($item, 'isDeleted') ? !$item->isDeleted() : true;
            });
        }

        // Handle single item
        if ($result !== null && method_exists($result, 'isDeleted') && $result->isDeleted()) {
            throw new NotFoundHttpException('Resource not found');
        }

        return $result;
    }
}