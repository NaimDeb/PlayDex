<?php

namespace App\Service;

use Symfony\Component\Console\Helper\ProgressBar;
use Symfony\Component\Console\Output\OutputInterface;
use Symfony\Component\Console\Style\SymfonyStyle;

class ProgressBarHandlerService
{
    /**
     * Initialize a progress bar with custom formatting
     */
    public function initializeProgressBar(OutputInterface $output, int $total, int $offset = 0): ProgressBar
    {
        $progressBar = new ProgressBar($output, $total - $offset);
        $progressBar->start();
        $progressBar->setFormat(
            "%status%\n%current%/%max% [%bar%] %percent:3s%%\n  %elapsed:6s%/%estimated:-6s%  %memory:6s%"
        );
        $progressBar->setBarCharacter('<fg=green>■</>');
        $progressBar->setEmptyBarCharacter("<fg=red>■</>");
        
        return $progressBar;
    }

    /**
     * Create a simple progress bar using SymfonyStyle
     */
    public function createSimpleProgressBar(SymfonyStyle $io, int $total): ProgressBar
    {
        $progressBar = $io->createProgressBar($total);
        $progressBar->setFormat('debug');
        $progressBar->start();
        
        return $progressBar;
    }

    /**
     * Update progress bar message with current batch info
     */
    public function updateBatchProgressMessage(ProgressBar $progressBar, int $current, int $fetchSize, int $batchCount, int $total): void
    {
        $progressBar->setMessage(sprintf(
            'Fetching items %d to %d...',
            $current,
            min($current + ($fetchSize * $batchCount), $total)
        ), 'status');
        $progressBar->display();
    }

    /**
     * Update progress with processing stats
     */
    public function updateWithProcessingStats(ProgressBar $progressBar, int $itemsProcessed, float $startTime, int $memoryUsage, string $itemType = 'items'): void
    {
        $elapsedTime = microtime(true) - $startTime;
        $rate = $itemsProcessed / max(0.1, $elapsedTime);

        // Show processing stats
        $progressBar->setMessage(sprintf(
            'Batch complete | Memory: %dMB | Speed: %.1f %s/sec',
            $memoryUsage,
            $rate,
            $itemType
        ), 'status');
    }

    /**
     * Apply rate limiting between batches
     */
    public function applyRateLimiting(ProgressBar $progressBar, float $startTime, float $minDuration = 1.0): void
    {
        $timeElapsed = microtime(true) - $startTime;
        $waitTime = max(0, $minDuration - $timeElapsed);

        if ($waitTime > 0) {
            $progressBar->setMessage('Rate limiting...', 'status');
            usleep($waitTime * 1000000);
        }
    }

    /**
     * Calculate batch offsets for parallel requests
     */
    public function calculateBatchOffsets(int $offset, int $fetchSize, int $parallelRequests, int $total): array
    {
        $batchOffsets = [];
        for ($j = 0; $j < $parallelRequests; $j++) {
            $currentOffset = $offset + ($j * $fetchSize);
            if ($currentOffset < $total) {
                $batchOffsets[] = $currentOffset;
            }
        }
        return $batchOffsets;
    }
}