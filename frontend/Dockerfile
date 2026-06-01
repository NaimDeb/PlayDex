# Image Node de base.
# TODO: envisager un multi-stage build (étape "builder" + étape runtime légère)
#       pour réduire la taille de l'image finale.
FROM node:22

WORKDIR /app

# On copie d'abord SEULEMENT les fichiers de dépendances.
# Astuce Docker : tant que package.json ne change pas, cette couche est mise en cache
# et "npm install" n'est pas relancé à chaque build → builds beaucoup plus rapides.
COPY package*.json ./

RUN npm install

# Ensuite on copie le reste du code.
COPY . .

# URL de l'API exposée au navigateur.
# IMPORTANT : les variables NEXT_PUBLIC_* sont figées au moment du BUILD (pas au runtime),
# il faut donc les passer via un ARG ici (valeur fournie par docker-compose).
ARG NEXT_PUBLIC_API_URL=http://localhost:8000/api
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL

RUN npm run build

EXPOSE 3000

CMD ["npm", "start"]
