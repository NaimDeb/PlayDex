<?php

declare(strict_types=1);

namespace App\Service\Steam;

use App\Config\SteamConfig;
use Psr\Log\LoggerInterface;
use Symfony\Component\DependencyInjection\ParameterBag\ParameterBagInterface;
use Symfony\Component\Process\Process;

class SteamPollerService
{
    private string $projectDir;

    public function __construct(
        private readonly ParameterBagInterface $params,
        private readonly LoggerInterface $logger,
    ) {
        $this->projectDir = $this->params->get('kernel.project_dir');
    }

    /**
     * Run the Node.js steam-poller script and return parsed patchnotes.
     *
     * @return array<int, array{appid: int, gid: string, title: string, content: string, date: int}>
     */
    public function poll(): array
    {
        $scriptPath = $this->projectDir . '/' . SteamConfig::POLLER_SCRIPT_PATH;

        $process = new Process(
            ['node', $scriptPath],
            $this->projectDir,
            [
                'STEAM_USERNAME' => $this->params->get('STEAM_USERNAME'),
                'STEAM_PASSWORD' => $this->params->get('STEAM_PASSWORD'),
            ],
            null,
            SteamConfig::POLLER_TIMEOUT
        );

        $process->run();

        if (!$process->isSuccessful()) {
            $this->logger->error('Steam poller failed', [
                'exitCode' => $process->getExitCode(),
                'stderr' => $process->getErrorOutput(),
            ]);

            return [];
        }

        $stderr = $process->getErrorOutput();
        if ($stderr) {
            $this->logger->info('Steam poller output', ['stderr' => $stderr]);
        }

        $output = trim($process->getOutput());
        if ($output === '' || $output === '[]') {
            return [];
        }

        $data = json_decode($output, true);
        if (!is_array($data)) {
            $this->logger->error('Steam poller returned invalid JSON', ['output' => $output]);
            return [];
        }

        return $data;
    }
}
