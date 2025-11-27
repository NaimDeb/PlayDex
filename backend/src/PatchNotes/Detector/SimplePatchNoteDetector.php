<?php

declare(strict_types=1);

namespace App\PatchNotes\Detector;

use App\PatchNotes\Contract\PatchNoteDetectorInterface;

/**
 * Détecteur basique pour savoir si un texte ressemble à une patch note.
 */
final class SimplePatchNoteDetector implements PatchNoteDetectorInterface
{
    public function isPatchNote(string $text): bool
    {
        $score = 0;

        // Patterns typiques de patch note
        if (preg_match('/patch\s*notes?/i', $text)) {
            $score += 3;
        }

        if (preg_match('/changelog/i', $text)) {
            $score += 2;
        }

        if (preg_match('/bug\s*fix(es)?/i', $text)) {
            $score += 1;
        }

        if (preg_match('/balance/i', $text)) {
            $score += 1;
        }

        // Présence d'une version
        if (preg_match('/\b(v?\d+\.\d+(\.\d+)?)\b/', $text)) {
            $score += 2;
        }

        // Beaucoup de lignes à puces = liste de changements
        preg_match_all('/^(\-|\*|•|\d+\.)\s+/m', $text, $matches);
        $bulletCount = count($matches[0]);
        if ($bulletCount >= 5) {
            $score += 2;
        } elseif ($bulletCount >= 2) {
            $score += 1;
        }

        // Seuil arbitraire
        return $score >= 4;
    }
}
