<?php

namespace App\Entity;

use ApiPlatform\Metadata\ApiResource;
use ApiPlatform\Metadata\GetCollection;
use ApiPlatform\Metadata\Post;
use ApiPlatform\Metadata\Delete;
use App\State\Processor\ReportProcessor;
use App\State\Processor\ReportDeleteProcessor;
use App\Interfaces\Entity\SoftDeletableInterface;
use App\Repository\ReportRepository;
use App\State\Provider\AdminReportProvider;
use App\State\Provider\SoftDeletedStateProvider;
use Doctrine\DBAL\Types\Types;
use Doctrine\ORM\Mapping as ORM;
use App\Traits\SoftDeletableTrait;
use Symfony\Component\Serializer\Attribute\Groups;
use Symfony\Component\Validator\Constraints as Assert;

#[ApiResource(
    operations: [
        new GetCollection(
            uriTemplate: '/reports',
            normalizationContext: ['groups' => ['report:read', 'user:read']],
            denormalizationContext: ['groups' => ['report:write']],
            security: "is_granted('ROLE_ADMIN')",
            securityMessage: 'Only admins can view reports.',
            provider: AdminReportProvider::class,
        ),
        new Post(
            uriTemplate: '/reports',
            normalizationContext: ['groups' => ['report:read']],
            denormalizationContext: ['groups' => ['report:write', 'report:read']],
            security: "is_granted('ROLE_USER')",
            securityMessage: 'Only authenticated users can create reports.',
            processor: ReportProcessor::class,
        ),
        new Delete(
            uriTemplate: '/reports/{id}',
            security: "is_granted('ROLE_ADMIN')",
            securityMessage: 'Only admins can delete reports.',
            processor: ReportDeleteProcessor::class,
        )

    ],
)]
#[ORM\Entity(repositoryClass: ReportRepository::class)]
class Report implements SoftDeletableInterface
{
    use SoftDeletableTrait;

    #[ORM\Id]
    #[ORM\GeneratedValue]
    #[ORM\Column]
    private ?int $id = null;

    #[ORM\ManyToOne(inversedBy: 'reports')]
    #[ORM\JoinColumn(nullable: false)]
    #[Groups(['report:read'])]
    private ?User $reportedBy = null;

    #[ORM\Column(type: Types::TEXT)]
    #[Groups(['report:write', 'report:read'])]
    #[Assert\NotBlank(message: 'Il faut fournir une raison pour le signalement.')]
    private ?string $reason = null;

    #[ORM\Column]
    #[Groups(['report:read'])]
    private ?\DateTimeImmutable $reportedAt = null;

    #[ORM\Column]
    #[Groups(['report:write', 'report:read'])]
    private ?int $reportableId = null;

    #[ORM\Column(length: 255)]
    #[Groups(['report:write', 'report:read'])]
    private ?string $reportableEntity = null;

    // Virtual property for entity details (populated by provider)
    #[Groups(['report:read'])]
    public ?array $entityDetails = null;


    public function __construct()
    {
    }

    public function getId(): ?int
    {
        return $this->id;
    }

    public function getReportedBy(): ?User
    {
        return $this->reportedBy;
    }

    public function setReportedBy(?User $reportedBy): static
    {
        $this->reportedBy = $reportedBy;

        return $this;
    }

    public function getReason(): ?string
    {
        return $this->reason;
    }

    public function setReason(string $reason): static
    {
        $this->reason = $reason;

        return $this;
    }

    public function getReportedAt(): ?\DateTimeImmutable
    {
        return $this->reportedAt;
    }

    public function setReportedAt(\DateTimeImmutable $reportedAt): static
    {
        $this->reportedAt = $reportedAt;

        return $this;
    }

    public function getReportableId(): ?int
    {
        return $this->reportableId;
    }

    public function setReportableId(int $reportableId): static
    {
        $this->reportableId = $reportableId;

        return $this;
    }

    public function getReportableEntity(): ?string
    {
        return $this->reportableEntity;
    }

    public function setReportableEntity(string $reportableEntity): static
    {
        $this->reportableEntity = $reportableEntity;

        return $this;
    }

}
