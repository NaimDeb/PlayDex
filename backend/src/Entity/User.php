<?php

namespace App\Entity;

use App\Repository\UserRepository;
use Doctrine\Common\Collections\ArrayCollection;
use Doctrine\Common\Collections\Collection;
use Doctrine\DBAL\Types\Types;
use Doctrine\ORM\Mapping as ORM;
use Symfony\Component\Security\Core\User\PasswordAuthenticatedUserInterface;
use Symfony\Component\Security\Core\User\UserInterface;
use ApiPlatform\Metadata\ApiResource;
use ApiPlatform\Metadata\Get;
use ApiPlatform\Metadata\Patch;
use ApiPlatform\Metadata\Delete;
use ApiPlatform\Metadata\Post;
use App\DataPersister\UserDataPersister;
use App\DataPersister\UserBanProcessor;
use App\DataPersister\UserDeleteProcessor;
use App\DataPersister\UserUpdateDataPersister;
use App\State\Provider\MeProvider;
use Symfony\Component\Validator\Constraints as Assert;
use Symfony\Component\Serializer\Attribute\Groups;

#[ORM\Entity(repositoryClass: UserRepository::class)]
#[ORM\UniqueConstraint(name: 'UNIQ_IDENTIFIER_EMAIL', fields: ['email'])]

#[ApiResource(
    operations: [
        new Post(
            uriTemplate: '/register',
            denormalizationContext: ['groups' => ['user:write']],
            validationContext: ['groups' => ['Default']],
            security: "is_granted('PUBLIC_ACCESS')",
            processor: UserDataPersister::class
        ),
        new Get(
            uriTemplate: '/me',
            security: "is_granted('ROLE_USER')",
            provider: MeProvider::class,
            normalizationContext: ['groups' => ['user:read']],
            securityMessage: "You must be logged in",
        ),
        new Get(
            uriTemplate: '/users/{id}',
            requirements: ['id' => '\d+'],
            normalizationContext: ['groups' => ['user:read', 'otherUser:read']],
            securityMessage: "You must be logged in",
        ),
        new Delete(
            security: "is_granted('ROLE_USER') and object == user",
            securityMessage: "You must be logged in",
            processor: UserDeleteProcessor::class,

        ),
        new Patch(

            denormalizationContext: ['groups' => ['user:update']],
            normalizationContext: ['groups' => ['user:read']],
            security: "is_granted('ROLE_USER') and object == user",
            processor: UserUpdateDataPersister::class,
            securityMessage: "Vous ne pouvez modifier que votre propre compte",
        ),
        new Post(
            uriTemplate: '/users/{id}/ban',
            requirements: ['id' => '\d+'],
            denormalizationContext: ['groups' => ['user:ban']],
            validationContext: ['groups' => ['user:ban']],
            normalizationContext: ['groups' => ['user:read']],
            security: "is_granted('ROLE_ADMIN')",
            processor: UserBanProcessor::class,
            securityMessage: "You must be an admin to ban users",
        )
    ]
)]

// Todo : add asserts to properties

class User implements UserInterface, PasswordAuthenticatedUserInterface
{
    #[ORM\Id]
    #[ORM\GeneratedValue]
    #[ORM\Column]
    #[Groups(['user:read', 'modification:read'])]
    private ?int $id = null;

    /**
     * @var string The user email, Primary key
     */
    #[ORM\Column(length: 180, nullable: false)]
    #[Groups(['user:read', 'user:write', 'user:update'])]
    private ?string $email = null;

    /**
     * @var list<string> The user roles
     */
    #[ORM\Column]
    #[Groups(['user:read'])]
    private array $roles = [];

    /**
     * @var string The hashed password
     */
    #[ORM\Column]
    #[Groups(['user:write', 'user:update'])]
    private ?string $password = null;

    #[ORM\Column(length: 255, nullable: false)]
    #[Groups(['user:read', 'user:write', 'user:update', 'modification:read'])]
    private ?string $username = null;

