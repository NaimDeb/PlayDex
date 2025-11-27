<?php

declare(strict_types=1);

namespace App\PatchNotes\Contract;

/**
 * Interface de détection d'une patch note.
 */
interface PatchNoteDetectorInterface
{
    public function isPatchNote(string $text): bool;
}
