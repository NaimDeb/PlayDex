<?php

namespace App\Tests\Unit\Command;

use App\Command\AbstractDataImporterCommand;
use App\Interfaces\Api\DataFetcherInterface;
use App\Interfaces\Api\DataProcessorInterface;
use App\Interfaces\Api\DataStorageInterface;
use Symfony\Component\Console\Application;
use Symfony\Component\Console\Tester\CommandTester;
use PHPUnit\Framework\TestCase;

class AbstractDataImporterCommandTest extends TestCase
{
    private DataFetcherInterface|\PHPUnit\Framework\MockObject\MockObject $fetcher;
    private DataProcessorInterface|\PHPUnit\Framework\MockObject\MockObject $processor;
    private DataStorageInterface|\PHPUnit\Framework\MockObject\MockObject $storage;
    private AbstractDataImporterCommand $command;

    protected function setUp(): void
    {
        $this->fetcher = $this->createMock(DataFetcherInterface::class);
        $this->processor = $this->createMock(DataProcessorInterface::class);
        $this->storage = $this->createMock(DataStorageInterface::class);

        // Create concrete implementation for testing
        $this->command = new class(
            $this->fetcher,
            $this->processor,
            $this->storage
        ) extends AbstractDataImporterCommand {
            protected static $defaultName = 'test:import';
            protected static $defaultDescription = 'Test data import';

            protected string $sourceName = 'test-source';
        };
    }

    public function testCommandInitializesWithServices(): void
    {
        $this->assertInstanceOf(AbstractDataImporterCommand::class, $this->command);
    }

    public function testCommandExecutesSuccessfully(): void
    {
        $this->fetcher->expects($this->once())->method('getCount')->willReturn(100);
        $this->fetcher->expects($this->atLeast(1))->method('fetchBatch')->willReturn([
            ['id' => 1, 'name' => 'Item 1'],
        ]);
        $this->processor->expects($this->atLeast(1))->method('process')->willReturnArgument(0);
        $this->storage->expects($this->atLeast(1))->method('store')->willReturn(true);

        $application = new Application();
        $application->add($this->command);

        $tester = new CommandTester($this->command);
        $statusCode = $tester->execute([]);

        $this->assertEquals(0, $statusCode);
    }

    public function testCommandDisplaysProgressOutput(): void
    {
        $this->fetcher->expects($this->once())->method('getCount')->willReturn(10);
        $this->fetcher->expects($this->atLeast(1))->method('fetchBatch')->willReturn([
            ['id' => 1, 'name' => 'Item 1'],
        ]);
        $this->processor->expects($this->atLeast(1))->method('process')->willReturnArgument(0);
        $this->storage->expects($this->atLeast(1))->method('store')->willReturn(true);

        $tester = new CommandTester($this->command);
        $tester->execute([]);

        $output = $tester->getDisplay();
        // Should show progress information
        $this->assertNotEmpty($output);
    }

    public function testCommandHandlesEmptyResult(): void
    {
        $this->fetcher->expects($this->once())->method('getCount')->willReturn(0);
        $this->fetcher->expects($this->never())->method('fetchBatch');

        $tester = new CommandTester($this->command);
        $statusCode = $tester->execute([]);

        $this->assertEquals(0, $statusCode);
    }

    public function testCommandBatchProcessing(): void
    {
        $batchSize = 50;
        $totalItems = 150; // 3 batches

        $this->fetcher->expects($this->once())->method('getCount')->willReturn($totalItems);
        $this->fetcher->expects($this->exactly(3))->method('fetchBatch');

        // Mock batches
        $batch1 = array_map(fn($i) => ['id' => $i, 'name' => "Item $i"], range(1, 50));
        $batch2 = array_map(fn($i) => ['id' => $i, 'name' => "Item $i"], range(51, 100));
        $batch3 = array_map(fn($i) => ['id' => $i, 'name' => "Item $i"], range(101, 150));

        $this->fetcher
            ->expects($this->exactly(3))
            ->method('fetchBatch')
            ->willReturnOnConsecutiveCalls($batch1, $batch2, $batch3);

        $this->processor->expects($this->exactly(3))->method('process')->willReturnArgument(0);
        $this->storage->expects($this->exactly(3))->method('store')->willReturn(true);

        $tester = new CommandTester($this->command);
        $statusCode = $tester->execute([]);

        $this->assertEquals(0, $statusCode);
    }

