# Mission 20 : Procédures de Déploiement & Maintenance Conteneurisée

## 1. Objectif de la mission
Définir et vérifier la stratégie de déploiement en production conteneurisé avec Docker Compose, le suivi des logs d'activité et la procédure de restauration en cas d'incident.

## 2. Fichiers et modules concernés
- `docker-compose.yml`
- Dockerfiles multi-stage des applications (`apps/*/Dockerfile`)
- Endpoints de sauvegarde et restauration (`/api/admin/backup`, `/api/admin/restore`)

## 3. Tâches à réaliser
- Optimiser les images Docker multi-stage pour réduire les tailles d'image et améliorer la sécurité.
- Documenter le processus de mise à jour sans interruption (*zero-downtime*) et l'exécution des migrations de base de données.
- Valider le processus complet de restauration de sauvegarde de base de données.

## 4. Dépendances avec les autres missions
- Dépendances amont : Mission 03, Mission 04, Mission 16, Mission 19.
- Dépendances aval : Mission 21.

## 5. Critères d'acceptation
- Déploiement reproductible via `docker compose up -d --build`.
- Tests d'intégration de déploiement validés.

## 6. Tests à exécuter
- `pnpm --filter @web-manager/api test src/docker.test.ts`
- `pnpm --filter @web-manager/api test src/quality_deployment.test.ts`

## 7. Risques et précautions
- Toujours exécuter une sauvegarde préalable avant toute mise à jour de schéma en production.

## 8. Conditions permettant de déclarer la mission terminée
- Conteneurisation et procédure de déploiement éprouvées par les tests.
