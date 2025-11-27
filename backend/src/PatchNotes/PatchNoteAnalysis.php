<?php

declare(strict_types=1);

namespace App\PatchNotes;

/**
 * Résultat de l'analyse (score, stats...).
 */
final class PatchNoteAnalysis
{
    /**
     * @param array<string,int> $changesByType
     * @param array<string,int> $changesByCategory
     */
    public function __construct(
        private int $impactScore,
        private string $impactLevel,
        private int $totalChanges,
        private array $changesByType,
        private array $changesByCategory
    ) {
    }

    public function getImpactScore(): int
    {
        return $this->impactScore;
    }

    public function getImpactLevel(): string
    {
        return $this->impactLevel;
    }

    public function getTotalChanges(): int
    {
        return $this->totalChanges;
    }

    /**
     * @return array<string,int>
     */
    public function getChangesByType(): array
    {
        return $this->changesByType;
    }

    /**
     * @return array<string,int>
     */
    public function getChangesByCategory(): array
    {
        return $this->changesByCategory;
    }
}
