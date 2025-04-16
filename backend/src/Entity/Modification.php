<?php

namespace App\Entity;

use ApiPlatform\Doctrine\Orm\Filter\SearchFilter;
use ApiPlatform\Metadata\ApiFilter;
use ApiPlatform\Metadata\ApiResource;
use ApiPlatform\Metadata\GetCollection;
use ApiPlatform\Metadata\Get;
use ApiPlatform\Metadata\Post;
use ApiPlatform\Metadata\Delete;
use App\DataPersister\ModificationPersister;
use App\DataPersister\ModificationDeleteProcessor;
use App\Interfaces\ReportableInterface;
use App\Repository\ModificationRepository;
use App\State\Provider\SoftDeletedStateProvider;
use Doctrine\DBAL\Types\Types;
use Doctrine\ORM\Mapping as ORM;
use Symfony\Component\Serializer\Attribute\Groups;


#[ORM\Entity(repositoryClass: ModificationRepository::class)]
#[ApiResource(
    operations: [
        new Get(
            uriTemplate: '/modifications/{id}',
            normalizationContext: ['groups' => ['modification:read']],
            security: "is_granted('ROLE_USER')",
            provider : SoftDeletedStateProvider::class,
        ),
        new GetCollection(
            uriTemplate: '/modifications',
            normalizationContext: ['groups' => ['modification:read']],
            security: "is_granted('ROLE_USER')",
            paginationEnabled: true,
            paginationItemsPerPage: 10,
            provider : SoftDeletedStateProvider::class,
        ),
        new Delete(
            uriTemplate: '/modifications/{id}',
            security: "is_granted('ROLE_ADMIN')",
            processor: ModificationDeleteProcessor::class
        )
    ],
)]

#[ApiFilter(SearchFilter::class, properties: ['patchnote.id' => 'exact'])]
class Modification implements ReportableInterface
{


    #[ORM\Id]
    #[ORM\GeneratedValue]
    #[ORM\Column]
    #[Groups(['modification:read'])]
    private ?int $id = null;



    #[ORM\Column]
    #[Groups(['modification:read'])]
    private ?\DateTimeImmutable $createdAt = null;

    #[ORM\ManyToOne(inversedBy: 'modifications')]
    #[ORM\JoinColumn(nullable: false)]
    #[Groups(['modification:read'])]
    private ?User $user = null;

    #[ORM\ManyToOne(inversedBy: 'modification')]
    #[ORM\JoinColumn(nullable: false)]
    #[Groups(['modification:write', 'modification:read'])]
    private ?Patchnote $patchnote = null;

    #[ORM\Column]
    #[Groups(['modification:read'])]
    private ?bool $isDeleted = null;

    #[ORM\Column(type: Types::ARRAY, nullable: true)]
    #[Groups(['modification:read'])]
    private ?array $difference = null;



    public function __construct() {
        $this->isDeleted = false;
        $this->createdAt = new \DateTimeImmutable();
    }

    public function getId(): ?int
    {
        return $this->id;
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

    public function getPatchnote(): ?Patchnote
    {
        return $this->patchnote;
    }

    public function setPatchnote(?Patchnote $patchnote): static
    {
        $this->patchnote = $patchnote;

        return $this;
    }

    #[Groups(['modification:read'])]
    public function isDeleted(): ?bool
    {
        return $this->isDeleted;
    }

    public function setIsDeleted(bool $isDeleted): static
    {
        $this->isDeleted = $isDeleted;

        return $this;
    }

    public function getDifference(): ?array
    {
        return $this->difference;
    }

    public function setDifference(?array $difference): static
    {
        $this->difference = $difference;

        return $this;
    }
}
