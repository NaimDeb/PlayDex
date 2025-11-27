<?php

declare(strict_types=1);

namespace App\PatchNotes\Contract;

use App\PatchNotes\PatchNote;
use App\PatchNotes\PatchNoteAnalysis;

/**
 * Interface de formatage en Markdown.
 */
interface PatchNoteFormatterInterface
{
    public function format(PatchNote $note, PatchNoteAnalysis $analysis): string;
}
