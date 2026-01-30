<?php

declare(strict_types=1);

namespace App\Dto;

/**
 * Data Transfer Object for game data from external sources.
 */
final readonly class GameDto
{
    public function __construct(
        public string $externalId,
        public string $title,
        public ?string $description = null,
        public ?string $imageUrl = null,
        public ?\DateTimeImmutable $releasedAt = null,
        public ?int $steamId = null,
        public ?int $igdbId = null,
        /** @var string[] */
        public array $genres = [],
        /** @var string[] */
        public array $companies = [],
    ) {
    }

    /**
     * Create from IGDB API response.
     *
     * @param array<string, mixed> $data
     */
    public static function fromIgdb(array $data): self
    {
        return new self(
            externalId: (string) ($data['id'] ?? ''),
            title: $data['name'] ?? '',
            description: $data['summary'] ?? null,
            imageUrl: isset($data['cover']['url']) ? 'https:' . $data['cover']['url'] : null,
            releasedAt: isset($data['first_release_date'])
                ? (new \DateTimeImmutable())->setTimestamp($data['first_release_date'])
                : null,
            igdbId: $data['id'] ?? null,
            steamId: $data['steam_id'] ?? null,
            genres: array_map(fn($g) => $g['name'] ?? '', $data['genres'] ?? []),
            companies: array_map(fn($c) => $c['company']['name'] ?? '', $data['involved_companies'] ?? []),
        );
    }
}
