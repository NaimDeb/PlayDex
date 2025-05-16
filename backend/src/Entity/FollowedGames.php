<?php

namespace App\Entity;

use ApiPlatform\Metadata\ApiResource;
use ApiPlatform\Metadata\GetCollection;
use ApiPlatform\Metadata\Post;
use ApiPlatform\Metadata\Delete;
use ApiPlatform\Metadata\Link;
use App\DataPersister\FollowedGamesDeleteProcessor;
use App\DataPersister\FollowedGamesPersister;
use App\Repository\FollowedGamesRepository;
use App\State\Provider\FollowedGamesProvider;
use Doctrine\ORM\Mapping as ORM;
use Symfony\Component\Serializer\Attribute\Groups;

// Todo : GetCollections asks for id

#[ApiResource(
    operations: [
        new GetCollection(
            uriTemplate: '/followed-games',
            normalizationContext: ['groups' => ['game:read', 'followedGames:read']],
            paginationEnabled: true,
            paginationItemsPerPage: 10,
            security: "is_granted('ROLE_USER')",
            provider: FollowedGamesProvider::class,
        ),
        new Post(
            uriTemplate: '/followed-games/{id}',
            security: "is_granted('ROLE_USER')",
            uriVariables: [
            'id' => new Link(
                fromClass: Game::class,
                identifiers: ['id'],
                toProperty: 'game'
            )
            ],
            processor : FollowedGamesPersister::class,
            input: false,
        ),
        new Delete(
            uriTemplate: '/followed-games/{id}',
            security: "is_granted('ROLE_USER')",
            uriVariables: [
                'id' => new Link(
                    fromClass: Game::class,
                    identifiers: ['id'],
                    toProperty: 'game'
                )
            ],
            provider: FollowedGamesProvider::class,
            processor: FollowedGamesDeleteProcessor::class,
            input: false,


        ) ,
        new GetCollection(
            uriTemplate: '/followed-games/absence',
            normalizationContext: ['groups' => ['game:read', 'followedGames:read']],
            paginationEnabled: true,
            paginationItemsPerPage: 10,
            security: "is_granted('ROLE_USER')",
            provider: FollowedGamesAbsenceProvider::class,
        ),
    ]
)]
#[ORM\Entity(repositoryClass: FollowedGamesRepository::class)]
// #[ORM\UniqueConstraint(name: "user_game_unique", columns: ["user_id", "game_id"])]
class FollowedGames
{
    #[ORM\Id]
    #[ORM\GeneratedValue]
    #[ORM\Column]
    #[Groups(['followedGames:read'])]
    private ?int $id = null;

    #[ORM\ManyToOne(inversedBy: 'followedGames')]
    #[ORM\JoinColumn(nullable: false)]
    private ?User $user = null;

    #[ORM\ManyToOne(inversedBy: 'followedGames')]
    #[ORM\JoinColumn(nullable: false)]
    #[Groups(['followedGames:read'])]
    private ?Game $game = null;

    #[ORM\Column(nullable: true)]
    private ?\DateTimeImmutable $lastCheckedAt = null;

    

    public function __construct()
    {
       
    }

    public function getId(): ?int
    {
        return $this->id;
    }

    public function getUser(): ?User
    {
        return $this->user;
    }

    public function setUser(?User $user): static
    {
        $this->user = $user;

        return $this;
    }

    public function getGame(): ?Game
    {
        return $this->game;
    }

    public function setGame(?Game $game): static
    {
        $this->game = $game;

        return $this;
    }

    public function getLastCheckedAt(): ?\DateTimeImmutable
    {
        return $this->lastCheckedAt;
    }

    public function setLastCheckedAt(?\DateTimeImmutable $lastCheckedAt): static
    {
        $this->lastCheckedAt = $lastCheckedAt;

        return $this;
    }

    

   
}
