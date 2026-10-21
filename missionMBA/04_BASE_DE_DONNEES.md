# Mission 04 : Schéma Relationnel & Migrations PostgreSQL

## 1. Objectif de la mission
Concevoir, exécuter et valider le schéma de base de données PostgreSQL pour MBA, couvrant les utilisateurs, les boutiques vendeurs, le catalogue produits, les Wilayas/Communes algériennes, les règles de livraison, les commandes et les commissions.

## 2. Fichiers et modules concernés
- `apps/api/src/db/index.ts`
- `apps/api/src/db/migrations/`
- `packages/shared/src/` (Types relationnels et interfaces)

## 3. Tâches à réaliser
- Structurer les tables : `users`, `vendors`, `categories`, `products`, `delivery_rates` (Wilayas), `orders`, `order_items`, `cms_pages`, `activity_logs`.
- Implémenter le système de migrations automatiques SQL idempotent au démarrage de l'API.
- Fournir un jeu de données de test et de démonstration (*seeding*) adapté au marché algérien.

## 4. Dépendances avec les autres missions
- Dépendances amont : Mission 01, Mission 03.
- Dépendances aval : Mission 05, Mission 06, Mission 09, Mission 10, Mission 11, Mission 12.

## 5. Critères d'acceptation
- Executions fluides des migrations SQL au démarrage sans perte ni corruption de données.
- Intégrité référentielle stricte (clés étrangères, contraintes UNIQUE et CHECK).
- Présence des 58 Wilayas d'Algérie avec tarifs et règles de livraison associées.

## 6. Tests à exécuter
- `pnpm --filter @web-manager/api test src/postgres.test.ts`
- Inspection de l'exécution des migrations dans `apps/api/src/db/index.ts`.

## 7. Risques et précautions
- Ne jamais réinitialiser ou détruire la base de données de production.
- Sécuriser les transactions SQL pour les créations de commandes et mises à jour de stock.

## 8. Conditions permettant de déclarer la mission terminée
- Migrations PostgreSQL créées, exécutées et validées par la suite de tests.
