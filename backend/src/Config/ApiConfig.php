<?php

final readonly class ApiConfig {

// Pagination
    public const PAGINATION_DEFAULT_LIMIT = 10;
    public const PAGINATION_MAX_LIMIT = 100;

// IGDB
    public const IGDB_BATCH_SIZE = 500;
    public const IGDB_PARALLEL_REQUESTS = 4;
    public const IGDB_RATE_LIMIT_DELAY_US = 250000; // Microsecondes

// PHP Memory

    public const MEMORY_LIMIT_MB = 900;
    public const MEMORY_CLEAR_THRESHOLD_MB = 800;

}