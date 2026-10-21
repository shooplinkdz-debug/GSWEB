# Mission 00 : Audit de l'Existant et État des Lieux

## 1. Objectif de la mission
Effectuer une analyse exhaustive du dépôt de code existant afin d'identifier les applications, la structure, les technologies, les routes API, les dépendances, la base de données, l'état des tests, les vulnérabilités potentielles et les anomalies de configuration pour le projet MBA (Ma Boutique Algérienne).

## 2. Fichiers et modules concernés
- `package.json`, `pnpm-workspace.yaml`, `pnpm-lock.yaml`
- `apps/api/` (API Centralisée Express / TypeScript)
- `apps/web-astro/` (Marketplace Public Client Astro)
- `apps/admin-nuxt/` (Gestionnaire d'Administration Nuxt 3)
- `apps/web-multivendor/` (Portail Multi-Vendeurs Nuxt 3)
- `packages/shared/` (Types et modèles de données partagés)
- `docker-compose.yml`, `.env.example`, `CAHIER-DES-CHARGES.md`

## 3. Rapport Synthétique d'Audit

### 3.1 Structure du dépôt & Monorepo
- **Type de monorepo** : Organisé avec `pnpm` workspace (`pnpm-workspace.yaml`).
- **Workspaces identifiés** :
  1. `apps/api` : Serveur API REST backend en Node.js, Express, TypeScript.
  2. `apps/web-astro` : Marketplace public client e-commerce développé avec Astro et Tailwind CSS.
  3. `apps/admin-nuxt` : Portail d'administration back-office privé développé avec Nuxt 3 / Vue 3.
  4. `apps/web-multivendor` : Portail de gestion multi-vendeurs développé avec Nuxt 3 / Vue 3.
  5. `packages/shared` : Paquet partagé contenant les types TypeScript (`UserRole`, `OrderStatus`, interfaces `User`, `Vendor`, `Product`, `Order`).

### 3.2 Technologies & Dépendances
- **Backend API** : Node.js (>= 18), Express 4, TypeScript 5, Zod (validation), JWT (`jsonwebtoken`), `bcryptjs` (hachage de mot de passe).
- **Persistance & Caching** : PostgreSQL 16 (`pg`, `pg-pool`) avec migrations SQL et seeding automatique, Redis 7 (`ioredis`) avec limiteur de débit (*rate-limiting*) et fallback en mémoire.
- **Frontend** : Astro (rendu SSR/hybride) avec adaptateur Node, Nuxt 3 (avec Nitro, Vite 7 et Tailwind CSS).
- **Tests** : Jest 29, `ts-jest`, `supertest`.
- **Conteneurisation** : Orchestration Docker Compose (`docker-compose.yml`) pour PostgreSQL 16, Redis 7 et les conteneurs applicatifs.

### 3.3 État des Tests et Corrections Apportées
- **Constat Initial** : Lors du premier lancement de `pnpm test`, la suite `src/monorepo.test.ts` échouait car le package `@web-manager/shared` n'était pas compilé (`dist/` absent).
- **Action Corrective** : Ajout du script `"pretest": "pnpm --filter @web-manager/shared build"` dans `apps/api/package.json`.
- **Résultat après correction** :
  - **Suites de tests** : 16/16 passées avec succès (`PASS`).
  - **Nombre de tests** : 90/90 tests unitaires et d'intégration validés à 100%.
  - **Build Monorepo** : `pnpm build` compile avec succès l'intégralité des 5 projets workspace.

### 3.4 Sécurité, Rôles & Données
- **RBAC** : Système de rôle fondé sur `ADMIN`, `MANAGER`, `CUSTOMER`, `VENDOR`.
- **Isolation des Vendeurs** : Les routes `/api/vendors` et `/api/products` intègrent des vérifications de l'appartenance `vendor_id`.
- **Sauvegarde SQL** : Endpoints d'administration `/api/admin/backup` et `/api/admin/restore` fonctionnels et sécurisés pour les comptes `ADMIN`.
- **Assistant IA** : Service `/api/admin/ai/assistant` doté d'un fallback déterministe hors-ligne en cas d'absence de clé API externe.

### 3.5 Priorités et Risques
- **Priorité 1** : Maintenir l'intégrité de la compilation partagée (`@web-manager/shared`) lors de chaque modification de contrat de types.
- **Priorité 2** : Compléter et maintenir les spécifications opérationnelles dans le dossier `missionMBA/`.
- **Risque potentiel** : Conflits de ports locaux (PostgreSQL 5432, Redis 6379, API 4000) si des processus locaux tournent déjà sur la machine hôte.

## 4. Dépendances avec les autres missions
- Dépendances amont : Aucune.
- Dépendances aval : Conditionne l'exécution des missions 01 à 21.

## 5. Critères d'acceptation
- Rapport d'audit complet consigné.
- Absence d'erreur de build ou de tests sur l'ensemble du monorepo.

## 6. Tests à exécuter
- `pnpm install` : Installation et résolution sans erreur.
- `pnpm build` : Build complet de tous les workspace packages.
- `pnpm test` : 16 suites de tests et 90 tests unitaires/intégration verts.

## 7. Risques et précautions
- Conserver le code existant et ne pas remplacer des fonctionnalités testées sans justification.

## 8. Conditions permettant de déclarer la mission terminée
- Rapport d'audit finalisé dans `missionMBA/00_AUDIT_EXISTANT.md`.
- Validation complète des builds et des tests du projet.
