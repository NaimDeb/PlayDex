# Image PHP de base (CLI = ligne de commande, suffisant pour le serveur intégré PHP).
# TODO: passer à un vrai serveur (php:8.3-apache, FrankenPHP ou nginx+php-fpm) pour la prod.
# TODO: envisager un multi-stage build pour alléger l'image finale (séparer build / runtime).
FROM php:8.3-cli

# Dépendances système + extensions PHP.
# - zip       : utilisé par Composer
# - pdo_mysql : INDISPENSABLE pour que Doctrine se connecte à MySQL
# - intl      : requis par Symfony (a besoin de libicu-dev pour compiler)
RUN apt-get update && apt-get install -y \
    git \
    unzip \
    libzip-dev \
    libicu-dev \
    && docker-php-ext-install zip pdo_mysql intl

# On récupère Composer depuis son image officielle (pas besoin de l'installer à la main).
COPY --from=composer:latest /usr/bin/composer /usr/bin/composer

WORKDIR /app

# On copie tout le code du backend dans l'image.
COPY . .

# Installation des dépendances PHP.
# --no-scripts : on n'exécute PAS les scripts post-install de Symfony (cache:clear),
#   car ils essaient de démarrer l'app pendant le build (sans base de données) → erreur.
#   Le cache sera construit au runtime, au démarrage du conteneur.
# TODO prod: ajouter --no-dev --optimize-autoloader pour une image plus légère/rapide.
RUN composer install --no-interaction --no-scripts

EXPOSE 8000

# Au démarrage : on joue les migrations (création des tables) PUIS on lance le serveur.
# --allow-no-migration évite une erreur s'il n'y a rien de nouveau à migrer.
CMD ["sh", "-c", "php bin/console doctrine:migrations:migrate --no-interaction --allow-no-migration && php -S 0.0.0.0:8000 -t public"]
