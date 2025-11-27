<?php

declare(strict_types=1);

namespace App\PatchNotes\Contract;

use App\PatchNotes\PatchChange;
use App\PatchNotes\PatchNoteAnalysis;

/**
 * Interface d'analyse globale d'une patch note.
 */
interface PatchNoteAnalyzerInterface
{
    /**
     * @param PatchChange[] $changes
     */
    public function analyze(array $changes): PatchNoteAnalysis;
}
