<?php

declare(strict_types=1);

namespace App\PatchNotes\Analyzer;

use App\PatchNotes\ChangeType;
use App\PatchNotes\Contract\PatchNoteAnalyzerInterface;
use App\PatchNotes\PatchChange;
use App\PatchNotes\PatchNoteAnalysis;

/**
 * Analyseur : calcule score, stats, et type de patch (major / medium / minor).
 */
final class PatchNoteAnalyzer implements PatchNoteAnalyzerInterface
{
    /**
     * @param PatchChange[] $changes
     */
    public function analyze(array $changes): PatchNoteAnalysis
    {
        $totalChanges = count($changes);
        $changesByType = [];
        $changesByCategory = [];
        $score = 0;

        foreach ($changes as $change) {
            $type = $change->getType();
            $typeKey = $type->value;

            if (!isset($changesByType[$typeKey])) {
                $changesByType[$typeKey] = 0;
            }
            $changesByType[$typeKey]++;

            $category = $change->getCategory();
            if (!isset($changesByCategory[$category])) {
                $changesByCategory[$category] = 0;
            }
            $changesByCategory[$category]++;

            // Poids par type
            $score += match ($type) {
                ChangeType::BUFF,
                ChangeType::DEBUFF,
                ChangeType::REWORK => 3,
                ChangeType::FIX => 2,
                ChangeType::OTHER => 1,
            };
        }

        // Bonus selon le volume de changements
        if ($totalChanges >= 30) {
            $score += 10;
        } elseif ($totalChanges >= 15) {
            $score += 5;
        } elseif ($totalChanges >= 5) {
            $score += 2;
        }

        $impactLevel = $this->determineImpactLevel($score);

        return new PatchNoteAnalysis(
            impactScore: $score,
            impactLevel: $impactLevel,
            totalChanges: $totalChanges,
            changesByType: $changesByType,
            changesByCategory: $changesByCategory
        );
    }

    private function determineImpactLevel(int $score): string
    {
        if ($score >= 30) {
            return 'Major';
        }

        if ($score >= 10) {
            return 'Medium';
        }

        return 'Minor';
    }
}
