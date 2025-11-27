<?php

declare(strict_types=1);

namespace App\PatchNotes\Formatter;

use App\PatchNotes\Contract\PatchNoteFormatterInterface;
use App\PatchNotes\PatchChange;
use App\PatchNotes\PatchNote;
use App\PatchNotes\PatchNoteAnalysis;

/**
 * Formatteur Markdown : transforme l'objet PatchNote + analyse en joli texte.
 */
final class PatchNoteMarkdownFormatter implements PatchNoteFormatterInterface
{
    public function format(PatchNote $note, PatchNoteAnalysis $analysis): string
    {
        $lines = [];

        $lines[] = '# ' . $note->getTitle();
        $lines[] = '';

        $lines[] = sprintf(
            '> Patch type: **%s** (score: %d, %d changes)',
            strtoupper($analysis->getImpactLevel()),
            $analysis->getImpactScore(),
            $analysis->getTotalChanges()
        );
        $lines[] = '';

        // Résumé global
        $byType = $analysis->getChangesByType();
        $getTypeCount = static fn (string $key) => $byType[$key] ?? 0;

        $lines[] = '## Summary';
        $lines[] = '';
        $lines[] = '- Total changes: ' . $analysis->getTotalChanges();
        $lines[] = '- Buffs: ' . $getTypeCount('buff');
        $lines[] = '- Debuffs: ' . $getTypeCount('debuff');
        $lines[] = '- Reworks: ' . $getTypeCount('rework');
        $lines[] = '- Fixes: ' . $getTypeCount('fix');
        $lines[] = '- Other: ' . $getTypeCount('other');
        $lines[] = '';

        // Détail par catégorie
        $changesByCategory = $this->groupChangesByCategory($note->getChanges());

        foreach ($changesByCategory as $category => $changes) {
            $lines[] = '## ' . $category;
            $lines[] = '';

            /** @var PatchChange $change */
            foreach ($changes as $change) {
                $label = strtoupper($change->getType()->value);
                $lines[] = sprintf(
                    '- **[%s]** %s',
                    $label,
                    $change->getDescription()
                );
            }

            $lines[] = '';
        }

        return implode("\n", $lines);
    }

    /**
     * @param PatchChange[] $changes
     * @return array<string, PatchChange[]>
     */
    private function groupChangesByCategory(array $changes): array
    {
        $grouped = [];

        // Preserve insertion order of categories based on first occurrence in the changes array
        foreach ($changes as $change) {
            $category = $change->getCategory() ?: 'Other';
            if (!array_key_exists($category, $grouped)) {
                $grouped[$category] = [];
            }
            $grouped[$category][] = $change;
        }

        return $grouped;
    }
}
