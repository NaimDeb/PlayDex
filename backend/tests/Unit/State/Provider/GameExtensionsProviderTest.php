<?php

namespace App\Tests\Unit\State\Provider;

use ApiPlatform\Metadata\Operation;
use App\Entity\Extension;
use App\Entity\Game;
use App\Repository\GameRepository;
use App\State\Provider\GameExtensionsProvider;
use Doctrine\Common\Collections\ArrayCollection;
use PHPUnit\Framework\TestCase;

class GameExtensionsProviderTest extends TestCase
{
    private GameRepository $gameRepository;
    private GameExtensionsProvider $provider;
    private Operation $operation;

    protected function setUp(): void
    {
        $this->gameRepository = $this->createMock(GameRepository::class);
        $this->operation = $this->createMock(Operation::class);
        $this->provider = new GameExtensionsProvider($this->gameRepository);
    }

    public function testProvideReturnsExtensionsForExistingGame(): void
    {
        $extensions = new ArrayCollection([new Extension(), new Extension()]);

        $game = $this->createMock(Game::class);
        $game->method('getExtensions')->willReturn($extensions);

        $this->gameRepository->method('find')->with(1)->willReturn($game);

        $result = $this->provider->provide($this->operation, ['id' => 1]);

        $this->assertCount(2, $result);
    }

    public function testProvideReturnsEmptyArrayForNonExistentGame(): void
    {
        $this->gameRepository->method('find')->willReturn(null);

        $result = $this->provider->provide($this->operation, ['id' => 999]);

        $this->assertEquals([], $result);
    }
}
