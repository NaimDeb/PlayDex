<?php

declare(strict_types=1);

namespace App\PatchNotes\Contract;

use App\PatchNotes\PatchNote;

/**
 * Interface de parsing général.
 */
interface PatchNoteParserInterface
{
    public function parse(string $text): PatchNote;
}
