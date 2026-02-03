<?php

namespace App\Traits;

use Doctrine\ORM\Mapping as ORM;
use Symfony\Component\Serializer\Attribute\Groups;

trait SoftDeletableTrait
{
    #[ORM\Column]
    #[Groups(['modification:read'])]
    private bool $isDeleted = false;

    #[Groups(['modification:read'])]
    public function isDeleted(): bool
    {
        return $this->isDeleted;
    }

    public function setIsDeleted(bool $isDeleted): static
    {
        $this->isDeleted = $isDeleted;
        return $this;
    }

    public function delete(): static
    {
        $this->isDeleted = true;
        return $this;
    }

    public function restore(): static
    {
        $this->isDeleted = false;
        return $this;
    }
}
