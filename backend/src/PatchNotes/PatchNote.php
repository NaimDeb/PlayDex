<?php

declare(strict_types=1);

namespace App\PatchNotes;

/**
 * Représentation de la patch note structurée.
 */
final class PatchNote
{
    /**
     * @param PatchChange[] $changes
     */
    public function __construct(
        private string $title,
        private string $rawText,
        private array $changes
    ) {
    }

    public function getTitle(): string
    {
        return $this->title;
    }

    public function getRawText(): string
    {
        return $this->rawText;
    }

    /**
     * @return PatchChange[]
     */
    public function getChanges(): array
    {
        return $this->changes;
    }
}
