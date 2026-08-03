# Les commandes d'import IGDB — de la factory au cron en prod

> Objectif : pouvoir expliquer toute la chaîne sans regarder le code.
> Fil conducteur : **qui crée les commandes → qui orchestre → comment un import se déroule → comment ça tourne tout seul en prod**.

---

## Vue d'ensemble (à savoir réciter)

```
services.yaml
  └── DataImportCommandFactory ──crée──> les 5 commandes console
        │
        └── app:get-igdb-data  (orchestrateur, cron minuit UTC)
              ├── lit la date de dernière synchro (table update_history)
              ├── pour chaque type de données du registre (genres → studios → jeux → extensions) :
              │     └── app:get-<type>-from-igdb   (hérite d'AbstractDataImporterCommand)
              │           ├── récupère fetcher / processor / storage via la définition
              │           ├── compte le total auprès de l'API IGDB
              │           ├── boucle par lots de 500 (pause 250 ms entre requêtes)
              │           │     Fetcher (télécharge) → Processor (transforme) → Storage (upsert SQL)
              │           └── gestion mémoire (gc + clear() de l'EntityManager si > 800 Mo)
              └── si tout a réussi : insère une nouvelle ligne dans update_history
```

Une phrase résumé : *« Un orchestrateur planifié chaque nuit relance tous les imports IGDB en ne demandant à l'API que ce qui a changé depuis la dernière synchro, par lots de 500 pour respecter le quota, et écrit en base en upsert sur l'identifiant IGDB. »*

---

## Étape 0 — Le câblage : `services.yaml` + la factory

**Fichiers** : `config/services.yaml`, `src/Command/Factory/DataImportCommandFactory.php`

Les 5 commandes ne sont **pas** instanciées automatiquement par Symfony : dans `services.yaml`, chacune est déclarée avec `factory: [DataImportCommandFactory, 'createXxxCommand']` et le tag `console.command`.

La factory centralise l'injection de dépendances : elle reçoit une fois pour toutes le repository `UpdateHistory`, le **registre IGDB**, le service de barre de progression, le service BDD et le conteneur, puis fabrique chaque commande avec exactement ce qu'il lui faut. Avantage : `services.yaml` reste lisible, et si une dépendance change, on ne modifie qu'un seul endroit.

Le **registre** (`app.config.api.igdb.registry`) est lui aussi construit dans `services.yaml` : on crée un `DataImportRegistry("IGDB")` et on lui `register()` les 4 définitions (`IgdbGenreDefinition`, `IgdbCompanyDefinition`, `IgdbGameDefinition`, `IgdbExtensionDefinition`). **L'ordre d'enregistrement = l'ordre d'exécution** : genres et studios d'abord, car les jeux en dépendent (tables de liaison).

> 🎓 Patterns à citer : **Factory** (création centralisée), **Registry** (catalogue clé → définition).

## Étape 1 — Une « définition » = la fiche d'identité d'un import

**Fichiers** : `src/Config/Api/DataImportDefinition.php`, `src/Config/Api/IGDB/IgdbGameDefinition.php` (et les 3 autres)

Chaque définition répond à 5 questions pour un type de données :
- `getKey()` : son identifiant (`igdb_games`)
- `getName()` / `getDescription()` : pour l'affichage console
- `getDataFetcherServiceId()` : **quel service télécharge** (`IgdbGameFetcher`)
- `getDataProcessorServiceId()` : **quel service transforme** (`IgdbDataProcessor`)
- `getDataStorageServiceId()` : **quel service enregistre** (`IgdbGameStorage`)
- `getConsoleOptions()` : options CLI propres à ce type (`--offset`, `--fetchSize` pour les jeux)

C'est ça, « résoudre la définition auprès du registre » : demander au catalogue *« pour la clé `igdb_games`, donne-moi la fiche qui dit quels services utiliser »*. Pour ajouter un nouvel import (ex. plateformes), on écrit une définition + un fetcher/storage, on l'enregistre — **aucune commande existante à modifier**.

