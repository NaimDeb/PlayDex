<?php

declare(strict_types=1);

namespace App\PatchNotes\Contract;

/**
 * Interface d'extraction du titre.
 */
interface TitleExtractorInterface
{
    /**
     * @param string[] $lines
     */
    public function extract(array $lines): string;
}
