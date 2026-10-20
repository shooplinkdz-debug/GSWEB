# Mission 05 — Docker et Docker Compose

## 1. Contexte & Description
Cette mission formalise l'infrastructure de conteneurisation et d'orchestration multi-services pour l'ensemble de la plateforme Web Manager. L'utilisation de **Docker** et **Docker Compose** garantit l'isomorphisme parfait entre les environnements de développement, de test et de production.

## 2. Architecture des Conteneurs (`docker-compose.yml`)

L'orchestration définit 5 services interconnectés sur un réseau privé virtuel :

| Service | Conteneur | Image / Build Context | Port Exposé | Rôle / Composant |
| :--- | :--- | :--- | :--- | :--- |
| **`postgres`** | `webmanager_postgres` | `postgres:16-alpine` | `5432:5432` | Base de données relationnelle principale |
| **`redis`** | `webmanager_redis` | `redis:7-alpine` | `6379:6379` | Cache en mémoire, gestion de session et Rate-Limiting |
| **`api`** | `webmanager_api` | `./apps/api` (Dockerfile) | `4000:4000` | Backend API REST Node.js / Express / TypeScript |
| **`web-astro`** | `webmanager_astro` | `./apps/web-astro` (Dockerfile) | `3000:3000` | Frontend public e-commerce & CMS Astro (SSR) |
| **`admin-nuxt`** | `webmanager_nuxt` | `./apps/admin-nuxt` (Dockerfile) | `3001:3001` | Interface d'administration Nuxt 3 / Vue 3 |

## 3. Spécifications des Dockerfiles & Multi-Stage Builds

Chaque application d'application dispose d'un `Dockerfile` optimisé utilisant la technique du **multi-stage build** sous Alpine Linux (`node:20-alpine`) afin d'alléger l'empreinte mémoire et d'accélérer le démarrage.

### 3.1 Backend API (`apps/api/Dockerfile`)
- **Stage 1 (Builder)** : Installation des dépendances et compilation TypeScript (`tsc`).
- **Stage 2 (Runner)** : Image minimale, installation des dépendances de production uniquement, exécution du serveur Express via `node dist/index.js`.

### 3.2 Frontend Public Astro (`apps/web-astro/Dockerfile`)
- **Stage 1 (Builder)** : Génération du build SSR Astro (`astro build`).
- **Stage 2 (Runner)** : Exposition sur le port `3000` et démarrage via l'entrée serveur Node.js `node ./dist/server/entry.mjs`.

### 3.3 Back-Office Admin Nuxt (`apps/admin-nuxt/Dockerfile`)
- **Stage 1 (Builder)** : Construction du serveur Nitro Nuxt 3 (`nuxt build`).
- **Stage 2 (Runner)** : Exposition du port `3001` et démarrage via `node .output/server/index.mjs`.

## 4. Stratégie de Santé (Healthchecks) & Dépendances
- **PostgreSQL Healthcheck** : Vérification de la disponibilité via `pg_isready -U postgres -d webmanager` toutes les 5 secondes.
- **Redis Healthcheck** : Ping périodique du serveur Redis via `redis-cli ping`.
- **Séquencement des services (`depends_on`)** :
  - Le service `api` attend que `postgres` et `redis` soient déclarés en état `service_healthy`.
  - Les frontends `web-astro` et `admin-nuxt` démarrant une fois le service `api` actif.

## 5. Volumétrie & Persistance des Données
- `postgres_data` : Volume persistant Docker monté sur `/var/lib/postgresql/data` pour garantir la durabilité des données PostgreSQL.
- `redis_data` : Volume persistant Docker monté sur `/data` pour conserver l'état du cache et des jetons révoqués.

## 6. Commandes d'Exploitation Docker
```bash
# Démarrage de tous les conteneurs en arrière-plan
docker compose up -d

# Validation de la syntaxe de configuration
docker compose config

# Consultation des logs en temps réel
docker compose logs -f

# Arrêt et suppression des conteneurs
docker compose down
```

## 7. Critères de Validation
- Fichier `docker-compose.yml` valide et conforme à `docker compose config`.
- Tous les conteneurs s'exécutent sur des images sécurisées Alpine légères.
- Communication inter-conteneurs opérationnelle via les noms de services internes (`postgres:5432`, `redis:6379`, `api:4000`).
