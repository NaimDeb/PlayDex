# Image Node de base — variante "slim" : beaucoup moins de vulnérabilités OS et ~300 MB de moins.
# TODO: envisager un multi-stage build (étape "builder" + étape runtime légère) pour réduire encore la taille.
FROM node:22-slim

WORKDIR /app

COPY package*.json ./

RUN npm install

# on copie le reste du code.
COPY . .

# URL de l'API exposée au navigateur.
# ! les variables NEXT_PUBLIC_* sont figées au moment du BUILD (pas au runtime), il faut donc les passer via un ARG ici (valeur fournie par docker-compose).
ARG NEXT_PUBLIC_API_URL=http://localhost:8000/api
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL

RUN npm run build

EXPOSE 3000

CMD ["npm", "start"]
