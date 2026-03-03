<?php

declare(strict_types=1);

namespace App\Config;

class SteamConfig
{
    public const COMMUNITY_EVENTS_URL = 'https://store.steampowered.com/events/ajaxgetadjacentpartnerevents/';
    public const EVENT_TYPE_UPDATE = 12;
    public const CACHE_TTL = 1200; // 20 minutes in seconds
    public const POLLER_SCRIPT_PATH = 'scripts/steam-poller/index.js';
    public const POLLER_TIMEOUT = 120; // seconds
    public const FLUSH_BATCH_SIZE = 10;
}
