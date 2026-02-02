# PlayDex Backend - Roadmap de Refactorisation SOLID

> **Objectif**: Transformer ce projet en code professionnel respectant les principes SOLID et les Design Patterns, digne d'un Titre RNCP Concepteur Développeur d'Applications.

---

## Table des Matières

1. [Analyse de l'Existant](#1-analyse-de-lexistant)
2. [Violations des Principes SOLID](#2-violations-des-principes-solid)
3. [Design Patterns à Implémenter](#3-design-patterns-à-implémenter)
4. [Code à Rendre DRY](#4-code-à-rendre-dry)
5. [Préparation aux Fonctionnalités Futures](#5-préparation-aux-fonctionnalités-futures)
6. [Plan d'Action Priorisé](#6-plan-daction-priorisé)

---

## 1. Analyse de l'Existant

### Architecture Actuelle
```
src/
├── Command/           # 5 commandes IGDB (433 lignes pour GetGamesFromIgdbCommand!)
├── DataPersister/     # 15 persisters avec code dupliqué
├── Entity/            # 11 entités
├── Service/           # 6 services (IgdbDataProcessorService: 429 lignes)
├── State/Provider/    # 8 providers avec responsabilités mélangées
└── Security/          # UserChecker avec side-effects
```

### Points Positifs
- Utilisation moderne d'API Platform 4.1
- JWT Authentication bien configuré
- Soft Delete implémenté (mais à améliorer)
- Scheduler pour les tâches CRON

### Points Critiques
- **Fichiers trop longs**: `GetGamesFromIgdbCommand` (433 lignes), `IgdbDataProcessorService` (429 lignes)
- **Code dupliqué**: 15 DataPersisters avec logique similaire
- **Couplage fort**: Services directement liés à Doctrine EntityManager
- **Magic numbers/strings**: Valeurs hardcodées partout

---

## 2. Violations des Principes SOLID

### 2.1 Single Responsibility Principle (SRP) ❌

| Fichier | Problème | Solution |
|---------|----------|----------|
| `GetGamesFromIgdbCommand` | Fetch + Validate + Transform + Batch + Persist | Extraire vers services spécialisés |
| `IgdbDataProcessorService` | Extract IDs + Fetch + Calculate + Insert | Diviser en 4 services |
| `DiffMatchPatchProcessor` | Diff + Modification Patchnote + Création Modification | Séparer les responsabilités |
| `ReportPersister` | Validation + Entity lookup + Duplicate check + Persist | Utiliser des Validators dédiés |
| `UserChecker` | Auth check + Database persist | Retirer les side-effects |

**Exemple de violation dans `DiffMatchPatchProcessor`:**
```php
// Ce processor fait TROP de choses:
// 1. Récupère l'ancien patchnote
// 2. Calcule les diffs
// 3. Modifie le patchnote
// 4. Crée une Modification
// 5. Persiste tout
```

**Refactorisation proposée:**
```
DiffMatchPatchProcessor
    └── DiffCalculatorService      # Calcul des diffs
    └── PatchnoteUpdaterService    # Mise à jour du patchnote
    └── ModificationFactoryService # Création des modifications
```

---

### 2.2 Open/Closed Principle (OCP) ❌

| Fichier | Problème | Solution |
|---------|----------|----------|
| `AdminReportProvider` | Switch statement pour types d'entités | **Strategy Pattern** |
| `ExternalApiService` | 4 méthodes identiques pour compter | **Template Method Pattern** |

**Exemple de violation dans `AdminReportProvider`:**
```php
// Chaque nouvelle entité reportable nécessite de modifier ce fichier
switch ($report->getReportableEntity()) {
    case 'Patchnote':
        // ...
    case 'Modification':
        // ...
    // Ajouter Steam? Il faut modifier ici...
}
```

**Refactorisation avec Strategy Pattern:**
```php
interface ReportableEnricherInterface {
    public function supports(string $entityType): bool;
    public function enrich(Report $report): array;
}

class PatchnoteReportEnricher implements ReportableEnricherInterface { }
class ModificationReportEnricher implements ReportableEnricherInterface { }
// Nouveau: class SteamPatchnoteReportEnricher implements ReportableEnricherInterface { }
```

---

### 2.3 Liskov Substitution Principle (LSP) ❌

| Fichier           | Problème                                      | Solution                      |
|-------------------|-----------------------------------------------|-------------------------------|
| DataPersisters    | Types de retour inconsistants                 | Standardiser les interfaces   |
| State Providers   | Comportements différents selon le contexte    | Créer des interfaces claires  |

**Exemple:** Certains persisters retournent `$data`, d'autres `void`.

---

### 2.4 Interface Segregation Principle (ISP) ❌

| Fichier               | Problème                              | Solution              |
|-----------------------|---------------------------------------|-----------------------|
| `ReportableInterface` | Seulement `getId()` - trop minimal    | Enrichir ou supprimer |

**Interface actuelle (inutile):**
```php
interface ReportableInterface {
    public function getId(): ?int;
}
```

**Interface améliorée:**
```php
interface ReportableInterface {
    public function getId(): ?int;
    public function getReportableType(): string;
    public function getReportableTitle(): string;
    public function getReportableOwner(): ?User;
}
```

---

### 2.5 Dependency Inversion Principle (DIP) ❌

| Fichier           | Problème                                          | Solution                  |
|-------------------|---------------------------------------------------|---------------------------|
| Tous les services | Dépendance directe sur `EntityManagerInterface`   | Repository Pattern        |
| Commands          | Couplage à `ExternalApiService`                   | Interface d'abstraction   |

**Avant (couplage fort):**
```php
class GetGamesFromIgdbCommand {
    public function __construct(
        private ExternalApiService $externalApiService, // Concret
        private EntityManagerInterface $entityManager,   // Concret
    ) {}
}
```

**Après (abstraction):**
```php
class GetGamesFromIgdbCommand {
    public function __construct(
        private GameSourceInterface $gameSource,        // Abstraction
        private GameRepositoryInterface $gameRepository, // Abstraction
    ) {}
}
```

---

## 3. Design Patterns à Implémenter

### 3.1 Factory Pattern 🏭

**Où:** Création d'entités dans les DataPersisters

**Problème actuel:**
```php
// Dans PatchnotePersister
$data->setCreatedBy($user);
$data->setCreatedAt(new \DateTimeImmutable());
$data->setIsDeleted(false);

// Dans ModificationPersister - code similaire
$modification->setUser($user);
$modification->setCreatedAt(new \DateTimeImmutable());
```

**Solution - PatchnoteFactory:**
```php
// src/Factory/PatchnoteFactory.php
class PatchnoteFactory implements PatchnoteFactoryInterface
{
    public function create(
        User $author,
        Game $game,
        string $title,
        string $content
    ): Patchnote {
        return (new Patchnote())
            ->setCreatedBy($author)
            ->setGame($game)
            ->setTitle($title)
            ->setContent($content)
            ->setCreatedAt(new \DateTimeImmutable())
            ->setIsDeleted(false);
    }
}
```

**Fichiers à créer:**
- `src/Factory/PatchnoteFactory.php`
- `src/Factory/ModificationFactory.php`
- `src/Factory/ReportFactory.php`
- `src/Factory/WarningFactory.php`
- `src/Interfaces/Factory/*FactoryInterface.php`

---

### 3.2 Strategy Pattern 🎯

**Où:** `AdminReportProvider`, enrichissement d'entités

**Solution - ReportEnricherStrategy:**
```php
// src/Strategy/ReportEnricher/ReportEnricherInterface.php
interface ReportEnricherInterface
{
    public function supports(string $entityType): bool;
    public function enrich(Report $report, object $entity): ReportEnrichedDto;
}

// src/Strategy/ReportEnricher/PatchnoteReportEnricher.php
class PatchnoteReportEnricher implements ReportEnricherInterface
{
    public function supports(string $entityType): bool
    {
        return $entityType === 'Patchnote';
    }

    public function enrich(Report $report, object $entity): ReportEnrichedDto
    {
        /** @var Patchnote $entity */
        return new ReportEnrichedDto(
            report: $report,
            entityTitle: $entity->getTitle(),
            entityAuthor: $entity->getCreatedBy()->getUsername(),
        );
    }
}

// src/Strategy/ReportEnricher/ReportEnricherRegistry.php
class ReportEnricherRegistry
{
    /** @param iterable<ReportEnricherInterface> $enrichers */
    public function __construct(
        #[TaggedIterator('app.report_enricher')]
        private iterable $enrichers
    ) {}

    public function enrich(Report $report, object $entity): ReportEnrichedDto
    {
        foreach ($this->enrichers as $enricher) {
            if ($enricher->supports($report->getReportableEntity())) {
                return $enricher->enrich($report, $entity);
            }
        }
        throw new \RuntimeException('No enricher found');
    }
}
```

**Configuration services.yaml:**
```yaml
services:
    _instanceof:
        App\Strategy\ReportEnricher\ReportEnricherInterface:
            tags: ['app.report_enricher']
```

---

### 3.3 Repository Pattern (amélioré) 📚

**Où:** Tous les repositories

**Problème actuel:** Repositories basiques sans query builders réutilisables

**Solution - Query Scopes:**
```php
// src/Repository/PatchnoteRepository.php
class PatchnoteRepository extends ServiceEntityRepository
{
    // === QUERY SCOPES ===

    public function scopeNotDeleted(QueryBuilder $qb): QueryBuilder
    {
        return $qb->andWhere('p.isDeleted = :deleted')
                  ->setParameter('deleted', false);
    }

    public function scopeByGame(QueryBuilder $qb, Game $game): QueryBuilder
    {
        return $qb->andWhere('p.game = :game')
                  ->setParameter('game', $game);
    }

    public function scopeRecent(QueryBuilder $qb, \DateTimeInterface $since): QueryBuilder
    {
        return $qb->andWhere('p.createdAt > :since')
                  ->setParameter('since', $since);
    }

    // === METHODES PUBLIQUES ===

    public function findActiveByGame(Game $game): array
    {
        $qb = $this->createQueryBuilder('p');
        $this->scopeNotDeleted($qb);
        $this->scopeByGame($qb, $game);
        return $qb->getQuery()->getResult();
    }

    public function findRecentForUser(User $user, \DateTimeInterface $since): array
    {
        $qb = $this->createQueryBuilder('p')
            ->join('p.game', 'g')
            ->join('g.followedGames', 'fg')
            ->where('fg.user = :user');

        $this->scopeNotDeleted($qb);
        $this->scopeRecent($qb, $since);

        return $qb->setParameter('user', $user)
                  ->getQuery()
                  ->getResult();
    }
}
```

---

### 3.4 Template Method Pattern 📝

**Où:** `ExternalApiService` - méthodes de comptage identiques

**Problème actuel:**
```php
// 4 méthodes quasi-identiques dans ExternalApiService
public function getNumberOfIgdbGames(): int { /* ... */ }
public function getNumberOfIgdbExtensions(): int { /* ... */ }
public function getNumberOfIgdbGenres(): int { /* ... */ }
public function getNumberOfIgdbCompanies(): int { /* ... */ }
```

**Solution:**
```php
// src/Service/ExternalApi/AbstractIgdbCountFetcher.php
abstract class AbstractIgdbCountFetcher
{
    abstract protected function getEndpoint(): string;
    abstract protected function getCountField(): string;

    public function getCount(?string $from = null): int
    {
        $query = $this->buildCountQuery($from);
        $response = $this->httpClient->request('POST', $this->getEndpoint(), [
            'body' => $query,
        ]);
        return $response->toArray()[0][$this->getCountField()] ?? 0;
    }

    protected function buildCountQuery(?string $from): string
    {
        $query = "fields {$this->getCountField()};";
        if ($from) {
            $query .= " where updated_at > {$from};";
        }
        return $query;
    }
}

// src/Service/ExternalApi/IgdbGameCountFetcher.php
class IgdbGameCountFetcher extends AbstractIgdbCountFetcher
{
    protected function getEndpoint(): string
    {
        return '/games/count';
    }

    protected function getCountField(): string
    {
        return 'count';
    }
}
```

---

### 3.5 Observer/Event Pattern 📢

**Où:** Actions utilisateur (ban, warning, report)

**Problème actuel:** Side-effects dans `UserChecker`
```php
// Dans UserChecker::checkPostAuth() - MAUVAIS
$user->setLastLoginAt(new \DateTimeImmutable());
$this->entityManager->persist($user);
$this->entityManager->flush();
```

**Solution - Domain Events:**
```php
// src/Event/UserLoggedInEvent.php
class UserLoggedInEvent
{
    public function __construct(
        public readonly User $user,
        public readonly \DateTimeImmutable $loginAt
    ) {}
}

// src/EventSubscriber/UpdateLastLoginSubscriber.php
class UpdateLastLoginSubscriber implements EventSubscriberInterface
{
    public static function getSubscribedEvents(): array
    {
        return [UserLoggedInEvent::class => 'onUserLoggedIn'];
    }

    public function onUserLoggedIn(UserLoggedInEvent $event): void
    {
        $event->user->setLastLoginAt($event->loginAt);
        $this->entityManager->flush();
    }
}

// src/Event/UserBannedEvent.php
class UserBannedEvent
{
    public function __construct(
        public readonly User $user,
        public readonly string $reason,
        public readonly ?\DateTimeImmutable $until
    ) {}
}

// Subscriber pour envoyer un email, logger, etc.
```

**Events à créer:**
- `UserLoggedInEvent`
- `UserBannedEvent`
- `UserUnbannedEvent`
- `PatchnoteCreatedEvent`
- `PatchnoteModifiedEvent`
- `ReportCreatedEvent`

---

### 3.6 Adapter Pattern 🔌

**Où:** Sources de données externes (IGDB, Steam futur)

**Solution - GameSourceInterface:**
```php
// src/Interfaces/GameSource/GameSourceInterface.php
interface GameSourceInterface
{
    public function fetchGames(int $limit, int $offset): array;
    public function fetchGame(string $externalId): ?GameDto;
    public function getSourceName(): string;
}

// src/Adapter/IgdbGameSourceAdapter.php
class IgdbGameSourceAdapter implements GameSourceInterface
{
    public function __construct(
        private IgdbApiClient $client
    ) {}

    public function fetchGames(int $limit, int $offset): array
    {
        $rawData = $this->client->getGames($limit, $offset);
        return array_map(fn($item) => $this->mapToDto($item), $rawData);
    }

    public function getSourceName(): string
    {
        return 'igdb';
    }
}

// src/Adapter/SteamGameSourceAdapter.php (FUTUR)
class SteamGameSourceAdapter implements GameSourceInterface
{
    public function getSourceName(): string
    {
        return 'steam';
    }
}
```

---

### 3.7 Decorator Pattern 🎁

**Où:** Rate limiting, caching, logging

**Solution pour le Rate Limiting futur:**
```php
// src/Decorator/RateLimitedGameSource.php
class RateLimitedGameSource implements GameSourceInterface
{
    public function __construct(
        private GameSourceInterface $inner,
        private RateLimiterFactory $rateLimiterFactory,
        private string $limiterName = 'api_external'
    ) {}

    public function fetchGames(int $limit, int $offset): array
    {
        $limiter = $this->rateLimiterFactory->create($this->limiterName);

        if (false === $limiter->consume(1)->isAccepted()) {
            throw new TooManyRequestsException();
        }

        return $this->inner->fetchGames($limit, $offset);
    }
}
```

---

### 3.8 Command Pattern (CQRS Light) 📨

**Où:** Actions complexes dans les DataPersisters

**Solution:**
```php
// src/Command/CreatePatchnoteCommand.php (Domain Command, pas Symfony)
final readonly class CreatePatchnoteCommand
{
    public function __construct(
        public string $title,
        public string $content,
        public int $gameId,
        public ?string $smallDescription = null,
        public ?int $importance = null,
    ) {}
}

// src/Handler/CreatePatchnoteHandler.php
class CreatePatchnoteHandler
{
    public function __construct(
        private PatchnoteFactoryInterface $factory,
        private GameRepositoryInterface $gameRepository,
        private PatchnoteRepositoryInterface $patchnoteRepository,
        private EventDispatcherInterface $dispatcher,
    ) {}

    public function __invoke(CreatePatchnoteCommand $command, User $author): Patchnote
    {
        $game = $this->gameRepository->find($command->gameId)
            ?? throw new GameNotFoundException($command->gameId);

        $patchnote = $this->factory->create(
            author: $author,
            game: $game,
            title: $command->title,
            content: $command->content,
        );

        $this->patchnoteRepository->save($patchnote);
        $this->dispatcher->dispatch(new PatchnoteCreatedEvent($patchnote));

        return $patchnote;
    }
}
```

---

## 4. Code à Rendre DRY

### 4.1 Base DataPersister

**Créer une classe abstraite pour les 15 persisters:**

```php
// src/DataPersister/AbstractDataPersister.php
abstract class AbstractDataPersister implements ProcessorInterface
{
    public function __construct(
        protected EntityManagerInterface $entityManager,
        protected Security $security,
    ) {}

    protected function getAuthenticatedUser(): User
    {
        $user = $this->security->getUser();
        if (!$user instanceof User) {
            throw new AccessDeniedException('Authentication required');
        }
        return $user;
    }

    protected function persist(object $entity): void
    {
        $this->entityManager->persist($entity);
        $this->entityManager->flush();
    }

    protected function remove(object $entity): void
    {
        $this->entityManager->remove($entity);
        $this->entityManager->flush();
    }

    protected function softDelete(SoftDeletableInterface $entity): void
    {
        $entity->setIsDeleted(true);
        $this->entityManager->flush();
    }
}
```

### 4.2 Trait SoftDeletable

```php
// src/Traits/SoftDeletableTrait.php
trait SoftDeletableTrait
{
    #[ORM\Column(type: 'boolean', options: ['default' => false])]
    private bool $isDeleted = false;

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

// src/Interfaces/SoftDeletableInterface.php
interface SoftDeletableInterface
{
    public function isDeleted(): bool;
    public function setIsDeleted(bool $isDeleted): static;
    public function delete(): static;
    public function restore(): static;
}
```

### 4.3 Trait Timestampable

```php
// src/Traits/TimestampableTrait.php
trait TimestampableTrait
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

    #[ORM\PreUpdate]
    public function setUpdatedAtValue(): void
    {
        $this->updatedAt = new \DateTimeImmutable();
    }
}
```

### 4.4 Configuration Centralisée

**Extraire les magic numbers:**

```php
// src/Config/ApiConfig.php
final readonly class ApiConfig
{
    public const PAGINATION_DEFAULT_LIMIT = 10;
    public const PAGINATION_MAX_LIMIT = 100;

    public const IGDB_BATCH_SIZE = 500;
    public const IGDB_PARALLEL_REQUESTS = 4;
    public const IGDB_RATE_LIMIT_DELAY_MS = 50;

    public const MEMORY_LIMIT_MB = 900;
    public const MEMORY_CLEAR_THRESHOLD_MB = 800;
}
```

### 4.5 Validation Centralisée

**Extraire les regex de validation:**

```php
// src/Validator/Constraints/StrongPassword.php
#[Attribute]
class StrongPassword extends Constraint
{
    public string $message = 'Password must contain at least 8 characters,
        one uppercase, one lowercase, one digit, and one special character.';
}

// src/Validator/Constraints/StrongPasswordValidator.php
class StrongPasswordValidator extends ConstraintValidator
{
    private const PATTERN = '/^(?=.*[A-Z])(?=.*[a-z])(?=.*\d)(?=.*[\W_]).{8,100}$/';

    public function validate(mixed $value, Constraint $constraint): void
    {
        if (!preg_match(self::PATTERN, $value)) {
            $this->context->buildViolation($constraint->message)
                ->addViolation();
        }
    }
}
```

---

## 5. Préparation aux Fonctionnalités Futures

### 5.1 Steam Integration (Polling Patch Notes)

**Architecture préparée:**

```
src/
├── Adapter/
│   ├── GameSourceInterface.php      # Interface commune
│   ├── IgdbGameSourceAdapter.php    # IGDB existant
│   └── SteamGameSourceAdapter.php   # Steam NOUVEAU
├── Service/
│   └── PatchnoteAggregator/
│       ├── PatchnoteSourceInterface.php
│       ├── IgdbPatchnoteSource.php
│       └── SteamPatchnoteSource.php # Steam NOUVEAU
```

**Interface pour sources de Patchnotes:**
```php
// src/Interfaces/PatchnoteSource/PatchnoteSourceInterface.php
interface PatchnoteSourceInterface
{
    public function fetchPatchnotes(Game $game, ?\DateTimeInterface $since = null): array;
    public function supports(Game $game): bool;
    public function getSourceIdentifier(): string;
}

// src/Service/PatchnoteAggregator/SteamPatchnoteSource.php
class SteamPatchnoteSource implements PatchnoteSourceInterface
{
    public function supports(Game $game): bool
    {
        return $game->getSteamAppId() !== null;
    }

    public function getSourceIdentifier(): string
    {
        return 'steam';
    }

    public function fetchPatchnotes(Game $game, ?\DateTimeInterface $since = null): array
    {
        // Appel à l'API Steam
        // https://api.steampowered.com/ISteamNews/GetNewsForApp/v2/
    }
}
```

**Scheduler pour le polling:**
```php
// src/Scheduler/SteamPollingSchedule.php
#[AsSchedule('steam_polling')]
class SteamPollingSchedule implements ScheduleProviderInterface
{
    public function getSchedule(): Schedule
    {
        return (new Schedule())
            ->add(RecurringMessage::every('1 hour', new SteamPollMessage()));
    }
}
```

---

### 5.2 Rate Limiting

**Configuration:**
```yaml
# config/packages/rate_limiter.yaml
framework:
    rate_limiter:
        api_anonymous:
            policy: 'sliding_window'
            limit: 60
            interval: '1 minute'
        api_authenticated:
            policy: 'sliding_window'
            limit: 300
            interval: '1 minute'
        api_external:
            policy: 'token_bucket'
            limit: 4
            rate: { interval: '1 second', amount: 4 }
```

**Event Subscriber:**
```php
// src/EventSubscriber/RateLimitSubscriber.php
class RateLimitSubscriber implements EventSubscriberInterface
{
    public function __construct(
        private RateLimiterFactory $anonymousLimiter,
        private RateLimiterFactory $authenticatedLimiter,
        private Security $security,
    ) {}

    public static function getSubscribedEvents(): array
    {
        return [
            RequestEvent::class => ['onRequest', 256],
        ];
    }

    public function onRequest(RequestEvent $event): void
    {
        $request = $event->getRequest();
        $limiter = $this->security->getUser()
            ? $this->authenticatedLimiter
            : $this->anonymousLimiter;

        $limit = $limiter->create($this->getClientKey($request))->consume();

        if (!$limit->isAccepted()) {
            throw new TooManyRequestsHttpException(
                $limit->getRetryAfter()->getTimestamp() - time()
            );
        }
    }
}
```

---

### 5.3 Text Processing Endpoints

**Structure pour le code métier texte:**

```php
// src/Service/TextProcessing/TextProcessorInterface.php
interface TextProcessorInterface
{
    public function process(string $text): ProcessedTextResult;
    public function supports(string $processorType): bool;
}

// src/Service/TextProcessing/DiffProcessor.php
class DiffProcessor implements TextProcessorInterface
{
    public function process(string $text): ProcessedTextResult
    {
        // Logique de diff existante extraite
    }
}

// src/Service/TextProcessing/SummaryProcessor.php (FUTUR)
class SummaryProcessor implements TextProcessorInterface
{
    // Résumé automatique de patch notes
}

// src/Service/TextProcessing/TranslationProcessor.php (FUTUR)
class TranslationProcessor implements TextProcessorInterface
{
    // Traduction de patch notes
}
```

**Controller dédié:**
```php
// src/ApiResource/TextProcessing.php
#[ApiResource(
    operations: [
        new Post(
            uriTemplate: '/text/diff',
            processor: DiffTextProcessor::class,
        ),
        new Post(
            uriTemplate: '/text/summarize',
            processor: SummarizeTextProcessor::class,
        ),
    ]
)]
class TextProcessingInput
{
    public string $text;
    public ?string $compareWith = null;
    public ?string $processorType = 'diff';
}
```

---

### 5.4 Caching Layer

**Pour les requêtes fréquentes:**

```php
// src/Repository/CachedGameRepository.php
class CachedGameRepository implements GameRepositoryInterface
{
    public function __construct(
        private GameRepository $repository,
        private CacheInterface $cache,
    ) {}

    public function findPopular(int $limit = 10): array
    {
        return $this->cache->get(
            'games_popular_' . $limit,
            fn() => $this->repository->findPopular($limit),
            3600 // 1 heure
        );
    }
}
```

---

### 5.5 Audit Trail / Logging

**Pour tracer les actions:**

```php
// src/Entity/AuditLog.php
#[ORM\Entity]
class AuditLog
{
    #[ORM\Id]
    #[ORM\GeneratedValue]
    #[ORM\Column]
    private ?int $id = null;

    #[ORM\Column(length: 50)]
    private string $action;

    #[ORM\Column(length: 100)]
    private string $entityType;

    #[ORM\Column]
    private int $entityId;

    #[ORM\ManyToOne]
    private ?User $performedBy = null;

    #[ORM\Column(type: 'json', nullable: true)]
    private ?array $changes = null;

    #[ORM\Column]
    private \DateTimeImmutable $performedAt;
}

// src/EventSubscriber/AuditLogSubscriber.php
class AuditLogSubscriber implements EventSubscriberInterface
{
    public static function getSubscribedEvents(): array
    {
        return [
            PatchnoteCreatedEvent::class => 'logPatchnoteCreated',
            PatchnoteModifiedEvent::class => 'logPatchnoteModified',
            UserBannedEvent::class => 'logUserBanned',
        ];
    }
}
```

---

## 6. Plan d'Action Priorisé

### Phase 1: Fondations (Semaine 1-2) 🔴 Critique

| Tâche | Fichiers | Patterns |
|-------|----------|----------|
| Créer interfaces de base | `src/Interfaces/` | DIP | X
| Implémenter traits | `SoftDeletableTrait`, `TimestampableTrait` | DRY | X
| Base AbstractDataPersister | `src/DataPersister/AbstractDataPersister.php` | Template Method |
| Extraire configuration | `src/Config/ApiConfig.php` | DRY |
| Custom Password Validator | `src/Validator/Constraints/` | SRP |

### Phase 2: Services (Semaine 3-4) 🟠 Important

| Tâche | Fichiers | Patterns |
|-------|----------|----------|
| Diviser IgdbDataProcessorService | 4 services spécialisés | SRP |
| Factory Pattern | `src/Factory/` | Factory |
| Repository Query Scopes | Tous les repositories | Repository |
| Domain Events | `src/Event/` | Observer |

### Phase 3: Providers & Persisters (Semaine 5-6) 🟡 Modéré

| Tâche | Fichiers | Patterns |
|-------|----------|----------|
| Strategy pour Reports | `src/Strategy/ReportEnricher/` | Strategy |
| Refactorer DataPersisters | Tous les 15 persisters | Template Method |
| Command Handlers | `src/Handler/` | Command |

### Phase 4: Future-Proofing (Semaine 7-8) 🟢 Enhancement

| Tâche | Fichiers | Patterns |
|-------|----------|----------|
| GameSourceInterface | `src/Interfaces/GameSource/` | Adapter |
| Rate Limiting | `src/EventSubscriber/` | Decorator |
| Caching Layer | `src/Repository/Cached*` | Decorator |
| Audit Trail | `src/Entity/AuditLog.php` | Observer |

---

## Checklist de Validation SOLID

### Single Responsibility
- [ ] Aucun fichier > 200 lignes
- [ ] Aucune classe avec plus de 5 méthodes publiques
- [ ] Chaque classe a une seule raison de changer

### Open/Closed
- [ ] Pas de switch statements sur des types
- [ ] Nouvelles fonctionnalités = nouvelles classes
- [ ] Tagged services pour l'extensibilité

### Liskov Substitution
- [ ] Interfaces respectées partout
- [ ] Types de retour consistants
- [ ] Pas de instanceof dans le code métier

### Interface Segregation
- [ ] Interfaces < 5 méthodes
- [ ] Pas d'implémentation de méthodes non utilisées

### Dependency Inversion
- [ ] Injection de dépendances partout
- [ ] Pas de `new` dans le code métier
- [ ] Dépendances sur abstractions, pas concrétions

---

## Ressources

- [Symfony Best Practices](https://symfony.com/doc/current/best_practices.html)
- [API Platform Advanced](https://api-platform.com/docs/core/)
- [PHP Design Patterns](https://designpatternsphp.readthedocs.io/)
- [Doctrine Best Practices](https://www.doctrine-project.org/projects/doctrine-orm/en/2.14/reference/best-practices.html)

---

*Document généré pour le projet PlayDex - Refactorisation SOLID*
*Dernière mise à jour: Janvier 2026*
