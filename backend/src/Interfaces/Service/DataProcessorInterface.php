<?php

declare(strict_types=1);

namespace App\Interfaces\Service;

/**
 * Interface for data processors that transform external data into entities.
 * Used for batch processing of IGDB data, etc.
 */
interface DataProcessorInterface
{
    /**
     * Process a batch of raw data.
     *
     * @param array<int, array<string, mixed>> $data Raw data from external source
     * @return int Number of items processed
     */
    public function process(array $data): int;

    /**
     * Get the name of this processor.
     */
    public function getName(): string;

    /**
     * Check if the processor supports a data type.
     */
    public function supports(string $dataType): bool;
}
