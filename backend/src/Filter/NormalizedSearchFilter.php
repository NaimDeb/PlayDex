<?php

declare(strict_types=1);

namespace App\Filter;

use ApiPlatform\Doctrine\Orm\Filter\AbstractFilter;
use ApiPlatform\Doctrine\Orm\Util\QueryNameGeneratorInterface;
use ApiPlatform\Metadata\Operation;
use Doctrine\ORM\QueryBuilder;

/**
 * Recherche tolérante : découpe la valeur en mots (espaces, -, :, ; , . _) et exige
 * que chaque mot soit présent dans la propriété (LIKE, insensible à la casse).
 *
 * Exemple : "counter strike" retrouve bien "Counter-Strike 2".
 */
final class NormalizedSearchFilter extends AbstractFilter
{
    protected function filterProperty(
        string $property,
        mixed $value,
        QueryBuilder $queryBuilder,
        QueryNameGeneratorInterface $queryNameGenerator,
        string $resourceClass,
        ?Operation $operation = null,
        array $context = []
    ): void {
        if (
            !\is_string($value)
            || trim($value) === ''
            || !$this->isPropertyEnabled($property, $resourceClass)
            || !$this->isPropertyMapped($property, $resourceClass)
        ) {
            return;
        }

        $tokens = preg_split('/[\s\-:;,._]+/u', mb_strtolower(trim($value)), -1, PREG_SPLIT_NO_EMPTY) ?: [];
        if ($tokens === []) {
            return;
        }

        $alias = $queryBuilder->getRootAliases()[0];

        foreach ($tokens as $index => $token) {
            $parameterName = $queryNameGenerator->generateParameterName($property . '_' . $index);
            $queryBuilder
                ->andWhere(sprintf('LOWER(%s.%s) LIKE :%s', $alias, $property, $parameterName))
                ->setParameter($parameterName, '%' . $token . '%');
        }
    }

    public function getDescription(string $resourceClass): array
    {
        $description = [];

        foreach (array_keys($this->properties ?? []) as $property) {
            $description[(string) $property] = [
                'property' => $property,
                'type' => 'string',
                'required' => false,
                'description' => 'Recherche tolérante : chaque mot (séparé par espace, -, :, ; …) doit être présent.',
            ];
        }

        return $description;
    }
}
