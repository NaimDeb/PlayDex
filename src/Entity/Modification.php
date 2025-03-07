<?php

namespace App\Entity;

use ApiPlatform\Metadata\ApiResource;
use App\Repository\ModificationRepository;
use Doctrine\Common\Collections\ArrayCollection;
use Doctrine\Common\Collections\Collection;
use Doctrine\DBAL\Types\Types;
use Doctrine\ORM\Mapping as ORM;

#[ORM\Entity(repositoryClass: ModificationRepository::class)]
#[ApiResource]
class Modification
{
    #[ORM\Id]
    #[ORM\GeneratedValue]
    #[ORM\Column]
    private ?int $id = null;

    #[ORM\Column(type: Types::TEXT)]
    private ?string $difference = null;

    #[ORM\Column]
    private ?\DateTimeImmutable $createdAt = null;

    #[ORM\ManyToOne(inversedBy: 'modifications')]
    #[ORM\JoinColumn(nullable: false)]
    private ?User $user = null;

    /**
     * @var Collection<int, Patchnote>
     */
    #[ORM\OneToMany(targetEntity: Patchnote::class, mappedBy: 'modification')]
    private Collection $patchnote;

    public function __construct()
    {
        $this->patchnote = new ArrayCollection();
    }

    public function getId(): ?int
    {
        return $this->id;
    }

    public function getDifference(): ?string
    {
        return $this->difference;
    }

    public function setDifference(string $difference): static
    {
        $this->difference = $difference;

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

    public function getUser(): ?User
    {
        return $this->user;
    }

    public function setUser(?User $user): static
    {
        $this->user = $user;

        return $this;
    }

    /**
     * @return Collection<int, Patchnote>
     */
    public function getPatchnote(): Collection
    {
        return $this->patchnote;
    }

    public function addPatchnote(Patchnote $patchnote): static
    {
        if (!$this->patchnote->contains($patchnote)) {
            $this->patchnote->add($patchnote);
            $patchnote->setModification($this);
        }

        return $this;
    }

    public function removePatchnote(Patchnote $patchnote): static
    {
        if ($this->patchnote->removeElement($patchnote)) {
            // set the owning side to null (unless already changed)
            if ($patchnote->getModification() === $this) {
                $patchnote->setModification(null);
            }
        }

        return $this;
    }
}
