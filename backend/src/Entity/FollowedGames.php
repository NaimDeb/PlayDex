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

    /**
     * @var Collection<int, Game>
     */
    #[ORM\ManyToMany(targetEntity: Game::class, inversedBy: 'followedGames')]
    private Collection $game;

    /**
     * @var Collection<int, User>
     */
    #[ORM\OneToMany(targetEntity: User::class, mappedBy: 'followedGames')]
    private Collection $user;

    public function __construct()
    {
        $this->game = new ArrayCollection();
        $this->user = new ArrayCollection();
    }

    public function getId(): ?int
    {
        return $this->id;
    }

    /**
     * @return Collection<int, Game>
     */
    public function getGame(): Collection
    {
        return $this->game;
    }

    public function addGame(Game $game): static
    {
        if (!$this->game->contains($game)) {
            $this->game->add($game);
        }

        return $this;
    }

    public function removeGame(Game $game): static
    {
        $this->game->removeElement($game);

        return $this;
    }

    /**
     * @return Collection<int, User>
     */
    public function getUser(): Collection
    {
        return $this->user;
    }

    public function addUser(User $user): static
    {
        if (!$this->user->contains($user)) {
            $this->user->add($user);
            $user->setFollowedGames($this);
        }

        return $this;
    }

    public function removeUser(User $user): static
    {
        if ($this->user->removeElement($user)) {
            // set the owning side to null (unless already changed)
            if ($user->getFollowedGames() === $this) {
                $user->setFollowedGames(null);
            }
        }

        return $this;
    }

   
}