## Étape 2 — L'orchestrateur : `app:get-igdb-data`

**Fichier** : `src/Command/GetIgdbDataCommand.php`

C'est le chef d'orchestre, celui qui porte le cron (`#[AsCronTask('0 0 * * *', timezone: 'UTC')]` → tous les jours à minuit UTC). Son `execute()` :

1. **Lit la date de dernière synchro** : `UpdateHistoryRepository::getLatestUpdateDate()` fait un `MAX(updatedAt)` sur la table `update_history` (timestamp UNIX).
2. **Choisit quoi importer** : tout le registre par défaut ; `--only=igdb_games` restreint, `--skip=igdb_genres` exclut, `--force` ignore la date (réimport complet).
3. **Exécute les sous-commandes en séquence** : pour chaque définition, il retrouve le nom de commande (`igdb_games` → `app:get-games-from-igdb`), la localise via `$application->find()`, et la lance avec `--from=<date de dernière synchro>`. Si une sous-commande échoue, tout s'arrête (code FAILURE) **et la date n'est pas mise à jour** — au prochain passage on retentera depuis la même date, donc pas de trou dans les données.
4. **En fin de parcours seulement** : il crée un `new UpdateHistory()` (son constructeur fait `time()`) et le persiste. C'est la nouvelle date de référence.

> 💡 Pourquoi une table plutôt qu'un fichier ? Transactionnel, partagé entre les conteneurs, historisé, requêtable.

## Étape 3 — Les sous-commandes : toutes des coquilles vides

**Fichiers** : `src/Command/GetGamesFromIgdbCommand.php` (et genres/companies/extensions), `src/Command/Base/AbstractDataImporterCommand.php`

Chaque sous-commande fait ~15 lignes utiles : elle hérite d'`AbstractDataImporterCommand` et n'implémente qu'**une seule méthode**, `getDataImportDefinition()`, qui retourne sa définition. Tout le déroulé est dans la classe abstraite.

> 🎓 Pattern : **Template Method** — la classe mère définit le squelette de l'algorithme, les filles ne fournissent que la partie variable (la définition).

Déroulé d'`execute()` dans la classe abstraite :

1. **`initializeServices()`** : lit dans la définition les IDs des 3 services et les récupère dans le conteneur → `$this->dataFetcher`, `$this->dataProcessor`, `$this->dataStorage`. La commande générique ne sait jamais *comment* on télécharge un jeu, elle délègue.
2. **Validation des options** : `--from` doit être un timestamp UNIX, `--offset` ≥ 0, `--fetchSize` entre 1 et 500.
3. **Comptage** : `$this->dataFetcher->getCount($from)` demande à IGDB le volume total à traiter → dimensionne la barre de progression et la boucle.
4. **Boucle par lots** (voir étape 4).
5. Succès ou message d'erreur propre.

## Étape 4 — La boucle par lots (le cœur)

**Fichier** : `AbstractDataImporterCommand::processSimpleBatches()` / `processAdvancedBatches()`, constantes dans `src/Config/ApiConfig.php`

Constantes clés :
- `IGDB_BATCH_SIZE = 500` → le **maximum autorisé par requête** par l'API IGDB
- `IGDB_RATE_LIMIT_DELAY_US = 250 000` µs → pause de 0,25 s entre deux requêtes (**quota IGDB : 4 requêtes/seconde**)
- `IGDB_PARALLEL_REQUESTS = 4` → en mode avancé, on regroupe 4 fetchs avant d'écrire en base

Deux modes :
- **Simple** (par défaut, celui du cron) : `for (offset = 0; offset < total; offset += 500)` → fetch, traitement, stockage, `usleep(250ms)`, et on recommence. Séquentiel, prévisible, gentil avec le quota.
- **Avancé** (si `--offset`/`--fetchSize` fournis, utile pour reprendre un import interrompu) : on accumule 4 lots avant d'écrire (moins de transactions SQL), avec statistiques de vitesse/mémoire affichées dans la barre de progression.

