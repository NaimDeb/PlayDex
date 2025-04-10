<?php

namespace App\Entity;

use ApiPlatform\Metadata\ApiResource;
use ApiPlatform\Metadata\GetCollection;
use ApiPlatform\Metadata\Post;
use ApiPlatform\Metadata\Delete;
use ApiPlatform\Metadata\Link;
use App\Repository\FollowedGamesRepository;
use App\State\Provider\FollowedGamesProvider;
use Doctrine\Common\Collections\ArrayCollection;
use Doctrine\Common\Collections\Collection;
use Doctrine\ORM\Mapping as ORM;
use Symfony\Component\Serializer\Attribute\Groups;

// Todo : Post doesn't work (create a processor to apply the followed_games list to the user ?)
// Todo : GetCollections asks for id

#[ApiResource(
    operations: [
        new GetCollection(
            uriTemplate: '/followed-games',
            normalizationContext: ['groups' => ['game:read']],
            paginationEnabled: true,
            paginationItemsPerPage: 10,
            security: "is_granted('ROLE_USER')",
            provider : FollowedGamesProvider::class
        ),
        new Post(
            uriTemplate: '/followed-games/{id}',
            normalizationContext: ['groups' => ['game:read']],
            denormalizationContext: ['groups' => ['game:write']],
            security: "is_granted('ROLE_USER')",
            uriVariables: [
            'id' => new Link(
                fromClass: Game::class,
                identifiers: ['id'],
                toProperty: 'game'
            )
            ],
            processor : FollowedGamesPersister::class,
        ),
        new Delete(
            uriTemplate: '/followed-games/{id}',
            security: "is_granted('ROLE_USER')",
        )  
    ]
)]
#[ORM\Entity(repositoryClass: FollowedGamesRepository::class)]
class FollowedGames
{
    #[ORM\Id]
    #[ORM\GeneratedValue]
    #[ORM\Column]
    private ?int $id = null;

    #[ORM\ManyToOne(inversedBy: 'followedGames')]
    #[ORM\JoinColumn(nullable: false)]
    private ?User $user = null;

    #[ORM\ManyToOne(inversedBy: 'followedGames')]
    #[ORM\JoinColumn(nullable: false)]
    private ?Game $game = null;

    

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

    

   
}
