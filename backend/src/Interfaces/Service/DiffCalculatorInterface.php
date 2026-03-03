<?php

declare(strict_types=1);

namespace App\Interfaces\Service;

/**
 * Interface for calculating differences between text versions.
 * Used for tracking modifications to patchnotes.
 */
interface DiffCalculatorInterface
{
    /**
     * Calculate the difference between two texts.
     *
     * @return array<int, array{0: int, 1: string}> Array of diff operations
     *         Each operation is [operation_type, text] where:
     *         - 0 = equal
     *         - -1 = delete
     *         - 1 = insert
     */
    public function calculate(string $oldText, string $newText): array;

    /**
     * Apply a diff to produce the new text.
     *
     * @param array<int, array{0: int, 1: string}> $diff
     */
    public function apply(string $oldText, array $diff): string;

    /**
     * Convert diff to a human-readable format.
     *
     * @param array<int, array{0: int, 1: string}> $diff
     */
    public function toHtml(array $diff): string;
}
