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

    public const NEWS_API_URL = 'https://api.steampowered.com/ISteamNews/GetNewsForApp/v2/';
    public const HISTORY_NEWS_FEED = 'steam_community_announcements';
    public const HISTORY_FETCH_COUNT = 100;
    public const HISTORY_FETCH_DELAY_US = 1000000; // 1 second between pages
}
