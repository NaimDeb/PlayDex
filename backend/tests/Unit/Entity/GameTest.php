<?php

namespace App\Tests\Unit\Entity;

use App\Entity\Game;
use App\Entity\Company;
use PHPUnit\Framework\TestCase;

class GameTest extends TestCase
{
    private Game $game;

    protected function setUp(): void
    {
        $this->game = new Game();
    }

    public function testGameCreation(): void
    {
        $this->assertInstanceOf(Game::class, $this->game);
        $this->assertNull($this->game->getId());
    }

    public function testSetAndGetTitle(): void
    {
        $title = 'Test Game Title';
        $this->game->setTitle($title);
        
        $this->assertEquals($title, $this->game->getTitle());
    }

    public function testSetAndGetDescription(): void
    {
        $description = 'This is a test game description';
        $this->game->setDescription($description);
        
        $this->assertEquals($description, $this->game->getDescription());
    }

    public function testSetAndGetImageUrl(): void
    {
        $imageUrl = 'https://example.com/image.jpg';
        $this->game->setImageUrl($imageUrl);
        
        $this->assertEquals($imageUrl, $this->game->getImageUrl());
    }

    public function testSetAndGetReleasedAt(): void
    {
        $releaseDate = new \DateTimeImmutable('2023-01-01');
        $this->game->setReleasedAt($releaseDate);
        
        $this->assertEquals($releaseDate, $this->game->getReleasedAt());
    }

    public function testSetAndGetApiId(): void
    {
        $apiId = 12345;
        $this->game->setApiId($apiId);
        
        $this->assertEquals($apiId, $this->game->getApiId());
    }

    public function testPatchnotesCollection(): void
    {
        $patchnotes = $this->game->getPatchnotes();
        
        $this->assertCount(0, $patchnotes);
        $this->assertInstanceOf(\Doctrine\Common\Collections\Collection::class, $patchnotes);
    }

    public function testGenresCollection(): void
    {
        $genres = $this->game->getGenres();
        
        $this->assertCount(0, $genres);
        $this->assertInstanceOf(\Doctrine\Common\Collections\Collection::class, $genres);
    }

    public function testCompaniesCollection(): void
    {
        $companies = $this->game->getCompanies();
        
        $this->assertCount(0, $companies);
        $this->assertInstanceOf(\Doctrine\Common\Collections\Collection::class, $companies);
    }

    public function testFollowedGamesCollection(): void
    {
        $followedGames = $this->game->getFollowedGames();
        
        $this->assertCount(0, $followedGames);
        $this->assertInstanceOf(\Doctrine\Common\Collections\Collection::class, $followedGames);
    }
}
