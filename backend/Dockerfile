# TODO: envisager un multi-stage build pour alléger l'image finale (séparer build / runtime).
FROM php:8.3-cli

RUN apt-get update && apt-get install -y \
    git \
    unzip \
    libzip-dev \
    libicu-dev \
    && docker-php-ext-install zip pdo_mysql intl

# On récupère Composer depuis son image officielle
COPY --from=composer:latest /usr/bin/composer /usr/bin/composer

WORKDIR /app

# On copie tout le code du backend dans l'image.
COPY . .

# Installation des dépendances PHP.
# --no-scripts : on n'exécute PAS les scripts post-install de Symfony (cache:clear),
#   car ils essaient de démarrer l'app pendant le build (sans base de données) → erreur.
#   Le cache sera construit au runtime, au démarrage du conteneur.
RUN composer install --no-dev --no-interaction --no-scripts --optimize-autoloader

EXPOSE 8000

# Au démarrage, dans l'ordre :
#  1. migrations  -> crée/met à jour les tables (--allow-no-migration : pas d'erreur si rien à faire)
#  2. serveur     -> lance l'application
# Pour (re)remplir la base de démo en local, lancer manuellement une fois :
#   docker compose exec backend php bin/console doctrine:fixtures:load
CMD ["sh", "-c", "php bin/console doctrine:migrations:migrate --no-interaction --allow-no-migration && php -S 0.0.0.0:8000 -t public"]
