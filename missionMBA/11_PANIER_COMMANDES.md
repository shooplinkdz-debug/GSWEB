# Mission 11 : Panier Persistent & Gestion des Commandes Multi-Boutiques

## 1. Objectif de la mission
Gérer l'expérience d'achat client de bout en bout : persistance du panier, création de commandes multi-boutiques, découpage par vendeur, suivi des statuts de commande et historique d'achats.

## 2. Fichiers et modules concernés
- `apps/api/src/routes/orders.ts`
- `apps/api/src/orders.test.ts`
- Tables PostgreSQL `orders` & `order_items`

## 3. Tâches à réaliser
- Développer la création de commande avec validation des articles, calcul des sous-totaux et déduction atomique du stock.
- Permettre la dissociation/regroupement des commandes contenant des articles de vendeurs distincts.
- Permettre la mise à jour progressive des statuts (`PENDING`, `CONFIRMED`, `SHIPPED`, `DELIVERED`, `CANCELLED`).

## 4. Dépendances avec les autres missions
- Dépendances amont : Mission 05, Mission 06, Mission 09, Mission 10.
- Dépendances aval : Mission 07, Mission 08, Mission 12, Mission 13.

## 5. Critères d'acceptation
- Calcul exact du montant total de la commande (Prix produits + Frais de livraison calculés).
- Traitement transactionnel SQL évitant les incohérences de stock ou de paiement.

## 6. Tests à exécuter
- `pnpm --filter @web-manager/api test src/orders.test.ts`

## 7. Risques et précautions
- Risque de création de commande sans réservation de stock ou avec des prix altérés côté client.

## 8. Conditions permettant de déclarer la mission terminée
- Module panier et commandes 100% opérationnel et validé par la suite de tests Jest.
