# FrankenPHP : serveur HTTP avec Caddy + PHP intégrés.
# Remplace `php -S`, qui n'est pas adapté à la production. (pas de log, compression, peu de connexion en parallèle etc.)
FROM dunglas/frankenphp:1-php8.3

# Installe les extensions nécessaires
# - zip : composer en a besoin pr composer install
#  - pdo_mysql : pilot pour requêtes sql
#  - opcache : cache les requêtes php, gain de perf
RUN install-php-extensions zip pdo_mysql intl opcache

# Node.js : la commande `app:poll-steam-patchnotes` exécute un script Node (steam-poller).
RUN apt-get update \
    && apt-get install -y --no-install-recommends curl ca-certificates gnupg \
    && curl -fsSL https://deb.nodesource.com/setup_22.x | bash - \
    && apt-get install -y --no-install-recommends nodejs \
    && apt-get clean && rm -rf /var/lib/apt/lists/*

# Récupère Composer depuis son image officielle
COPY --from=composer:latest /usr/bin/composer /usr/bin/composer

WORKDIR /app

# On copie tout le code du backend dans l'image (le .env est exclu via .dockerignore).
COPY . .

# Installation des dépendances PHP.
# --no-dev : N'installe pas les dépendances de développement.
# --no-interaction : pas de y/n dans le composer i
# --no-scripts : évite de démarrer l'app sans bdd (évite les commandes comme cache:clear direct apres install)
# --optimize-autoloader : crée une table statique de la ou se trouve les entités, gain de perf en prod
RUN composer install --no-dev --no-interaction --no-scripts --optimize-autoloader

# Dépendances Node du poller Steam (steam-user, node-fetch).
RUN cd scripts/steam-poller && npm install --omit=dev --no-audit --no-fund

# Choix port
ENV SERVER_NAME=:8000
EXPOSE 8000

# Au démarrage, dans l'ordre :
#  - Lance les migrations
#  - Lance le serveur frankenphp
# ? Pour lancer les fixtures en local
# ? docker compose exec backend php bin/console doctrine:fixtures:load
CMD ["sh", "-c", "php bin/console doctrine:migrations:migrate --no-interaction --allow-no-migration && frankenphp run --config /etc/caddy/Caddyfile"]
