<?php

declare(strict_types=1);

namespace App\PatchNotes\Guesser;

use App\PatchNotes\ChangeType;
use App\PatchNotes\Contract\ChangeTypeGuesserInterface;

/**
 * Devine le type de changement (buff / debuff / rework / fix / other) à partir du texte.
 */
final class ChangeTypeGuesser implements ChangeTypeGuesserInterface
{
    /**
     * Keywords for which an increase is actually a debuff (semantics inverted).
     * e.g. cooldown increase = nerf, cost increase = nerf.
     * Can be extended later or injected via constructor.
     *
     * @var string[]
     */
    private array $invertIncreaseKeywords = [
        'cooldown',
        'cost',
        'mana cost',
        'mp cost',
        'delay',
        'cast time',
        'stagger',
    ];

    public function __construct(array $invertIncreaseKeywords = [])
    {
        if (!empty($invertIncreaseKeywords)) {
            $this->invertIncreaseKeywords = $invertIncreaseKeywords;
        }
    }

    public function guess(string $description, string $category): ChangeType
    {
        $text = mb_strtolower($description . ' ' . $category);

        // Rework avant tout
        if (str_contains($text, 'rework') || str_contains($text, 're-work') || str_contains($text, 'reworked')) {
            return ChangeType::REWORK;
        }

        // Fixes
        if (preg_match('/\b(fix|fixed|bug)\b/i', $description)) {
            return ChangeType::FIX;
        }

        // If there's an arrow or a '->' or 'to' indicating a numeric change, evaluate it
        if (preg_match('/([+\-]?\d+(?:[.,]\d+)?%?)\s*(?:→|->|to)\s*([+\-]?\d+(?:[.,]\d+)?%?)/i', $description, $m)) {
            $a = $this->parseNumberLike($m[1]);
            $b = $this->parseNumberLike($m[2]);
            if ($a !== null && $b !== null) {
                $delta = $b - $a;
                return $this->classifyByDelta($delta, $description);
            }
        }

        // If starts with +N or -N
        if (preg_match('/^[+\-]\s*\+?\d+(?:[.,]\d+)?%?\b/', trim($description))) {
            // + means increase => buff (unless inverted), - means decrease => debuff
            if (preg_match('/^\+/', trim($description))) {
                return $this->classifyByDelta(1.0, $description);
            }
            return $this->classifyByDelta(-1.0, $description);
        }

        // Keywords heuristics: if contains buff/nerf words
        if (preg_match('/\b(buff|buffed|increase|increased|improved|more damage|more health)\b/i', $description)) {
            return ChangeType::BUFF;
        }

        if (preg_match('/\b(nerf|nerfed|debuff|reduced|decrease|decreased|less damage|less health)\b/i', $description)) {
            return ChangeType::DEBUFF;
        }

        return ChangeType::OTHER;
    }

    private function parseNumberLike(string $s): ?float
    {
        $s = trim($s);
        // remove plus signs and percent for numeric comparison
        $s = str_replace(['+', '%'], '', $s);
        $s = str_replace(',', '.', $s);

        if (is_numeric($s)) {
            return (float) $s;
        }

        return null;
    }

    private function classifyByDelta(float $delta, string $description): ChangeType
    {
        $desc = mb_strtolower($description);

        // if description contains an invert keyword, flip sign
        foreach ($this->invertIncreaseKeywords as $k) {
            if (str_contains($desc, $k)) {
                $delta = -$delta;
                break;
            }
        }

        if ($delta > 0) {
            return ChangeType::BUFF;
        }

        if ($delta < 0) {
            return ChangeType::DEBUFF;
        }

        return ChangeType::OTHER;
    }
}
