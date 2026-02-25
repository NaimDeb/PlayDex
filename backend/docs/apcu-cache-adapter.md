# APCu Cache Adapter for Doctrine

## What is APCu?

APCu (APC User Cache) is a PHP extension that stores data in **shared memory** (RAM).
Unlike the default filesystem adapter, there's no disk I/O — lookups are nearly instant.

## Why use it?

Your production Doctrine config already caches query and result data:

```yaml
# doctrine.yaml (when@prod)
query_cache_driver:
    type: pool
    pool: doctrine.system_cache_pool   # uses cache.system (filesystem)
result_cache_driver:
    type: pool
    pool: doctrine.result_cache_pool   # uses cache.app (filesystem)
```

The problem: `cache.app` defaults to `cache.adapter.filesystem`, which reads/writes files on disk for every cache hit. APCu serves the same data straight from RAM.

## What would change

**Before (filesystem):** DB query → check disk cache file → return result
**After (APCu):** DB query → check RAM → return result

Typical improvement: cache lookups go from ~1-5ms (disk) to ~0.01ms (RAM).

## How to implement

### 1. Install the APCu PHP extension

On Linux (production server):
```bash
sudo apt install php-apcu
sudo systemctl restart php-fpm
```

On Windows (dev — optional, filesystem is fine for dev):
- Download the DLL from https://pecl.php.net/package/APCu
- Add `extension=apcu` to your `php.ini`
- Add `apc.enable_cli=1` if you want it to work in CLI

Verify it's installed:
```bash
php -m | grep apcu
```

### 2. Update cache.yaml

```yaml
# config/packages/cache.yaml
framework:
    cache:
        app: cache.adapter.apcu
```

That's it. All pools that use `cache.app` (including `doctrine.result_cache_pool` and rate limiters) will now use APCu automatically.

### 3. Optionally, keep filesystem as fallback

If you're not sure APCu will always be available, you can use a chain adapter:

```yaml
framework:
    cache:
        app: cache.adapter.apcu
        # Or with a fallback:
        # pools:
        #     doctrine.result_cache_pool:
        #         adapter: cache.adapter.apcu
```

## When NOT to use APCu

- **Heavy random-write workloads**: APCu can suffer from memory fragmentation. Your app is mostly reads (game data lookups), so this shouldn't be an issue.
- **Multi-server setups without sticky sessions**: APCu is per-server. If you have multiple PHP servers behind a load balancer, each has its own cache. For that, use Redis instead.
- **CLI commands**: APCu is shared memory for the web process (php-fpm). CLI processes have a separate memory space. Your IGDB import commands won't benefit from APCu (but they don't need to — they write to the DB directly).

## Redis as an alternative

If you later scale to multiple servers, Redis is the better choice:

```yaml
framework:
    cache:
        app: cache.adapter.redis
        default_redis_provider: 'redis://localhost'
```

Redis also works across CLI and web processes, and survives php-fpm restarts.

## Summary

| Adapter | Speed | Persistence | Multi-server | Setup |
|---------|-------|-------------|-------------|-------|
| Filesystem (current) | Slow (~1-5ms) | Survives restarts | Yes (shared disk) | None |
| APCu | Fast (~0.01ms) | Lost on restart | No (per-server) | Install extension |
| Redis | Fast (~0.5ms) | Survives restarts | Yes | Install Redis server |

For a single-server deployment, APCu is the easiest win. For future scaling, Redis.
