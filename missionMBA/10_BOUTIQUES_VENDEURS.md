# Mission 10 : Boutiques & Profils Vendeurs Multi-Boutiques

## 1. Objectif de la mission
Gérer l'écosystème multi-vendeurs de la plateforme MBA : inscription vendeur, création de boutique, validation administrative, paramétrage de profil boutique et isolation des catalogues.

## 2. Fichiers et modules concernés
- `apps/api/src/routes/vendors.ts`
- `apps/api/src/vendors.test.ts`
- Tables PostgreSQL `vendors` & `users`

## 3. Tâches à réaliser
- Implémenter les fonctionnalités de création et mise à jour de profil boutique (`store_name`, `description`, `phone`, `wilaya`, `logo`).
- Développer la route d'approbation administrative des boutiques vendeurs par les `ADMIN` / `MANAGER`.
- Exposer les données publiques des boutiques (fiche boutique, catalogue dédié, évaluation).

## 4. Dépendances avec les autres missions
- Dépendances amont : Mission 04, Mission 05, Mission 06, Mission 09.
- Dépendances aval : Mission 07, Mission 08, Mission 11, Mission 12, Mission 13.

## 5. Critères d'acceptation
- Chaque vendeur dispose d'une boutique unique avec ses propres paramètres.
- Seules les boutiques approuvées par un administrateur peuvent publier des produits actifs sur le Marketplace.

## 6. Tests à exécuter
- `pnpm --filter @web-manager/api test src/vendors.test.ts`

## 7. Risques et précautions
- Isolation stricte des données : interdire à un vendeur de modifier les informations ou produits d'un autre vendeur.

## 8. Conditions permettant de déclarer la mission terminée
- Module boutiques vendeurs opérationnel et validé par les tests d'intégration.
