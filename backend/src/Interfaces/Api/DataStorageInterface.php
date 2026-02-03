<?php

namespace App\Interfaces\Api;

/**
 * Contract for storing data in the database.
 * Allows different storage strategies to be implemented.
 */
interface DataStorageInterface
{
    /**
     * Store data in the database
     * 
     * @param array $data The processed data to store
     * @param mixed $progressBar Optional progress bar for tracking
     */
    public function store(array $data, $progressBar = null): void;

    /**
     * Get the table name where data is stored
     */
    public function getTableName(): string;
}
