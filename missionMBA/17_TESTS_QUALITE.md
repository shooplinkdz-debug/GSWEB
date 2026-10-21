# Mission 17 : Stratégie de Tests & Assurance Qualité

## 1. Objectif de la mission
Établir et maintenir une suite complète de tests unitaires, d'intégration et de non-régression couvrant l'ensemble du monorepo MBA pour garantir un code robuste et sans régression.

## 2. Fichiers et modules concernés
- Tous les fichiers `.test.ts` dans `apps/api/src/`
- Configurations Jest, Supertest et scripts de test dans `package.json`

## 3. Tâches à réaliser
- Couvrir les règles métier clés : authentification, droits RBAC, validation de produit, création de commande, déduction de stock, calcul de frais de livraison, sauvegarde de base de données.
- Assurer l'exécution sans faille de `pnpm test` sur tous les workspaces.
- Intégrer des tests de validation de la qualité et du déploiement.

## 4. Dépendances avec les autres missions
- Dépendances amont : Toutes les missions de développement (00 à 16).
- Dépendances aval : Mission 20, Mission 21.

## 5. Critères d'acceptation
- 100% des suites de tests automatisés s'exécutent avec succès (`PASS`).
- Aucune régression détectée sur les modules critiques (Auth, Orders, Products, Vendors, Backup).

## 6. Tests à exécuter
- `pnpm test` (Lancement récursif Jest dans tous les paquets du monorepo)
- `pnpm --filter @web-manager/api test src/quality_deployment.test.ts`

## 7. Risques et précautions
- Ne jamais désactiver ou commenter un test défaillant sans corriger la cause sous-jacente.

## 8. Conditions permettant de déclarer la mission terminée
- Rapport d'exécution des tests entièrement vert (16+ test suites validées).