Pour chaque lot, `processBatchData()` enchaîne les trois rôles :
```
$processedData = $this->dataProcessor->processBatch($data);  // transforme
$this->dataStorage->store($processedData, $progressBar);      // enregistre
unset(...); gc_collect_cycles();                              // libère la mémoire
```

## Étape 5 — Le fetcher : parler à l'API IGDB

**Fichiers** : `src/Service/Api/IgdbGameFetcher.php` (+ 3 autres), `src/Service/ExternalApiService.php`

Les fetchers sont de simples adaptateurs : `getCount()` et `fetchBatch(limit, offset, from)` délèguent à `ExternalApiService`, qui contient la vraie logique HTTP :

- **Endpoint** : `POST https://api.igdb.com/v4/games` (ou `/genres`, `/companies`).
- **Authentification** : IGDB appartient à Twitch → header `Client-ID` (id d'appli Twitch) + `Authorization: Bearer <token>` (token OAuth Twitch, stocké en variable d'environnement `IGDB_ACCESS_TOKEN`).
- **Langage de requête** : IGDB utilise **Apicalypse**, un pseudo-SQL envoyé dans le corps du POST :
  ```
  fields id, name, platforms.*, summary, ...;
  where game_type = 0 & themes != (42) & updated_at >= 1722000000;
  limit 500;
  offset 1500;
  ```
  - `game_type = 0` : uniquement les jeux principaux (les DLC/extensions ont les types 1,2,4,6,7 → commande extensions)
  - `themes != (42)` : exclusion des jeux érotiques (`ApiConfig::FORBIDDEN_THEMES`)
  - `updated_at >= <from>` : **c'est ici que la synchro incrémentale opère** — on ne demande que ce qui a changé depuis la dernière synchro
- **Comptage** : requête `count;` → IGDB renvoie le total dans le header HTTP `x-count`.

## Étape 6 — Le storage : upsert + relations N:M

**Fichiers** : `src/Service/Storage/IgdbGenreStorage.php` (cas simple), `src/Service/Storage/IgdbGameStorage.php` (cas complet), `src/Service/IgdbDataProcessorService.php`, `src/Service/DatabaseOperationService.php`

⚠️ Point important : l'écriture ne passe **pas par Doctrine ORM** mais par du **SQL direct (DBAL)**, pour la performance (des dizaines de milliers de lignes ; hydrater des entités serait beaucoup trop lourd).

**Cas simple (genres, studios)** — un upsert MySQL :
```sql
INSERT INTO genre (api_id, name) VALUES (:apiId, :name)
ON DUPLICATE KEY UPDATE name = VALUES(name)
```
`api_id` (l'ID IGDB) porte une **contrainte d'unicité** : si la ligne existe déjà on la met à jour, sinon on l'insère. Jamais de doublon, réimport sans danger (idempotent).

**Cas complet (jeux)** — dans **une transaction** par lot :
1. **Extraction des identifiants** du lot (IDs de jeux, de genres, de studios).
2. **Bulk fetch** : une seule requête `WHERE api_id IN (...)` par table pour construire des maps `api_id IGDB → id en base`. On évite N requêtes unitaires.
3. **Insert/update des jeux** (upsert sur `api_id`).
4. **Recalcul des relations N:M** (many-to-many : un jeu a plusieurs genres, un genre a plusieurs jeux → tables de liaison `genre_game` et `company_game`) :
   - lecture des paires existantes en base pour les jeux du lot,
   - **diff** avec ce qu'IGDB annonce : paires à ajouter / paires à supprimer,
   - exécution des seuls `DELETE` et `INSERT` nécessaires (avec dédoublonnage avant insertion).
   On ne fait jamais « tout effacer / tout réinsérer » : moins d'I/O, et la base reflète les retraits côté IGDB (ex. un genre retiré d'un jeu).
5. `commit` (ou `rollBack` si erreur → le lot entier est annulé, cohérence garantie).

## Étape 7 — La gestion mémoire

**Fichiers** : `DatabaseOperationService::manageMemoryUsage()`, `ApiConfig`

