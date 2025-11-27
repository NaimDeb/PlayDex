<?php

declare(strict_types=1);

namespace App\PatchNotes\Extractor;

use App\PatchNotes\Contract\TitleExtractorInterface;

/**
 * Extracteur de titre très simple : première ligne non vide, avec nettoyage optionnel.
 */
final class SimpleTitleExtractor implements TitleExtractorInterface
{
    /**
     * @param string[] $lines
     */
    public function extract(array $lines): string
    {
        foreach ($lines as $line) {
            $trimmed = trim($line);
            if ($trimmed === '') {
                continue;
            }

            // Si c'est déjà un titre Markdown (# ...)
            if (str_starts_with($trimmed, '#')) {
                return ltrim($trimmed, "# \t");
            }

            // Si ça ressemble à un titre de patch (Patch X.Y, Version, etc.)
            if (preg_match('/(patch|version|update)\s+\d+/i', $trimmed)) {
                return $trimmed;
            }

            // Par défaut : première ligne non vide
            return $trimmed;
        }

        return 'Untitled Patch';
    }
}
