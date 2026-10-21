# Mission 08 : Application Privée MBA Gestionnaire (Back-Office)

## 1. Objectif de la mission
Développer l'application web privée de gestion d'administration et pour les vendeurs (MBA Gestionnaire), offrant un tableau de bord complet pour la supervision des boutiques, produits, commandes, livraisons, commissions, utilisateurs et paramètres système.

## 2. Fichiers et modules concernés
- `apps/admin-nuxt/` (Pages Nuxt 3, Composants Vue 3, Pinia / Composables)
- `apps/web-multivendor/` (Portail Vendeur Nuxt 3)
- Endpoints API d'administration (`/api/admin/*`, `/api/vendors/*`)

## 3. Tâches à réaliser
- Développer le tableau de bord administrateur (KPIs : chiffre d'affaires, volume commandes, boutiques actives).
- Concevoir les interfaces de gestion : Validation des boutiques vendeurs, Gestion des stocks produits, Changement des statuts de commandes, Modération des avis.
- Configurer les vues de paramétrage des tarifs de livraison par Wilaya.

## 4. Dépendances avec les autres missions
- Dépendances amont : Mission 05, Mission 06, Mission 09, Mission 10, Mission 11, Mission 12, Mission 13.
- Dépendances aval : Mission 15, Mission 16, Mission 18.

## 5. Critères d'acceptation
- Contrôle d'accès strict (RBAC) interdisant l'accès au tableau de bord aux utilisateurs `CUSTOMER`.
- Interface d'administration claire, réactive avec filtres, recherche et pagination.
- Mises à jour en temps réel des statuts de commande et stocks produits.

## 6. Tests à exécuter
- `pnpm --filter @web-manager/admin-nuxt build`
- `pnpm --filter @web-manager/web-multivendor build`
- `pnpm --filter @web-manager/api test src/stats.test.ts`

## 7. Risques et précautions
- Protéger impérativement toutes les actions sensibles côté serveur (ne pas se fier uniquement aux masquages UI).

## 8. Conditions permettant de déclarer la mission terminée
- Applications Nuxt 3 (Admin & Multi-vendeur) compilables sans erreur et intégrées avec l'API REST.
