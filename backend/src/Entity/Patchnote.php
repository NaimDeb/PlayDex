<?php

namespace App\Entity;

use ApiPlatform\Metadata\ApiResource;
use App\Config\PatchNoteImportance;
use App\Repository\PatchnoteRepository;
use Doctrine\Common\Collections\ArrayCollection;
use Doctrine\Common\Collections\Collection;
use Doctrine\DBAL\Types\Types;
use Doctrine\ORM\Mapping as ORM;

use ApiPlatform\Metadata\Delete;
use ApiPlatform\Metadata\Post;
use ApiPlatform\Metadata\Get;
use ApiPlatform\Metadata\GetCollection;
use ApiPlatform\Metadata\Patch;
use App\DataPersister\DiffMatchPatchProcessor;
use App\DataPersister\PatchnotePersister;
use App\DataPersister\PatchnoteDeleteProcessor;
use App\Interfaces\ReportableInterface;
use App\State\Provider\SoftDeletedStateProvider;
use Symfony\Component\Serializer\Attribute\Groups;


// Todo : check security

#[ORM\Entity(repositoryClass: PatchnoteRepository::class)]
#[ApiResource(
    operations: [
        new Post(
            security: "is_granted('ROLE_USER')",
            denormalizationContext: ['groups' => ['patchnote:write']],
            processor: PatchnotePersister::class
        ),
        new Delete(
            security: "is_granted('ROLE_ADMIN')",
            processor: PatchnoteDeleteProcessor::class
        ),
        new Get(
            normalizationContext: ['groups' => ['patchnote:read']],
            provider : SoftDeletedStateProvider::class,
        ),
        new Patch(
            security: "is_granted('ROLE_USER')",
            denormalizationContext: ['groups' => ['patchnote:write']],
            normalizationContext: ['groups' => ['patchnote:read']],
            processor: DiffMatchPatchProcessor::class,
        ),
        new GetCollection(
            security: "is_granted('ROLE_ADMIN')",
            normalizationContext: ['groups' => ['patchnote:admin']],
            filters: ['order']
        )
    ]
)]

class Patchnote implements ReportableInterface
{
    #[ORM\Id]
    #[ORM\GeneratedValue]
    #[ORM\Column]
    #[Groups(['patchnote:read'])]
    private ?int $id = null;

    #[ORM\Column(length: 255, nullable: true)]
    #[Groups(['patchnote:write', 'patchnote:read'])]
    private ?string $title = null;

    #[ORM\Column(type: Types::TEXT, nullable: true)]
    #[Groups(['patchnote:write', 'patchnote:read'])]
    private ?string $content = null;

    #[ORM\Column(nullable: true)]
    #[Groups(['patchnote:write', 'patchnote:read'])]
    private ?\DateTimeImmutable $releasedAt = null;

    #[ORM\Column]
    #[Groups(['patchnote:admin'])]
    private ?\DateTimeImmutable $createdAt = null;

    #[ORM\ManyToOne(inversedBy: 'patchnotes')]
    #[Groups(['patchnote:admin'])]
    private ?User $createdBy = null;

    #[ORM\Column(nullable: true, enumType: PatchNoteImportance::class)]
    #[Groups(['patchnote:write', 'patchnote:read'])]
    private ?PatchNoteImportance $importance = null;

    #[ORM\ManyToOne(inversedBy: 'patchnotes')]
    #[ORM\JoinColumn(nullable: false)]
    #[Groups(['patchnote:write', 'patchnote:read'])]
    private ?Game $game = null;

    #[ORM\Column(type: Types::TEXT, nullable: true)]
    #[Groups(['patchnote:write', 'patchnote:read'])]
    private ?string $smallDescription = null;

    /**
     * @var Collection<int, Modification>
     */
    #[ORM\OneToMany(targetEntity: Modification::class, mappedBy: 'patchnote', orphanRemoval: true)]
    private Collection $modification;

    #[ORM\Column]
    private ?bool $isDeleted = null;

    public function __construct()
    {
        $this->modification = new ArrayCollection();
        $this->isDeleted = false;
    }



    public function getId(): ?int
    {
        return $this->id;
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

    public function getContent(): ?string
    {
        return $this->content;
    }

    public function setContent(?string $content): static
    {
        $this->content = $content;

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

    public function getCreatedAt(): ?\DateTimeImmutable
    {
        return $this->createdAt;
    }

    public function setCreatedAt(\DateTimeImmutable $createdAt): static
    {
        $this->createdAt = $createdAt;

        return $this;
    }

    public function getCreatedBy(): ?User
    {
        return $this->createdBy;
    }

    public function setCreatedBy(?User $createdBy): static
    {
        $this->createdBy = $createdBy;

        return $this;
    }

    public function getImportance(): ?PatchNoteImportance
    {
        return $this->importance;
    }

    public function setImportance(?PatchNoteImportance $importance): static
    {
        $this->importance = $importance;

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

    public function getSmallDescription(): ?string
    {
        return $this->smallDescription;
    }

    public function setSmallDescription(?string $smallDescription): static
    {
        $this->smallDescription = $smallDescription;

        return $this;
    }

    /**
     * @return Collection<int, Modification>
     */
    public function getModification(): Collection
    {
        return $this->modification;
    }

    public function addModification(Modification $modification): static
    {
        if (!$this->modification->contains($modification)) {
            $this->modification->add($modification);
            $modification->setPatchnote($this);
        }

        return $this;
    }

    public function removeModification(Modification $modification): static
    {
        if ($this->modification->removeElement($modification)) {
            // set the owning side to null (unless already changed)
            if ($modification->getPatchnote() === $this) {
                $modification->setPatchnote(null);
            }
        }

        return $this;
    }

    public function isDeleted(): ?bool
    {
        return $this->isDeleted;
    }

    public function setIsDeleted(bool $isDeleted): static
    {
        $this->isDeleted = $isDeleted;

        return $this;
    }
}
