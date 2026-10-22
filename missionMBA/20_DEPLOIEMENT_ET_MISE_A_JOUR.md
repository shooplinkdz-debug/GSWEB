# Mission 20 : Procédures de Déploiement & Maintenance Conteneurisée

## 1. Objectif de la mission
Définir et vérifier la stratégie de déploiement en production conteneurisé avec Docker Compose, le suivi des logs d'activité et la procédure de restauration en cas d'incident.

## 2. Fichiers et modules concernés
- `docker-compose.yml`
- Dockerfiles multi-stage des applications (`apps/*/Dockerfile`)
- Fichiers `.dockerignore` (`.dockerignore`, `apps/*/.dockerignore`)
- Endpoints de sauvegarde et restauration (`/api/admin/backup`, `/api/admin/restore`)
- Endpoints d'audit et métriques (`/api/admin/logs`, `/api/health`)

## 3. Tâches réalisées
- **Optimisation Docker multi-stage & Sécurité** :
  - Images Docker multi-stage Node.js 20 Alpine (`builder` et `runner`).
  - Exécution en utilisateur non-privilégié (`USER node`) dans la phase finale pour éliminer les risques d'élévation de privilèges.
  - Ajout des fichiers `.dockerignore` réduisant le contexte de build et excluant `node_modules`, `dist`, `.nuxt`, `.astro`, et fichiers temporaires.
- **Orchestration Docker Compose & Healthchecks** :
  - Centralisation des 6 services (`postgres`, `redis`, `api`, `web-astro`, `admin-nuxt`, `web-multivendor`) dans `docker-compose.yml`.
  - Intégration de verifications de santé (*healthcheck*) pour chaque conteneur assurant un démarrage ordonné avec `condition: service_healthy`.
- **Procédure de Mise à Jour Sans Interruption (*Zero-Downtime*)** :
  - Utilisation de la commande `docker compose up -d --build --no-deps <service>` pour recharger une image sans couper les autres services.
  - Exécution idempotente et rétrocompatible des migrations SQL au lancement de l'API (`apps/api/src/db/index.ts`).
- **Sauvegarde et Restauration Validées** :
  - Restauration et sauvegarde via l'API REST (`POST /api/admin/backup` et `POST /api/admin/restore` réservés aux rôles `ADMIN`).
  - Procédure manuelle via `pg_dump` et `psql` dans le conteneur `webmanager_postgres`.

## 4. Guide des Procédures Opérationnelles

### A. Déploiement Initial & Redémarrage
```bash
# Compilation des images et lancement en arrière-plan
docker compose up -d --build

# Vérification du statut de santé des conteneurs
docker compose ps
```

### B. Mise à Jour Sans Interruption (Zero-Downtime)
1. **Création d'une sauvegarde préventive** :
   ```bash
   docker exec -t webmanager_postgres pg_dump -U postgres webmanager > backup_pre_update.sql
   ```
2. **Reconstruction et remplacement à chaud du service API** :
   ```bash
   docker compose up -d --build --no-deps api
   ```
3. **Reconstruction des frontends (Astro, Nuxt, Multivendor)** :
   ```bash
   docker compose up -d --build --no-deps web-astro admin-nuxt web-multivendor
   ```

### C. Sauvegarde & Restauration de la Base de Données
- **Via l'API Admin (Format JSON)** :
  - Backup : `POST /api/admin/backup` (Entête `Authorization: Bearer <ADMIN_JWT>`).
  - Restore : `POST /api/admin/restore` avec le corps de la sauvegarde JSON.
- **Via la ligne de commande Docker Compose (Format SQL dump)** :
  - Backup : `docker exec -t webmanager_postgres pg_dump -U postgres webmanager > backup.sql`
  - Restore : `cat backup.sql | docker exec -i webmanager_postgres psql -U postgres -d webmanager`

## 5. Critères d'acceptation
- Déploiement reproductible via `docker compose up -d --build`.
- Tests d'intégration de déploiement et de conteneurisation validés.

## 6. Tests d'assurance qualité
- `pnpm --filter @web-manager/api test src/docker.test.ts`
- `pnpm --filter @web-manager/api test src/quality_deployment.test.ts`

## 7. Conditions permettant de déclarer la mission terminée
- Conteneurisation multi-stage optimisée et sécurisée (`USER node`).
- Stratégie de déploiement, migrations et sauvegardes documentées et éprouvées par les tests Jest.