Importer ~200 000 jeux dans un process PHP unique demande de la discipline :
- `gc_collect_cycles()` + `unset()` après chaque lot,
- surveillance de `memory_get_usage()` : au-delà de `MEMORY_CLEAR_THRESHOLD_MB` (800 Mo), appel de **`$entityManager->clear()`** qui vide l'*identity map* de Doctrine (le cache d'entités qu'il garde en RAM),
- `memory_limit` monté explicitement (512 Mo–1 Go selon le storage),
- et le commentaire en haut de `GetGamesFromIgdbCommand` : lancer avec `--no-debug`, sinon le profiler Symfony garde chaque requête en mémoire et fait exploser la RAM.

## Étape 8 — La planification en prod

**Fichiers** : `GetIgdbDataCommand.php` (attribut), `config/packages/framework.yaml`, `Dockerfile`, `docker-compose-prod.yml`

- L'attribut `#[AsCronTask(expression: '0 0 * * *', timezone: 'UTC')]` enregistre la commande auprès du **Symfony Scheduler** (activé dans `framework.yaml` : `scheduler: enabled: true`). Expression cron : *minute 0, heure 0, tous les jours* = **chaque nuit à minuit UTC**.
- Pourquoi Symfony Scheduler plutôt qu'un crontab système ? La planification est **versionnée avec le code**, à côté de la commande qu'elle concerne, et ne dépend pas de la configuration du serveur.
- En prod : image Docker FrankenPHP (`Dockerfile`), déployée via `docker-compose-prod.yml` ; au démarrage le conteneur joue les migrations puis lance le serveur.

> ⚠️ **Limite actuelle à connaître (question piège possible)** : le Scheduler de Symfony n'exécute rien tout seul — il lui faut un **worker** qui tourne en continu (`php bin/console messenger:consume scheduler_default`). Or ni le `CMD` du Dockerfile ni `docker-compose-prod.yml` ne lancent ce worker : à ce jour, le cron est **déclaré mais pas consommé** en prod. L'import se lance donc manuellement (`docker compose exec backend php bin/console app:get-igdb-data --no-debug`). Le correctif serait d'ajouter un service « worker » dans le compose de prod qui exécute `messenger:consume scheduler_default`.

---

## Pourquoi cette architecture ? (questions de jury)

| Question | Réponse courte |
|---|---|
| Pourquoi une factory ? | Centraliser l'injection de dépendances des commandes ; `services.yaml` reste propre, un seul endroit à modifier. |
| Pourquoi un registre + définitions ? | Ouvert/fermé : ajouter un type de données = ajouter une définition, sans toucher aux commandes existantes. L'ordre d'enregistrement pilote l'ordre d'import (dépendances). |
| Pourquoi fetcher / processor / storage séparés ? | Chaque rôle est testable isolément et interchangeable (interfaces `DataFetcherInterface`, etc.). La commande générique fonctionne pour n'importe quelle source. |
| Pourquoi des lots de 500 ? | C'est la limite `limit` maximale de l'API IGDB. |
| Pourquoi une pause de 250 ms ? | Quota IGDB de 4 requêtes/seconde. |
| Pourquoi l'upsert sur `api_id` ? | Idempotence : relancer un import ne crée jamais de doublon ; l'ID IGDB est la clé de correspondance stable entre l'API et notre base. |
| Pourquoi SQL direct et pas Doctrine ORM ? | Volumétrie : hydrater des dizaines de milliers d'entités saturerait la RAM et serait lent. L'ORM sert au runtime de l'appli, pas à l'import de masse. |
| Que se passe-t-il si l'import plante à mi-chemin ? | Le lot en cours est rollback ; la date de synchro n'est pas mise à jour ; le prochain run reprend depuis l'ancienne date → aucune donnée perdue. |
| Pourquoi `--from` / synchro incrémentale ? | Ne redemander que ce qui a changé (`updated_at >= from`) : l'import nocturne prend quelques minutes au lieu d'heures. |
