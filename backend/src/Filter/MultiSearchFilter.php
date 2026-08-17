<?php

namespace App\Filter;

use ApiPlatform\Doctrine\Orm\Filter\AbstractFilter;
use ApiPlatform\Doctrine\Orm\Util\QueryNameGeneratorInterface;
use ApiPlatform\Metadata\Operation;
use Doctrine\ORM\Query\Expr\Join;
use Doctrine\ORM\QueryBuilder;

/**
 * Recherche partielle via `?q=` en OR sur plusieurs champs, relations comprises
 * (SearchFilter ne combine ses propriétés qu'en AND).
 */
final class MultiSearchFilter extends AbstractFilter
{
    public const PARAMETER = 'q';

    protected function filterProperty(string $property, mixed $value, QueryBuilder $queryBuilder, QueryNameGeneratorInterface $queryNameGenerator, string $resourceClass, ?Operation $operation = null, array $context = []): void
    {
        if (self::PARAMETER !== $property || !\is_string($value) || '' === trim($value)) {
            return;
        }

        $rootAlias = $queryBuilder->getRootAliases()[0];
        $parameterName = $queryNameGenerator->generateParameterName(self::PARAMETER);
        $orExpressions = [];

        foreach ($this->searchedProperties() as $searchedProperty) {
            $alias = $rootAlias;
            $field = $searchedProperty;

            if ($this->isPropertyNested($searchedProperty, $resourceClass)) {
                [$alias, $field] = $this->addJoinsForNestedProperty(
                    $searchedProperty,
                    $rootAlias,
                    $queryBuilder,
                    $queryNameGenerator,
                    $resourceClass,
                    Join::LEFT_JOIN
                );
            }

            $orExpressions[] = $queryBuilder->expr()->like(
                sprintf('%s.%s', $alias, $field),
                ':' . $parameterName
            );
        }

        if ([] === $orExpressions) {
            return;
        }

        $queryBuilder
            ->andWhere($queryBuilder->expr()->orX(...$orExpressions))
            ->setParameter($parameterName, '%' . trim($value) . '%');
    }

    public function getDescription(string $resourceClass): array
    {
        return [
            self::PARAMETER => [
                'property' => implode(', ', $this->searchedProperties()),
                'type' => 'string',
                'required' => false,
                'description' => 'Recherche partielle (OR) sur : ' . implode(', ', $this->searchedProperties()),
            ],
        ];
    }

    /**
     * @return list<string> les propriétés, que l'attribut les fournisse en liste ou en map
     */
    private function searchedProperties(): array
    {
        $properties = [];
        foreach ($this->properties ?? [] as $key => $value) {
            $properties[] = \is_string($key) ? $key : $value;
        }

        return $properties;
    }
}
