# Mission 01 : Architecture Target & Isolation des Applications

## 1. Objectif de la mission
Définir et valider l'architecture cible du monorepo MBA (Ma Boutique Algérienne), garantissant la séparation claire des responsabilités entre le Marketplace public client, le Gestionnaire privé d'administration/vendeurs, l'API REST backend et les paquets partagés.

## 2. Fichiers et modules concernés
- `pnpm-workspace.yaml`, `package.json`
- `apps/web-astro/` (Marketplace client)
- `apps/admin-nuxt/` (Gestionnaire d'administration)
- `apps/web-multivendor/` (Portail Vendeurs)
- `apps/api/` (API Centralisée Express / TS)
- `packages/shared/` (Bibliothèque partagée)

## 3. Tâches à réaliser
- Consolider la structure des applications dans `apps/` et des librairies dans `packages/`.
- Garantir le strict découplage entre les interfaces frontend et les règles métier backend.
- S'assurer que le package `@web-manager/shared` fournit les types et interfaces nécessaires (UserRole, OrderStatus, VendorProfile, Product, Order).
- Vérifier les configurations de builds croisés et la résolution des alias de modules workspace (`workspace:*`).

## 4. Dépendances avec les autres missions
- Dépendances amont : Mission 00 (Audit de l'existant).
- Dépendances aval : Mission 02, Mission 03, Mission 04, Mission 06.

## 5. Critères d'acceptation
- Architecture monorepo cohérente et clairement documentée.
- Séparation stricte des codebases frontend et backend.
- Partage efficace des contrats de type via `@web-manager/shared`.

## 6. Tests à exécuter
- `pnpm --filter @web-manager/shared build`
- `pnpm --filter @web-manager/api test src/architecture.test.ts`
- `pnpm --filter @web-manager/api test src/monorepo.test.ts`

## 7. Risques et précautions
- Éviter d'importer du code backend (Express/PG) dans les paquets shared ou dans le frontend.
- Conserver la rétrocompatibilité des scripts de build racine.

## 8. Conditions permettant de déclarer la mission terminée
- L'ensemble des tests d'architecture et de monorepo passent avec succès.
- La structure workspace est validée et prête pour le développement des fonctionnalités.
