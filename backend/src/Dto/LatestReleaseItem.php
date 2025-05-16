<?php

namespace App\Dto;

use ApiPlatform\Metadata\ApiResource;
use App\State\Provider\LatestReleasesProvider;
use ApiPlatform\Metadata\Get;


#[ApiResource(
    collectionOperations: [
        new Get(
            name: 'getLatestReleases',
            uriTemplate: '/latest-releases',
            normalizationContext: ['groups' => ['game:read', 'extension:read']],
            provider: LatestReleasesProvider::class,
        )
    ],
    itemOperations: []
)]
class LatestReleaseItem
{
    public string $type;
    public int $id;
    public string $title;
    public ?\DateTimeImmutable $releasedAt = null;
    public ?\DateTimeImmutable $lastUpdatedAt = null;
}
