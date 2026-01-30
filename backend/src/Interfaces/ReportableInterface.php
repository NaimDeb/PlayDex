<?php

declare(strict_types=1);

namespace App\Interfaces;

use App\Entity\User;

/**
 * Interface for entities that can be reported by users.
 * Provides methods to identify and describe reportable content.
 */
interface ReportableInterface
{
    /**
     * Get the unique identifier of the reportable entity.
     */
    public function getId(): ?int;

    /**
     * Get the type name of the reportable entity (e.g., 'Patchnote', 'Modification').
     */
    public function getReportableType(): string;

    /**
     * Get a human-readable title for the reportable entity.
     */
    public function getReportableTitle(): string;

    /**
     * Get the owner/author of the reportable content, if applicable.
     */
    public function getReportableOwner(): ?User;
}