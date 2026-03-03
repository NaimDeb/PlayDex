<?php

declare(strict_types=1);

namespace App\Tests\Unit\EventListener;

use App\EventListener\ApiRateLimiterListener;
use PHPUnit\Framework\TestCase;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\HttpKernel\Event\RequestEvent;
use Symfony\Component\HttpKernel\Event\ResponseEvent;
use Symfony\Component\HttpKernel\HttpKernelInterface;
use Symfony\Component\Lock\LockFactory;
use Symfony\Component\Lock\Store\InMemoryStore;
use Symfony\Component\RateLimiter\RateLimiterFactory;
use Symfony\Component\RateLimiter\Storage\InMemoryStorage;
use Symfony\Component\Security\Core\Authentication\Token\Storage\TokenStorageInterface;
use Symfony\Component\Security\Core\Authentication\Token\TokenInterface;
use Symfony\Component\Security\Core\User\UserInterface;

class ApiRateLimiterListenerTest extends TestCase
{
    private TokenStorageInterface $tokenStorage;
    private ApiRateLimiterListener $listener;

    protected function setUp(): void
    {
        $this->tokenStorage = $this->createMock(TokenStorageInterface::class);

        $generalLimiter = $this->createRateLimiterFactory(60, '1 minute');
        $loginLimiter = $this->createRateLimiterFactory(5, '1 minute');

        $this->listener = new ApiRateLimiterListener(
            $generalLimiter,
            $loginLimiter,
            $this->tokenStorage,
        );
    }

    public function testIgnoresNonApiRoutes(): void
    {
        $request = Request::create('/some-page');
        $event = $this->createRequestEvent($request);

        $this->listener->onKernelRequest($event);

        $this->assertNull($event->getResponse());
        $this->assertNull($request->attributes->get('_rate_limit_headers'));
    }

    public function testIgnoresSubRequests(): void
    {
        $request = Request::create('/api/games');
        $event = $this->createRequestEvent($request, HttpKernelInterface::SUB_REQUEST);

        $this->listener->onKernelRequest($event);

        $this->assertNull($event->getResponse());
    }

    public function testIgnoresOptionsRequests(): void
    {
        $request = Request::create('/api/games', 'OPTIONS');
        $event = $this->createRequestEvent($request);

        $this->listener->onKernelRequest($event);

        $this->assertNull($event->getResponse());
        $this->assertNull($request->attributes->get('_rate_limit_headers'));
    }

    public function testGeneralRouteAnonymousSetsHeaders(): void
    {
        $request = Request::create('/api/games', 'GET', [], [], [], ['REMOTE_ADDR' => '192.168.1.1']);
        $event = $this->createRequestEvent($request);

        $this->tokenStorage->method('getToken')->willReturn(null);

        $this->listener->onKernelRequest($event);

        $this->assertNull($event->getResponse());
        $headers = $request->attributes->get('_rate_limit_headers');
        $this->assertNotNull($headers);
        $this->assertEquals('60', $headers['X-RateLimit-Limit']);
        $this->assertEquals('59', $headers['X-RateLimit-Remaining']);
    }

    public function testGeneralRouteAuthenticatedUsesUserKey(): void
    {
        $request = Request::create('/api/games');
        $event = $this->createRequestEvent($request);

        $user = $this->createMock(UserInterface::class);
        $user->method('getUserIdentifier')->willReturn('test@example.com');

        $token = $this->createMock(TokenInterface::class);
        $token->method('getUser')->willReturn($user);

        $this->tokenStorage->method('getToken')->willReturn($token);

        $this->listener->onKernelRequest($event);

        $this->assertNull($event->getResponse());
        $headers = $request->attributes->get('_rate_limit_headers');
        $this->assertNotNull($headers);
        $this->assertEquals('60', $headers['X-RateLimit-Limit']);
    }

    public function testLoginRouteUsesLoginLimiter(): void
    {
        $request = Request::create('/api/login_check', 'POST', [], [], [], ['REMOTE_ADDR' => '10.0.0.1']);
        $event = $this->createRequestEvent($request);

        $this->listener->onKernelRequest($event);

        $this->assertNull($event->getResponse());
        $headers = $request->attributes->get('_rate_limit_headers');
        $this->assertNotNull($headers);
        $this->assertEquals('5', $headers['X-RateLimit-Limit']);
        $this->assertEquals('4', $headers['X-RateLimit-Remaining']);
    }

