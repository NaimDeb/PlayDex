<?php

namespace App\Entity;

use App\Repository\UpdateHistoryRepository;
use Doctrine\ORM\Mapping as ORM;

#[ORM\Entity(repositoryClass: UpdateHistoryRepository::class)]
class UpdateHistory
{
    
    #[ORM\Id]
    #[ORM\GeneratedValue]
    #[ORM\Column]
    private ?int $id = null;

    #[ORM\Column]
    private ?int $updatedAt = null;


    public function __construct()
    {
        $this->updatedAt = time();
    }

    public function getId(): ?int
    {
        return $this->id;
    }

    public function getUpdatedAt(): ?int
    {
        return $this->updatedAt;
    }

    public function setUpdatedAt(int $updatedAt): static
    {
        $this->updatedAt = $updatedAt;

        return $this;
    }


}
