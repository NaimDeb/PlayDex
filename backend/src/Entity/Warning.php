<?php

namespace App\Entity;

use App\Repository\WarningRepository;
use Doctrine\ORM\Mapping as ORM;

#[ORM\Entity(repositoryClass: WarningRepository::class)]
class Warning
{
    #[ORM\Id]
    #[ORM\GeneratedValue]
    #[ORM\Column]
    private ?int $id = null;

    #[ORM\ManyToOne(inversedBy: 'warnings')]
    #[ORM\JoinColumn(nullable: false)]
    private ?User $reportedUserId = null;

    #[ORM\Column(length: 255, nullable: true)]
    private ?string $reason = null;

    #[ORM\ManyToOne]
    private ?User $warnedBy = null;

    public function getId(): ?int
    {
        return $this->id;
    }

    public function getReportedUserId(): ?User
    {
        return $this->reportedUserId;
    }

    public function setReportedUserId(?User $reportedUserId): static
    {
        $this->reportedUserId = $reportedUserId;

        return $this;
    }

    public function getReason(): ?string
    {
        return $this->reason;
    }

    public function setReason(?string $reason): static
    {
        $this->reason = $reason;

        return $this;
    }

    public function getWarnedBy(): ?User
    {
        return $this->warnedBy;
    }

    public function setWarnedBy(?User $warnedBy): static
    {
        $this->warnedBy = $warnedBy;

        return $this;
    }
}