    public function testReturns429WhenGeneralLimitExceeded(): void
    {
        $this->tokenStorage->method('getToken')->willReturn(null);

        // Create a listener with a limit of 2 to easily exceed it
        $generalLimiter = $this->createRateLimiterFactory(2, '1 minute');
        $loginLimiter = $this->createRateLimiterFactory(5, '1 minute');
        $listener = new ApiRateLimiterListener($generalLimiter, $loginLimiter, $this->tokenStorage);

        // Consume the 2 allowed requests
        for ($i = 0; $i < 2; $i++) {
            $request = Request::create('/api/games', 'GET', [], [], [], ['REMOTE_ADDR' => '1.2.3.4']);
            $event = $this->createRequestEvent($request);
            $listener->onKernelRequest($event);
            $this->assertNull($event->getResponse());
        }

        // Third request should be rate-limited
        $request = Request::create('/api/games', 'GET', [], [], [], ['REMOTE_ADDR' => '1.2.3.4']);
        $event = $this->createRequestEvent($request);
        $listener->onKernelRequest($event);

        $response = $event->getResponse();
        $this->assertNotNull($response);
        $this->assertEquals(429, $response->getStatusCode());
        $this->assertEquals('application/problem+json', $response->headers->get('Content-Type'));
        $this->assertNotNull($response->headers->get('Retry-After'));
        $this->assertEquals('2', $response->headers->get('X-RateLimit-Limit'));
        $this->assertEquals('0', $response->headers->get('X-RateLimit-Remaining'));

        $body = json_decode($response->getContent(), true);
        $this->assertEquals(429, $body['status']);
        $this->assertEquals('Too Many Requests', $body['title']);
        $this->assertStringContainsString('Rate limit exceeded', $body['detail']);
    }

    public function testReturns429WithLoginMessageForLoginRoute(): void
    {
        // Create a listener with a login limit of 1
        $generalLimiter = $this->createRateLimiterFactory(60, '1 minute');
        $loginLimiter = $this->createRateLimiterFactory(1, '1 minute');
        $listener = new ApiRateLimiterListener($generalLimiter, $loginLimiter, $this->tokenStorage);

        // First request consumes the one allowed
        $request = Request::create('/api/login_check', 'POST', [], [], [], ['REMOTE_ADDR' => '1.2.3.4']);
        $event = $this->createRequestEvent($request);
        $listener->onKernelRequest($event);
        $this->assertNull($event->getResponse());

        // Second request should be rate-limited
        $request = Request::create('/api/login_check', 'POST', [], [], [], ['REMOTE_ADDR' => '1.2.3.4']);
        $event = $this->createRequestEvent($request);
        $listener->onKernelRequest($event);

        $response = $event->getResponse();
        $this->assertNotNull($response);
        $this->assertEquals(429, $response->getStatusCode());

        $body = json_decode($response->getContent(), true);
        $this->assertStringContainsString('login', $body['detail']);
    }

    public function testResponseListenerAttachesHeaders(): void
    {
        $request = Request::create('/api/games');
        $request->attributes->set('_rate_limit_headers', [
            'X-RateLimit-Limit' => '60',
            'X-RateLimit-Remaining' => '42',
        ]);

        $response = new Response();
        $event = $this->createResponseEvent($request, $response);

        $this->listener->onKernelResponse($event);

        $this->assertEquals('60', $response->headers->get('X-RateLimit-Limit'));
        $this->assertEquals('42', $response->headers->get('X-RateLimit-Remaining'));
    }

    public function testResponseListenerSkipsWhenNoHeaders(): void
    {
        $request = Request::create('/some-page');
        $response = new Response();
        $event = $this->createResponseEvent($request, $response);

        $this->listener->onKernelResponse($event);

        $this->assertNull($response->headers->get('X-RateLimit-Limit'));
    }

    public function testDifferentIpsHaveSeparateLimits(): void
    {
        $this->tokenStorage->method('getToken')->willReturn(null);

        $generalLimiter = $this->createRateLimiterFactory(1, '1 minute');
        $loginLimiter = $this->createRateLimiterFactory(5, '1 minute');
        $listener = new ApiRateLimiterListener($generalLimiter, $loginLimiter, $this->tokenStorage);

        // First IP consumes its quota
        $request1 = Request::create('/api/games', 'GET', [], [], [], ['REMOTE_ADDR' => '1.1.1.1']);
        $event1 = $this->createRequestEvent($request1);
        $listener->onKernelRequest($event1);
        $this->assertNull($event1->getResponse());

        // Second IP should still have quota
        $request2 = Request::create('/api/games', 'GET', [], [], [], ['REMOTE_ADDR' => '2.2.2.2']);
        $event2 = $this->createRequestEvent($request2);
        $listener->onKernelRequest($event2);
        $this->assertNull($event2->getResponse());

        // First IP should now be blocked
        $request3 = Request::create('/api/games', 'GET', [], [], [], ['REMOTE_ADDR' => '1.1.1.1']);
        $event3 = $this->createRequestEvent($request3);
        $listener->onKernelRequest($event3);
        $this->assertNotNull($event3->getResponse());
        $this->assertEquals(429, $event3->getResponse()->getStatusCode());
    }

    // --- Helpers ---

    private function createRateLimiterFactory(int $limit, string $interval): RateLimiterFactory
    {
        return new RateLimiterFactory(
            ['id' => 'test', 'policy' => 'sliding_window', 'limit' => $limit, 'interval' => $interval],
            new InMemoryStorage(),
            new LockFactory(new InMemoryStore()),
        );
    }

    private function createRequestEvent(
        Request $request,
        int $requestType = HttpKernelInterface::MAIN_REQUEST
    ): RequestEvent {
        $kernel = $this->createMock(HttpKernelInterface::class);
        return new RequestEvent($kernel, $request, $requestType);
    }

    private function createResponseEvent(Request $request, Response $response): ResponseEvent
    {
        $kernel = $this->createMock(HttpKernelInterface::class);
        return new ResponseEvent($kernel, $request, HttpKernelInterface::MAIN_REQUEST, $response);
    }
}