    public function testCommandHandlesProcessingError(): void
    {
        $this->fetcher->expects($this->once())->method('getCount')->willReturn(10);
        $this->fetcher->expects($this->once())->method('fetchBatch')->willReturn([
            ['id' => 1, 'name' => 'Item 1'],
        ]);
        $this->processor->expects($this->once())->method('process')->willThrowException(
            new \Exception('Processing error')
        );

        $tester = new CommandTester($this->command);
        $statusCode = $tester->execute([]);

        $this->assertNotEquals(0, $statusCode);
    }

    public function testCommandHandlesStorageError(): void
    {
        $this->fetcher->expects($this->once())->method('getCount')->willReturn(10);
        $this->fetcher->expects($this->once())->method('fetchBatch')->willReturn([
            ['id' => 1, 'name' => 'Item 1'],
        ]);
        $this->processor->expects($this->once())->method('process')->willReturnArgument(0);
        $this->storage->expects($this->once())->method('store')->willReturn(false);

        $tester = new CommandTester($this->command);
        $statusCode = $tester->execute([]);

        $this->assertNotEquals(0, $statusCode);
    }

    public function testCommandSupportsTimestampFilter(): void
    {
        $this->fetcher->expects($this->once())->method('getCount')->with(1704067200)->willReturn(5);
        $this->fetcher->expects($this->atLeast(1))->method('fetchBatch')->willReturn([
            ['id' => 1, 'name' => 'Item 1'],
        ]);
        $this->processor->expects($this->atLeast(1))->method('process')->willReturnArgument(0);
        $this->storage->expects($this->atLeast(1))->method('store')->willReturn(true);

        $tester = new CommandTester($this->command);
        $statusCode = $tester->execute(['--from' => '1704067200']);

        $this->assertEquals(0, $statusCode);
    }

    public function testCommandReturnsCounts(): void
    {
        $this->fetcher->expects($this->once())->method('getCount')->willReturn(100);
        $this->fetcher->expects($this->exactly(2))->method('fetchBatch')->willReturnOnConsecutiveCalls(
            array_map(fn($i) => ['id' => $i], range(1, 50)),
            array_map(fn($i) => ['id' => $i], range(51, 100))
        );
        $this->processor->expects($this->exactly(2))->method('process')->willReturnArgument(0);
        $this->storage->expects($this->exactly(2))->method('store')->willReturn(true);

        $tester = new CommandTester($this->command);
        $statusCode = $tester->execute([]);

        $this->assertEquals(0, $statusCode);
        $output = $tester->getDisplay();
        $this->assertNotEmpty($output);
    }

    public function testCommandInvokesServicesInCorrectOrder(): void
    {
        $callOrder = [];

        $this->fetcher
            ->expects($this->once())
            ->method('getCount')
            ->willReturnCallback(function () use (&$callOrder) {
                $callOrder[] = 'fetch_count';
                return 1;
            });

        $this->fetcher
            ->expects($this->once())
            ->method('fetchBatch')
            ->willReturnCallback(function () use (&$callOrder) {
                $callOrder[] = 'fetch_batch';
                return [['id' => 1, 'name' => 'Item 1']];
            });

        $this->processor
            ->expects($this->once())
            ->method('process')
            ->willReturnCallback(function ($data) use (&$callOrder) {
                $callOrder[] = 'process';
                return $data;
            });

        $this->storage
            ->expects($this->once())
            ->method('store')
            ->willReturnCallback(function () use (&$callOrder) {
                $callOrder[] = 'store';
                return true;
            });

        $tester = new CommandTester($this->command);
        $tester->execute([]);

        $this->assertEquals(['fetch_count', 'fetch_batch', 'process', 'store'], $callOrder);
    }
}
