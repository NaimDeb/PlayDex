<?php

declare(strict_types=1);

namespace App\EventListener;

use App\Interfaces\EventListener\RateLimiterListenerInterface;
use Symfony\Component\EventDispatcher\Attribute\AsEventListener;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpKernel\Event\RequestEvent;
use Symfony\Component\HttpKernel\Event\ResponseEvent;
use Symfony\Component\HttpKernel\KernelEvents;
use Symfony\Component\RateLimiter\RateLimiterFactory;
use Symfony\Component\Security\Core\Authentication\Token\Storage\TokenStorageInterface;

/**
 * Enforces rate limiting on all /api routes.
 *
 * - Login routes (/api/login*): 5 requests/minute, keyed by IP
 * - All other /api routes: 60 requests/minute, keyed by authenticated user email or IP
 *
 * Runs after the Firewall (priority 8) so TokenStorage is populated,
 * but before API Platform's ReadListener (priority 4) to prevent DB hits on rate-limited requests.
 */
#[AsEventListener(event: KernelEvents::REQUEST, method: 'onKernelRequest', priority: 6)]
#[AsEventListener(event: KernelEvents::RESPONSE, method: 'onKernelResponse', priority: 0)]
final class ApiRateLimiterListener implements RateLimiterListenerInterface
{
    private const LOGIN_PATH_PREFIX = '/api/login';
    private const API_PATH_PREFIX = '/api';
    private const RATE_LIMIT_HEADERS_ATTR = '_rate_limit_headers';

    public function __construct(
        private readonly RateLimiterFactory $apiGeneralLimiter,
        private readonly RateLimiterFactory $apiLoginLimiter,
        private readonly TokenStorageInterface $tokenStorage,
    ) {}

    public function onKernelRequest(RequestEvent $event): void
    {
        if (!$event->isMainRequest()) {
            return;
        }

        $request = $event->getRequest();
        $path = $request->getPathInfo();

        if (!str_starts_with($path, self::API_PATH_PREFIX)) {
            return;
        }

        if ($request->getMethod() === 'OPTIONS') {
            return;
        }

        $isLoginRoute = str_starts_with($path, self::LOGIN_PATH_PREFIX);

        $limiterFactory = $isLoginRoute
            ? $this->apiLoginLimiter
            : $this->apiGeneralLimiter;

        $key = $this->resolveKey($request->getClientIp() ?? 'unknown', $isLoginRoute);

        $limit = $limiterFactory->create($key)->consume(1);

        $headers = [
            'X-RateLimit-Limit' => (string) $limit->getLimit(),
            'X-RateLimit-Remaining' => (string) $limit->getRemainingTokens(),
        ];

        if (!$limit->isAccepted()) {
            $retryAfter = $limit->getRetryAfter()->getTimestamp() - time();

            $response = new JsonResponse(
                [
                    'type' => 'https://tools.ietf.org/html/rfc6585#section-4',
                    'title' => 'Too Many Requests',
                    'status' => 429,
                    'detail' => $isLoginRoute
                        ? 'Too many login attempts. Please try again later.'
                        : 'Rate limit exceeded. Please slow down.',
                ],
                429,
                array_merge($headers, [
                    'Retry-After' => (string) max(1, $retryAfter),
                    'Content-Type' => 'application/problem+json',
                ])
            );

            $event->setResponse($response);
            return;
        }

        $request->attributes->set(self::RATE_LIMIT_HEADERS_ATTR, $headers);
    }

    public function onKernelResponse(ResponseEvent $event): void
    {
        if (!$event->isMainRequest()) {
            return;
        }

        $request = $event->getRequest();
        $headers = $request->attributes->get(self::RATE_LIMIT_HEADERS_ATTR);

        if ($headers === null) {
            return;
        }

        $response = $event->getResponse();
        foreach ($headers as $name => $value) {
            $response->headers->set($name, $value);
        }
    }

    private function resolveKey(string $clientIp, bool $isLoginRoute): string
    {
        if (!$isLoginRoute) {
            $token = $this->tokenStorage->getToken();

            if ($token !== null && $token->getUser() !== null) {
                return 'user_' . $token->getUser()->getUserIdentifier();
            }
        }

        return 'ip_' . $clientIp;
    }
}
