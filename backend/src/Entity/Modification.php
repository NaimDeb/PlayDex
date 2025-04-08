<?php

namespace App\Entity;

use ApiPlatform\Doctrine\Orm\Filter\SearchFilter;
use ApiPlatform\Metadata\ApiFilter;
use ApiPlatform\Metadata\ApiResource;
use ApiPlatform\Metadata\GetCollection;
use ApiPlatform\Metadata\Get;
use ApiPlatform\Metadata\Post;
use App\DataPersister\ModificationPersister;
use App\Interfaces\ReportableInterface;
use App\Repository\ModificationRepository;
use Doctrine\DBAL\Types\Types;
use Doctrine\ORM\Mapping as ORM;
use Symfony\Component\Serializer\Attribute\Groups;


#[ORM\Entity(repositoryClass: ModificationRepository::class)]
#[ApiResource(
    operations: [
        new Post(
            uriTemplate: '/modifications',
            denormalizationContext: ['groups' => ['modification:write']],
            security: "is_granted('ROLE_USER')",
            processor: ModificationPersister::class
        ),
        new Get(
            uriTemplate: '/modifications/{id}',
            normalizationContext: ['groups' => ['modification:read']],
            security: "is_granted('ROLE_USER')"
        ),
        new GetCollection(
            uriTemplate: '/modifications',
            normalizationContext: ['groups' => ['modification:read']],
            security: "is_granted('ROLE_USER')",
            paginationEnabled: true,
            paginationItemsPerPage: 10,
        )
    ],
)]

#[ApiFilter(SearchFilter::class, properties: ['patchnote.id' => 'exact'])]
class Modification implements ReportableInterface
{
    #[ORM\Id]
    #[ORM\GeneratedValue]
    #[ORM\Column]
    private ?int $id = null;

    #[ORM\Column(type: Types::TEXT)]
    #[Groups(['modification:write', 'modification:read'])]
    private ?string $difference = null;

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



    public function __construct()
    {
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

    public function getPatchnote(): ?Patchnote
    {
        return $this->patchnote;
    }

    public function setPatchnote(?Patchnote $patchnote): static
    {
        $this->patchnote = $patchnote;

        return $this;
    }

   
}
