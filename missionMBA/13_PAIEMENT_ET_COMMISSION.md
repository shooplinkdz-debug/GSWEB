# Mission 13 : Modes de Paiement (Paiement à la Livraison - COD) & Commissions

## 1. Objectif de la mission
Gérer les modes de paiement adaptés au marché algérien (principalement le paiement à la livraison / Cash on Delivery - COD) et calculer automatiquement les commissions prélevées par la plateforme sur les ventes des boutiques.

## 2. Fichiers et modules concernés
- `apps/api/src/routes/orders.ts` & `admin.ts`
- Table PostgreSQL `orders` (`payment_method`, `commission_amount`, `vendor_payout`)

## 3. Tâches à réaliser
- Configurer le mode de paiement principal : Paiement à la livraison (COD) avec confirmation téléphonique/SMS.
- Calculer la commission de la plateforme MBA sur chaque vente (taux configurable par boutique ou global).
- Fournir aux administrateurs et vendeurs un tableau récapitulatif des montants encaissés et à reverser.

## 4. Dépendances avec les autres missions
- Dépendances amont : Mission 10, Mission 11.
- Dépendances aval : Mission 08.

## 5. Critères d'acceptation
- Prise en compte du paiement à la livraison lors du passage de commande.
- Calcul automatique exact de la commission plateforme et du solde net vendeur.

## 6. Tests à exécuter
- `pnpm --filter @web-manager/api test src/orders.test.ts`
- `pnpm --filter @web-manager/api test src/stats.test.ts`

## 7. Risques et précautions
- Sécuriser les transactions financières et conserver un historique immuable des taux de commission appliqués au moment de la vente.

## 8. Conditions permettant de déclarer la mission terminée
- Module de paiement COD et calcul des commissions validé et testé.
