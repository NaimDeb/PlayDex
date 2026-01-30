<?php

declare(strict_types=1);

namespace App\Interfaces\Repository;

/**
 * Base interface for all repositories.
 * Provides common CRUD operations.
 *
 * @template T of object
 */
interface RepositoryInterface
{
    /**
     * Find an entity by its identifier.
     *
     * @return T|null
     */
    public function find(int $id): ?object;

    /**
     * Find all entities.
     *
     * @return T[]
     */
    public function findAll(): array;

    /**
     * Find entities by criteria.
     *
     * @param array<string, mixed> $criteria
     * @param array<string, string>|null $orderBy
     * @return T[]
     */
    public function findBy(array $criteria, ?array $orderBy = null, ?int $limit = null, ?int $offset = null): array;

    /**
     * Find a single entity by criteria.
     *
     * @param array<string, mixed> $criteria
     * @return T|null
     */
    public function findOneBy(array $criteria): ?object;

    /**
     * Save an entity to the database.
     *
     * @param T $entity
     */
    public function save(object $entity, bool $flush = true): void;

    /**
     * Remove an entity from the database.
     *
     * @param T $entity
     */
    public function remove(object $entity, bool $flush = true): void;
}
