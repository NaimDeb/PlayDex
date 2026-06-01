<?php

namespace App\Tests\Unit\State\Provider;

use ApiPlatform\Metadata\Operation;
use App\Entity\Game;
use App\Entity\Patchnote;
use App\Repository\GameRepository;
use App\State\Provider\GamePatchnotesProvider;
use Doctrine\Common\Collections\ArrayCollection;
use PHPUnit\Framework\TestCase;

class GamePatchnotesProviderTest extends TestCase
{
    private GameRepository $gameRepository;
    private GamePatchnotesProvider $provider;
    private Operation $operation;

    protected function setUp(): void
    {
        $this->gameRepository = $this->createMock(GameRepository::class);
        $this->operation = $this->createMock(Operation::class);
        $this->provider = new GamePatchnotesProvider($this->gameRepository);
    }

    public function testProvideReturnsPatchnotesForExistingGame(): void
    {
        $patchnotes = new ArrayCollection([new Patchnote(), new Patchnote()]);

        $game = $this->createMock(Game::class);
        $game->method('getPatchnotes')->willReturn($patchnotes);

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
