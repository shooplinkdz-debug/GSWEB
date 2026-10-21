# Mission 03 : Stabilisation de l'Environnement et des Dépendances

## 1. Objectif de la mission
Assurer la stabilité, la sécurité et la cohérence de l'environnement de développement, de build et d'exécution conteneurisé (Docker, Node.js, pnpm, PostgreSQL 16, Redis 7).

## 2. Fichiers et modules concernés
- `package.json`, `pnpm-workspace.yaml`, `pnpm-lock.yaml`
- `docker-compose.yml`
- `.env.example`, `.env`
- Configuration TypeScript (`tsconfig.json`) dans tous les workspaces

## 3. Tâches à réaliser
- Vérifier la version des paquets et traiter les avertissements de sécurité ou d'obsolescence.
- Assurer le bon fonctionnement des commandes `pnpm dev`, `pnpm build`, `pnpm test`, `pnpm lint`.
- Valider la conteneurisation Docker Compose pour l'API, PostgreSQL 16 et Redis 7.

## 4. Dépendances avec les autres missions
- Dépendances amont : Mission 00, Mission 01.
- Dépendances aval : Mission 04, Mission 06.

## 5. Critères d'acceptation
- Installation propre via `pnpm install` sans erreurs de résolutions de dépendances.
- Build complet du monorepo en une seule commande (`pnpm build`).
- `docker-compose.yml` fonctionnel pour le démarrage des services PostgreSQL et Redis.

## 6. Tests à exécuter
- `pnpm install`
- `pnpm build`
- `pnpm --filter @web-manager/api test src/docker.test.ts`

## 7. Risques et précautions
- Conflits de port lors du lancement local de PostgreSQL (5432) ou Redis (6379).
- Risque de fuite de variables d'environnement confidentielles (clés API) dans le suivi Git.

## 8. Conditions permettant de déclarer la mission terminée
- Dépendances monorepo parfaitement synchronisées et compilables.
- Validation des tests conteneur/docker.
