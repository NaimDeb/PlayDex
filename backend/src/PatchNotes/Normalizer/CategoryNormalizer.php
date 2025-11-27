<?php

declare(strict_types=1);

namespace App\PatchNotes\Normalizer;

use App\PatchNotes\Contract\CategoryNormalizerInterface;

/**
 * Normalise les catégories en quelque chose de cohérent.
 */
final class CategoryNormalizer implements CategoryNormalizerInterface
{
    public function normalize(string $rawCategory): string
    {
        $normalized = mb_strtolower(trim($rawCategory));

        // On enlève les # éventuels
        $normalized = preg_replace('/^[#\s]+/', '', $normalized) ?? $normalized;

        // Cartographie simple pour normaliser vers des catégories larges et explicites
        $map = [
            // Bugfixes
            'bug fixes' => 'Bug Fixes',
            'bugfixes' => 'Bug Fixes',
            'bugs' => 'Bug Fixes',
            'fixes' => 'Bug Fixes',
            'bug' => 'Bug Fixes',

            // New content / additions
            'new' => 'New Content',
            'added' => 'New Content',
            'introduc' => 'New Content',
            'sets' => 'New Content',

            // Balance-related
            'balance' => 'Balance',
            'balancing' => 'Balance',

            // Gameplay / champions
            'champions' => 'New Content',
            'heroes'    => 'New Content',
            'characters'=> 'New Content',

            // Items
            'items' => 'New Content',
            'weapons' => 'New Content',

            // Generic
            'general' => 'Other',
            'misc'    => 'Other',
            'miscellaneous' => 'Other',
        ];

        foreach ($map as $key => $value) {
            if (str_contains($normalized, $key)) {
                return $value;
            }
        }

        // Par défaut, ne pas créer de catégorie spécifique : utiliser 'Other'
        return 'Other';
    }
}