    #[ORM\Column]
    #[Groups(['user:read'])]
    private ?\DateTimeImmutable $createdAt = null;

    #[ORM\Column(type: Types::BIGINT)]
    #[Groups(['user:read', 'modification:read'])]
    private ?string $reputation = null;

    /**
     * @var Collection<int, Patchnote>
     */

    #[ORM\OneToMany(targetEntity: Patchnote::class, mappedBy: 'createdBy')]
    private Collection $patchnotes;

    /**
     * @var Collection<int, Modification>
     */
    #[ORM\OneToMany(targetEntity: Modification::class, mappedBy: 'user', orphanRemoval: false)]
    #[Groups(['otherUser:read'])]
    private Collection $modifications;



    /**
     * @var Collection<int, Report>
     */
    #[ORM\OneToMany(targetEntity: Report::class, mappedBy: 'reportedBy', orphanRemoval: true)]
    private Collection $reports;

    #[ORM\Column]
    private ?bool $isDeleted = null;

    /**
     * @var Collection<int, FollowedGames>
     */
    #[ORM\OneToMany(targetEntity: FollowedGames::class, mappedBy: 'user', orphanRemoval: true)]
    #[Groups(['otherUser:read'])]
    private Collection $followedGames;

    /**
     * @var Collection<int, Warning>
     */
    #[ORM\OneToMany(targetEntity: Warning::class, mappedBy: 'reportedUserId', orphanRemoval: true)]
    private Collection $warnings;
    #[ORM\Column(nullable: true)]
    #[Groups(['user:read', 'user:ban'])]
    private ?bool $isBanned = null;
    #[ORM\Column(length: 255, nullable: true)]
    #[Groups(['user:read', 'user:ban'])]
    #[Assert\NotBlank(groups: ['user:ban'], message: 'Ban reason is required')]
    #[Assert\Length(min: 5, max: 255, groups: ['user:ban'])]
    private ?string $banReason = null;

    #[ORM\Column(nullable: true)]
    #[Groups(['user:read', 'user:ban'])]
    private ?\DateTimeImmutable $bannedUntil = null;



    public function __construct()
    {
        $this->patchnotes = new ArrayCollection();
        $this->modifications = new ArrayCollection();
        $this->reports = new ArrayCollection();
        $this->isDeleted = false;
        $this->followedGames = new ArrayCollection();
        $this->warnings = new ArrayCollection();
    }

    public function getId(): ?int
    {
        return $this->id;
    }

    public function getEmail(): ?string
    {
        return $this->email;
    }

    public function setEmail(string $email): static
    {
        $this->email = $email;

        return $this;
    }

    /**
     * A visual identifier that represents this user.
     *
     * @see UserInterface
     */
    public function getUserIdentifier(): string
    {
        return (string) $this->email;
    }

    /**
     * @see UserInterface
     *
     * @return list<string>
     */
    public function getRoles(): array
    {
        $roles = $this->roles;
        // guarantee every user at least has ROLE_USER
        $roles[] = 'ROLE_USER';

        return array_unique($roles);
    }

    /**
     * @param list<string> $roles
     */
    public function setRoles(array $roles): static
    {
        $this->roles = $roles;

        return $this;
    }

    /**
     * @see PasswordAuthenticatedUserInterface
     */
    public function getPassword(): ?string
    {
        return $this->password;
    }

    public function setPassword(string $password): static
    {
        $this->password = $password;

        return $this;
    }

    /**
     * @see UserInterface
     */
    public function eraseCredentials(): void
    {
        // If you store any temporary, sensitive data on the user, clear it here
        // $this->plainPassword = null;
    }

    public function getUsername(): ?string
    {
        return $this->username;
    }

