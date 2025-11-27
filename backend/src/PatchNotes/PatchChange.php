<?php

declare(strict_types=1);

namespace App\PatchNotes;

/**
 * Value object représentant un changement individuel.
 */
final class PatchChange
{
    public function __construct(
        private string $description,
        private ChangeType $type,
        private string $category
    ) {
    }

    public function getDescription(): string
    {
        return $this->description;
    }

    public function getType(): ChangeType
    {
        return $this->type;
    }

    public function getCategory(): string
    {
        return $this->category;
    }
}
