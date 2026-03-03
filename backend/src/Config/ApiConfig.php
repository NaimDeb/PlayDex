<?php

namespace App\Config; 
final readonly class ApiConfig {

// Pagination
    public const PAGINATION_DEFAULT_LIMIT = 10;
    public const PAGINATION_MAX_LIMIT = 100;

// IGDB
    public const IGDB_BATCH_SIZE = 500;
    public const IGDB_PARALLEL_REQUESTS = 4;
    public const IGDB_RATE_LIMIT_DELAY_US = 250000; // Microsecondes
    public const IGDB_GAME_MIN_FOLLOWS = 5;
    public const IGDB_SEARCH_CACHE_TTL = 14400; // 4 hours in seconds

// PHP Memory

    public const MEMORY_LIMIT_MB = 900;
    public const MEMORY_CLEAR_THRESHOLD_MB = 800;

}