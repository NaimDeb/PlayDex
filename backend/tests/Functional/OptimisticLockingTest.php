<?php

namespace App\Tests\Functional;

use App\Tests\BaseTestCase;

class OptimisticLockingTest extends BaseTestCase
{
    public function testPatchnoteUpdateWithCorrectVersion(): void
    {
        $client = static::createClient();
        $token = $this->getAuthToken($client);

        // Create patchnote
        $patchnoteData = [
            'title' => 'Test Patchnote',
            'content' => 'Initial content',
            'releasedAt' => '2024-01-01',
            'importance' => 'minor',
            'game' => '/api/games/1',
            'smallDescription' => 'Test'
        ];

        $client->request('POST', '/api/patchnotes', [
            'headers' => ['Authorization' => 'Bearer ' . $token],
            'json' => $patchnoteData
        ]);

        $this->assertResponseIsSuccessful();
        $response = json_decode($client->getResponse()->getContent(), true);
        $patchnoteId = $response['id'];
        $version = $response['version'];

        // Update with correct version
        $client->request('PATCH', '/api/patchnotes/' . $patchnoteId, [
            'headers' => [
                'Authorization' => 'Bearer ' . $token,
                'Content-Type' => 'application/merge-patch+json'
            ],
            'json' => [
                'content' => 'Updated content',
                'version' => $version
            ]
        ]);

        $this->assertResponseIsSuccessful();
        $updatedResponse = json_decode($client->getResponse()->getContent(), true);
        $this->assertEquals($version + 1, $updatedResponse['version']);
    }

    public function testPatchnoteUpdateWithIncorrectVersion(): void
    {
        $client = static::createClient();
        $token = $this->getAuthToken($client);

        // Create patchnote
        $patchnoteData = [
            'title' => 'Test Patchnote',
            'content' => 'Initial content',
            'releasedAt' => '2024-01-01',
            'importance' => 'minor',
            'game' => '/api/games/1',
            'smallDescription' => 'Test'
        ];

        $client->request('POST', '/api/patchnotes', [
            'headers' => ['Authorization' => 'Bearer ' . $token],
            'json' => $patchnoteData
        ]);

        $this->assertResponseIsSuccessful();
        $response = json_decode($client->getResponse()->getContent(), true);
        $patchnoteId = $response['id'];

        // Update with incorrect version
        $client->request('PATCH', '/api/patchnotes/' . $patchnoteId, [
            'headers' => [
                'Authorization' => 'Bearer ' . $token,
                'Content-Type' => 'application/merge-patch+json'
            ],
            'json' => [
                'content' => 'Updated content',
                'version' => 999
            ]
        ]);

        $this->assertResponseStatusCodeSame(409);
    }
}
