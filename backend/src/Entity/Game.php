<?php

namespace App\Entity;

use ApiPlatform\Metadata\ApiResource;
use App\Repository\GameRepository;
use Doctrine\Common\Collections\ArrayCollection;
use Doctrine\Common\Collections\Collection;
use Doctrine\DBAL\Types\Types;
use Doctrine\ORM\Mapping as ORM;
use Symfony\Component\Serializer\Attribute\Groups;
use ApiPlatform\Metadata\Get;
use ApiPlatform\Metadata\GetCollection;
use App\State\Provider\GameExtensionsProvider;
use App\State\Provider\GamePatchnotesProvider;

use ApiPlatform\Metadata\ApiFilter;
use ApiPlatform\Doctrine\Orm\Filter\SearchFilter;
use ApiPlatform\Doctrine\Orm\Filter\DateFilter;
use ApiPlatform\Doctrine\Orm\Filter\OrderFilter;
use ApiPlatform\Doctrine\Orm\Filter\ExistsFilter;
use App\State\Provider\GameLatestProvider;
use App\Filter\NotNullReleasedAtFilter;

#[ORM\Entity(repositoryClass: GameRepository::class)]
#[ApiResource(
    operations: [
        new Get(
            name: 'getGame',
            uriTemplate: '/games/{id}',
            normalizationContext: ['groups' => ['game:read']],
        ),
        new GetCollection(
            uriTemplate: '/games',
            normalizationContext: ['groups' => ['game:read']],
            paginationEnabled: true,
            paginationItemsPerPage: 10,
        ),
        new Get(
            name: 'getExtensions',
            uriTemplate: '/games/{id}/extensions',
            normalizationContext: ['groups' => ['game:read', 'extension:read']],
            provider: GameExtensionsProvider::class
        ),
        new Get(
            name: 'getPatchnotes',
            uriTemplate: '/games/{id}/patchnotes',
            normalizationContext: ['groups' => ['game:read', 'patchnote:read']],
            provider: GamePatchnotesProvider::class
        )
    ]
)]

#[ApiFilter(SearchFilter::class, properties: [
    'title' => 'partial',
    'description' => 'partial',
    'genres.name' => 'exact',
    'companies.name' => 'partial'
])]
#[ApiFilter(DateFilter::class, properties: ['releasedAt', 'lastUpdatedAt'])]
#[ApiFilter(OrderFilter::class, properties: [
    'title',
    'releasedAt' => ['nulls_comparison' => 'nulls_largest'],
    'lastUpdatedAt' => ['nulls_comparison' => 'nulls_largest'],
    'id'
])]

class Game
{
    #[ORM\Id]
    #[ORM\GeneratedValue]
    #[ORM\Column]
    #[Groups(['game:read', 'patchnote:read', 'modification:admin'])]
    private ?int $id = null;

    #[ORM\Column(nullable: true)]
    #[Groups('game:read')]
    private ?int $steamId = null;

    #[ORM\Column(nullable: true)]
    #[Groups('game:read')]
    private ?int $apiId = null;

    #[ORM\Column(length: 255, nullable: true)]
    #[Groups(['game:read', 'extension:read', 'patchnote:read', 'modification:admin'])]
    private ?string $title = null;

    #[ORM\Column(type: Types::TEXT, nullable: true)]
    #[Groups('game:read')]
    private ?string $description = null;

    #[ORM\Column(length: 255, nullable: true)]
    #[Groups('game:read')]
    private ?string $imageUrl = null;

    #[ORM\Column(nullable: true)]
    #[Groups('game:read')]
    private ?\DateTimeImmutable $releasedAt = null;

    #[ORM\Column(nullable: true)]
    #[Groups('game:read')]
    private ?\DateTimeImmutable $lastUpdatedAt = null;

    /**
     * @var Collection<int, Extension>
     */
    #[ORM\OneToMany(targetEntity: Extension::class, mappedBy: 'game', orphanRemoval: true)]
    #[Groups('game:read', 'extension:read')]
    private Collection $extensions;

    /**
     * @var Collection<int, Patchnote>
     */
    #[ORM\OneToMany(targetEntity: Patchnote::class, mappedBy: 'game', orphanRemoval: true)]
    private Collection $patchnotes;

    /**
     * @var Collection<int, Company>
     */
    #[ORM\ManyToMany(targetEntity: Company::class, mappedBy: 'game')]
    #[Groups('game:read')]
    private Collection $companies;


    /**
     * @var Collection<int, Genre>
     */
    #[ORM\ManyToMany(targetEntity: Genre::class, mappedBy: 'games')]
    #[Groups('game:read')]
    private Collection $genres;

    /**
     * @var Collection<int, FollowedGames>
     */
    #[ORM\OneToMany(targetEntity: FollowedGames::class, mappedBy: 'game', orphanRemoval: true)]
    private Collection $followedGames;




