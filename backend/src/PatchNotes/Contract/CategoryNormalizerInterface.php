<?php

declare(strict_types=1);

namespace App\PatchNotes\Contract;

/**
 * Interface de normalisation des catégories.
 */
interface CategoryNormalizerInterface
{
    public function normalize(string $rawCategory): string;
}
