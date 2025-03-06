<?php

namespace App\Entity;

use ApiPlatform\Metadata\ApiResource;
use App\Config\PatchNoteImportance;
use App\Repository\PatchnoteRepository;
use Doctrine\DBAL\Types\Types;
use Doctrine\ORM\Mapping as ORM;
use ApiPlatform\Metadata\Post;
use ApiPlatform\Metadata\Delete;
use App\DataPersister\PatchnotePersister;
use Symfony\Component\Serializer\Attribute\Groups;

#[ORM\Entity(repositoryClass: PatchnoteRepository::class)]
#[ApiResource(
    new Post(security: "is_granted('ROLE_USER')",
        denormalizationContext: ['groups' => ['patchnote:write']],
        processor: PatchnotePersister::class
    ),
    new Delete(security: "is_granted('ROLE_ADMIN')"),
)]
class Patchnote
{
    #[ORM\Id]
    #[ORM\GeneratedValue]
    #[ORM\Column]
    private ?int $id = null;

    #[ORM\Column(length: 255, nullable: true)]
    #[Groups(['patchnote:write'])]
    private ?string $title = null;

    #[ORM\Column(type: Types::TEXT, nullable: true)]
    #[Groups(['patchnote:write'])]
    private ?string $content = null;

    #[ORM\Column(nullable: true)]
    #[Groups(['patchnote:write'])]
    private ?\DateTimeImmutable $releasedAt = null;

    #[ORM\Column]
    private ?\DateTimeImmutable $createdAt = null;

    #[ORM\ManyToOne(inversedBy: 'patchnotes')]
    private ?User $createdBy = null;

    #[ORM\Column(nullable: true, enumType: PatchNoteImportance::class)]
    #[Groups(['patchnote:write'])]
    private ?PatchNoteImportance $importance = null;

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
}
