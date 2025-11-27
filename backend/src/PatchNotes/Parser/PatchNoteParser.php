<?php

declare(strict_types=1);

namespace App\PatchNotes\Parser;

use App\PatchNotes\ChangeType;
use App\PatchNotes\Contract\CategoryNormalizerInterface;
use App\PatchNotes\Contract\ChangeTypeGuesserInterface;
use App\PatchNotes\Contract\PatchNoteParserInterface;
use App\PatchNotes\Contract\TitleExtractorInterface;
use App\PatchNotes\PatchChange;
use App\PatchNotes\PatchNote;

/**
 * Parser basique qui découpe le texte en catégories + changements.
 */
final class PatchNoteParser implements PatchNoteParserInterface
{
    public function __construct(
        private TitleExtractorInterface $titleExtractor,
        private CategoryNormalizerInterface $categoryNormalizer,
        private ChangeTypeGuesserInterface $changeTypeGuesser
    ) {
    }

    public function parse(string $text): PatchNote
    {
        $lines = preg_split('/\R/u', $text) ?: [];
        $title = $this->titleExtractor->extract($lines);

        $changes = [];
        $currentCategory = 'General';

        foreach ($lines as $line) {
            $trimmed = trim($line);

            if ($trimmed === '') {
                continue;
            }

            // Sauter le titre extrait pour ne pas le traiter deux fois
            if ($trimmed === $title) {
                continue;
            }

            // Si c'est un heading (catégorie), on change de catégorie
            if ($this->isHeadingLine($trimmed)) {
                $categoryName = $this->stripHeadingSyntax($trimmed);
                $currentCategory = $this->categoryNormalizer->normalize($categoryName);
                continue;
            }

            // Si la ligne ressemble à un changement, on la normalise et on la pousse
            if ($this->isChangeLine($trimmed)) {
                $description = $this->stripChangeBullet($trimmed);
                $type = $this->changeTypeGuesser->guess($description, $currentCategory);

                $changes[] = new PatchChange(
                    description: $description,
                    type: $type,
                    category: $currentCategory
                );
                continue;
            }

            // Ligne libre : on ne force pas systématiquement son ajout.
            // On ajoute seulement si elle contient des indices d'un changement (verbes clés, nombres, %).
            if ($this->looksLikeInlineChange($trimmed)) {
                $type = $this->changeTypeGuesser->guess($trimmed, $currentCategory);

                $changes[] = new PatchChange(
                    description: $trimmed,
                    type: $type,
                    category: $currentCategory
                );
            }
        }

        return new PatchNote(
            title: $title,
            rawText: $text,
            changes: $changes
        );
    }

    /**
     * Détecte une ligne de titre / catégorie.
     */
    private function isHeadingLine(string $line): bool
    {
        // Ligne avec syntaxe Markdown
        if (str_starts_with($line, '#')) {
            return true;
        }

        // Si la ligne ressemble à un changement, ce n'est pas un heading
        if ($this->isChangeLine($line)) {
            return false;
        }

        // Si la ligne est en MAJUSCULES et courte, c'est probablement un heading
        if (mb_strtoupper($line) === $line && mb_strlen($line) <= 60) {
            return true;
        }

        // Si la plupart des mots commencent par une majuscule (ex: "Master Nabur Set"),
        // c'est probablement un heading de section
        $words = preg_split('/\s+/u', $line);
        if (is_array($words)) {
            $count = count($words);
            if ($count > 0 && $count <= 8) {
                $capitalized = 0;
                foreach ($words as $w) {
                    if (preg_match('/^\p{Lu}/u', $w)) {
                        $capitalized++;
                    }
                }

                if ($count > 0 && ($capitalized / $count) >= 0.6) {
                    return true;
                }
            }
        }

        // Ligne courte sans puce ET sans point à la fin = probablement une catégorie
        // Seuil conservateur
        if (mb_strlen($line) <= 20 && !str_ends_with($line, '.')) {
            return true;
        }

        return false;
    }

    /**
     * Détecte si la ligne est un "changement" (puce, item de liste).
     */
    private function isChangeLine(string $line): bool
    {
        // Puces classiques
        if (preg_match('/^(\-|\*|•|\d+\.)\s+/', $line)) {
            return true;
        }

        // +30 Agility, -5 Something (plus/minus followed by number)
        if (preg_match('/^[\+\-]\s*\+?\d+(?:[.,]\d+)?%?\b/', $line)) {
            return true;
        }

        // Lines that start with a number or percent: '10% Critical' or '10 Critical'
        if (preg_match('/^\d+(?:[.,]\d+)?%?\b/', $line)) {
            return true;
        }

        // Arrows between numbers: '10 -> 15%', '+80 → +100'
        if (preg_match('/[\+\-]?\d+(?:[.,]\d+)?\s*(?:→|->|to)\s*[\+\-]?\d+(?:[.,]\d+)?%?/', $line)) {
            return true;
        }

        // Any inline percentage anywhere: 'increased by 10%'
        if (preg_match('/\d+(?:[.,]\d+)?%/', $line)) {
            return true;
        }

        return false;
    }

    /**
     * Heuristique pour détecter si une ligne libre ressemble quand même à un changement.
     */
    private function looksLikeInlineChange(string $line): bool
    {
        // Keywords souvent présents dans des changements
        if (preg_match('/\b(buff|nerf|rework|reworked|fix|fixed|bug|increase|decrease|improv|reduce|resist|damage|critical|pushback|parry|mp|hp|dmg)\b/i', $line)) {
            return true;
        }

        // Présence de nombres, pourcentages ou flèches
        if (preg_match('/\d|%|→|->|→/', $line)) {
            return true;
        }

        return false;
    }

    /**
     * Supprime la syntaxe Markdown de titre (#, ##, etc.).
     */
    private function stripHeadingSyntax(string $line): string
    {
        $line = preg_replace('/^#+\s*/', '', $line) ?? $line;
        return trim($line);
    }

    /**
     * Supprime la puce / numérotation en début de ligne.
     */
    private function stripChangeBullet(string $line): string
    {
        $line = preg_replace('/^(\-|\*|•|\d+\.)\s+/', '', $line) ?? $line;
        return trim($line);
    }
}
