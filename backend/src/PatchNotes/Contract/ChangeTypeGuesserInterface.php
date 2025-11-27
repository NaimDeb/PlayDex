<?php

declare(strict_types=1);

namespace App\PatchNotes\Contract;

use App\PatchNotes\ChangeType;

/**
 * Interface de détection du type de changement.
 */
interface ChangeTypeGuesserInterface
{
    public function guess(string $description, string $category): ChangeType;
}