    public function setUsername(string $username): static
    {
        $this->username = $username;

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

    public function getReputation(): ?string
    {
        return $this->reputation;
    }

    public function setReputation(string $reputation): static
    {
        $this->reputation = $reputation;

        return $this;
    }

    /**
     * @return Collection<int, Patchnote>
     */
    public function getPatchnotes(): Collection
    {
        return $this->patchnotes;
    }

    public function addPatchnote(Patchnote $patchnote): static
    {
        if (!$this->patchnotes->contains($patchnote)) {
            $this->patchnotes->add($patchnote);
            $patchnote->setCreatedBy($this);
        }

        return $this;
    }

    public function removePatchnote(Patchnote $patchnote): static
    {
        if ($this->patchnotes->removeElement($patchnote)) {
            // set the owning side to null (unless already changed)
            if ($patchnote->getCreatedBy() === $this) {
                $patchnote->setCreatedBy(null);
            }
        }

        return $this;
    }

    /**
     * @return Collection<int, Modification>
     */
    public function getModifications(): Collection
    {
        return $this->modifications;
    }

    public function addModification(Modification $modification): static
    {
        if (!$this->modifications->contains($modification)) {
            $this->modifications->add($modification);
            $modification->setUser($this);
        }

        return $this;
    }

    public function removeModification(Modification $modification): static
    {
        if ($this->modifications->removeElement($modification)) {
            // set the owning side to null (unless already changed)
            if ($modification->getUser() === $this) {
                $modification->setUser(null);
            }
        }

        return $this;
    }



    /**
     * @return Collection<int, Report>
     */
    public function getReports(): Collection
    {
        return $this->reports;
    }

    public function addReport(Report $report): static
    {
        if (!$this->reports->contains($report)) {
            $this->reports->add($report);
            $report->setReportedBy($this);
        }

        return $this;
    }

    public function removeReport(Report $report): static
    {
        if ($this->reports->removeElement($report)) {
            // set the owning side to null (unless already changed)
            if ($report->getReportedBy() === $this) {
                $report->setReportedBy(null);
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

    /**
     * @return Collection<int, FollowedGames>
     */
    public function getFollowedGames(): Collection
    {
        return $this->followedGames;
    }

    public function addFollowedGame(FollowedGames $followedGame): static
    {
        if (!$this->followedGames->contains($followedGame)) {
            $this->followedGames->add($followedGame);
            $followedGame->setUser($this);
        }

        return $this;
    }

    public function removeFollowedGame(FollowedGames $followedGame): static
    {
        if ($this->followedGames->removeElement($followedGame)) {
            // set the owning side to null (unless already changed)
            if ($followedGame->getUser() === $this) {
                $followedGame->setUser(null);
            }
        }

        return $this;
    }

    /**
     * @return Collection<int, Warning>
     */
    public function getWarnings(): Collection
    {
        return $this->warnings;
    }

    public function addWarning(Warning $warning): static
    {
        if (!$this->warnings->contains($warning)) {
            $this->warnings->add($warning);
            $warning->setReportedUserId($this);
        }

        return $this;
    }

    public function removeWarning(Warning $warning): static
    {
        if ($this->warnings->removeElement($warning)) {
            // set the owning side to null (unless already changed)
            if ($warning->getReportedUserId() === $this) {
                $warning->setReportedUserId(null);
            }
        }

        return $this;
    }

    public function isBanned(): ?bool
    {
        return $this->isBanned;
    }

    public function setIsBanned(?bool $isBanned): static
    {
        $this->isBanned = $isBanned;

        return $this;
    }

    public function getBanReason(): ?string
    {
        return $this->banReason;
    }

    public function setBanReason(?string $banReason): static
    {
        $this->banReason = $banReason;

        return $this;
    }

    public function getBannedUntil(): ?\DateTimeImmutable
    {
        return $this->bannedUntil;
    }

    public function setBannedUntil(?\DateTimeImmutable $bannedUntil): static
    {
        $this->bannedUntil = $bannedUntil;

        return $this;
    }
}
