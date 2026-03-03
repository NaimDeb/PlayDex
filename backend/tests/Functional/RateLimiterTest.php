<?php

declare(strict_types=1);

namespace App\Tests\Functional;

use Symfony\Bundle\FrameworkBundle\Test\WebTestCase;

class RateLimiterTest extends WebTestCase
{
    private $client;

    protected function setUp(): void
    {
        $this->client = static::createClient();
    }

    public function testApiResponseIncludesRateLimitHeaders(): void
    {
        $this->client->request('GET', '/api/games');

        $response = $this->client->getResponse();
        $this->assertNotNull($response->headers->get('X-RateLimit-Limit'));
        $this->assertNotNull($response->headers->get('X-RateLimit-Remaining'));
    }

    public function testLoginEndpointHasStricterLimit(): void
    {
        $this->client->request('POST', '/api/login_check', [], [], [
            'CONTENT_TYPE' => 'application/json',
        ], json_encode(['email' => 'test@test.com', 'password' => 'wrong']));

        $response = $this->client->getResponse();
        $this->assertEquals('5', $response->headers->get('X-RateLimit-Limit'));
    }

    public function testLoginRateLimitReturns429AfterExceeded(): void
    {
        for ($i = 0; $i < 6; $i++) {
            $this->client->request('POST', '/api/login_check', [], [], [
                'CONTENT_TYPE' => 'application/json',
            ], json_encode(['email' => 'brute@force.com', 'password' => 'wrong']));
        }

        $response = $this->client->getResponse();
        $this->assertEquals(429, $response->getStatusCode());
        $this->assertNotNull($response->headers->get('Retry-After'));

        $body = json_decode($response->getContent(), true);
        $this->assertEquals('Too Many Requests', $body['title']);
    }
}
