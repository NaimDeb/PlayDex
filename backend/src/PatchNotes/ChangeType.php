<?php

declare(strict_types=1);

namespace App\PatchNotes;

/**
 * Type de changement détecté dans la patch note.
 */
enum ChangeType: string
{
    case BUFF = 'buff';
    case DEBUFF = 'debuff';
    case REWORK = 'rework';
    case FIX = 'fix';
    case OTHER = 'other';
}
