<?php

declare(strict_types=1);

namespace App\Interfaces\EventListener;

use Symfony\Component\HttpKernel\Event\RequestEvent;
use Symfony\Component\HttpKernel\Event\ResponseEvent;

/**
 * Interface for the API rate limiter event listener.
 * Intercepts incoming HTTP requests to enforce rate limits
 * and attaches rate limit headers to all API responses.
 */
interface RateLimiterListenerInterface
{
    /**
     * Enforce rate limiting on incoming API requests.
     * Returns HTTP 429 if the limit is exceeded.
     */
    public function onKernelRequest(RequestEvent $event): void;

    /**
     * Attach rate limit headers (X-RateLimit-Limit, X-RateLimit-Remaining)
     * to successful API responses.
     */
    public function onKernelResponse(ResponseEvent $event): void;
}
