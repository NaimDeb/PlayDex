<?php

namespace App\Traits;

use Doctrine\ORM\Mapping as ORM;

/**
 * TimeStampableTrait
 *
 * A trait that provides timestamp functionality to models or classes.
 * This trait automatically handles the creation and modification timestamps
 * for entities that implement it.
 * YOU NEED TO 
 *
 */
trait TimeStampableTrait
{

    public function getCreatedAt(): ?\DateTimeImmutable
    {
        return $this->createdAt;
    }

    #[ORM\PrePersist]
    public function setCreatedAtValue(): void
    {
        $this->createdAt = new \DateTimeImmutable();
    }

    public function setCreatedAt(\DateTimeImmutable $date): void
    {
        $this->createdAt = $date;
    }

    #[ORM\PreUpdate]
    public function setUpdatedAtValue(): void
    {
        $this->updatedAt = new \DateTimeImmutable();
    }
}