    public function __construct()
    {
        $this->extensions = new ArrayCollection();
        $this->patchnotes = new ArrayCollection();
        $this->companies = new ArrayCollection();
        $this->genres = new ArrayCollection();
        $this->followedGames = new ArrayCollection();
    }


    public function getId(): ?int
    {
        return $this->id;
    }

    public function getSteamId(): ?int
    {
        return $this->steamId;
    }

    public function setSteamId(?int $steamId): static
    {
        $this->steamId = $steamId;

        return $this;
    }

    public function getApiId(): ?int
    {
        return $this->apiId;
    }

    public function setApiId(?int $apiId): static
    {
        $this->apiId = $apiId;

        return $this;
    }

    public function getTitle(): ?string
    {
        return $this->title;
    }

    public function setTitle(?string $title): static
    {
        $this->title = $title;

        return $this;
    }

    public function getDescription(): ?string
    {
        return $this->description;
    }

    public function setDescription(?string $description): static
    {
        $this->description = $description;

        return $this;
    }

    public function getImageUrl(): ?string
    {
        return $this->imageUrl;
    }

    public function setImageUrl(?string $imageUrl): static
    {
        $this->imageUrl = $imageUrl;

        return $this;
    }

    public function getReleasedAt(): ?\DateTimeImmutable
    {
        return $this->releasedAt;
    }

    public function setReleasedAt(?\DateTimeImmutable $releasedAt): static
    {
        $this->releasedAt = $releasedAt;

        return $this;
    }

    public function getLastUpdatedAt(): ?\DateTimeImmutable
    {
        return $this->lastUpdatedAt;
    }

    public function setLastUpdatedAt(?\DateTimeImmutable $lastUpdatedAt): static
    {
        $this->lastUpdatedAt = $lastUpdatedAt;

        return $this;
    }

    /**
     * @return Collection<int, Extension>
     */
    public function getExtensions(): Collection
    {
        return $this->extensions;
    }

    public function addExtension(Extension $extension): static
    {
        if (!$this->extensions->contains($extension)) {
            $this->extensions->add($extension);
            $extension->setGame($this);
        }

        return $this;
    }

    public function removeExtension(Extension $extension): static
    {
        if ($this->extensions->removeElement($extension)) {
            // set the owning side to null (unless already changed)
            if ($extension->getGame() === $this) {
                $extension->setGame(null);
            }
        }

        return $this;
    }

    /**
     * @return Collection<int, Patchnote>
     */
    public function getPatchnotes(): Collection
    {
        return $this->patchnotes;
    }

    public function addPatchnote(Patchnote $patchnote): static
    {
        if (!$this->patchnotes->contains($patchnote)) {
            $this->patchnotes->add($patchnote);
            $patchnote->setGame($this);
        }

        return $this;
    }

    public function removePatchnote(Patchnote $patchnote): static
    {
        if ($this->patchnotes->removeElement($patchnote)) {
            // set the owning side to null (unless already changed)
            if ($patchnote->getGame() === $this) {
                $patchnote->setGame(null);
            }
        }

        return $this;
    }

    /**
     * @return Collection<int, Company>
     */
    public function getCompanies(): Collection
    {
        return $this->companies;
    }

    public function addCompany(Company $company): static
    {
        if (!$this->companies->contains($company)) {
            $this->companies->add($company);
            $company->addGame($this);
        }

        return $this;
    }

    public function removeCompany(Company $company): static
    {
        if ($this->companies->removeElement($company)) {
            $company->removeGame($this);
        }

        return $this;
    }



    /**
     * @return Collection<int, Genre>
     */
    public function getGenres(): Collection
    {
        return $this->genres;
    }

    public function addGenre(Genre $genre): static
    {
        if (!$this->genres->contains($genre)) {
            $this->genres->add($genre);
            $genre->addGame($this);
        }

        return $this;
    }

    public function removeGenre(Genre $genre): static
    {
        if ($this->genres->removeElement($genre)) {
            $genre->removeGame($this);
        }

        return $this;
    }

    /**
     * @return Collection<int, FollowedGames>
     */
    public function getFollowedGames(): Collection
    {
        return $this->followedGames;
    }

    public function addFollowedGame(FollowedGames $followedGame): static
    {
        if (!$this->followedGames->contains($followedGame)) {
            $this->followedGames->add($followedGame);
            $followedGame->setGame($this);
        }

        return $this;
    }

    public function removeFollowedGame(FollowedGames $followedGame): static
    {
        if ($this->followedGames->removeElement($followedGame)) {
            // set the owning side to null (unless already changed)
            if ($followedGame->getGame() === $this) {
                $followedGame->setGame(null);
            }
        }

        return $this;
    }
}
