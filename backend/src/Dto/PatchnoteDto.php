<?php

declare(strict_types=1);

namespace App\Dto;

/**
 * Data Transfer Object for patchnote data from external sources.
 */
final readonly class PatchnoteDto
{
    public function __construct(
        public string $externalId,
        public string $title,
        public string $content,
        public \DateTimeImmutable $releasedAt,
        public string $source,
        public ?string $smallDescription = null,
        public ?string $url = null,
    ) {
    }

    /**
     * Create from Steam News API response.
     *
     * @param array<string, mixed> $data
     */
    public static function fromSteam(array $data): self
    {
        return new self(
            externalId: (string) ($data['gid'] ?? ''),
            title: $data['title'] ?? '',
            content: $data['contents'] ?? '',
            releasedAt: (new \DateTimeImmutable())->setTimestamp($data['date'] ?? time()),
            source: 'steam',
            url: $data['url'] ?? null,
        );
    }
}
