<?php

declare(strict_types=1);

namespace App\Interfaces\DataPersister;

use ApiPlatform\Metadata\Operation;

/**
 * Base interface for API Platform data persisters.
 * Standardizes the processor interface for all persisters.
 */
interface DataPersisterInterface
{
    /**
     * Process the data and return the result.
     *
     * @param mixed $data The data to process
     * @param Operation $operation The API Platform operation
     * @param array<string, mixed> $uriVariables URI variables
     * @param array<string, mixed> $context Additional context
     * @return mixed The processed data
     */
    public function process(mixed $data, Operation $operation, array $uriVariables = [], array $context = []): mixed;
}
