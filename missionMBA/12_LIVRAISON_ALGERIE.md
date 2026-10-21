# Mission 12 : Logistique & Grille Tarifaire de Livraison (58 Wilayas)

## 1. Objectif de la mission
Adapter la plateforme e-commerce aux contraintes logistiques du marché algérien : intégration des 58 Wilayas, gestion des communes, calcul dynamique des frais de livraison par boutique et option domicile / point relais.

## 2. Fichiers et modules concernés
- Table PostgreSQL `delivery_rates` (ou table de configuration wilaya/boutique)
- `apps/api/src/routes/orders.ts` & `vendors.ts`
- Composants de sélection d'adresse dans `apps/web-astro/`

## 3. Tâches à réaliser
- Intégrer la nomenclature officielle des 58 Wilayas d'Algérie avec leurs codes.
- Permettre à chaque vendeur/boutique de paramétrer ses règles et tarifs de livraison (livraison locale, wilayas limitrophes, national).
- Calculer et afficher les frais de livraison précis dans le panier client avant confirmation de commande.

## 4. Dépendances avec les autres missions
- Dépendances amont : Mission 04, Mission 10, Mission 11.
- Dépendances aval : Mission 07, Mission 08, Mission 13.

## 5. Critères d'acceptation
- Présence exhaustive des 58 Wilayas d'Algérie.
- Transparence totale des frais de livraison appliqués par vendeur dans la commande finale.

## 6. Tests à exécuter
- Validation du calcul des frais de livraison lors de la création de commande via `orders.test.ts`.

## 7. Risques et précautions
- Éviter la double facturation des frais de port lorsque plusieurs produits d'un même vendeur sont dans le panier.

## 8. Conditions permettant de déclarer la mission terminée
- Module de livraison 58 Wilayas intégré, configurable par boutique et testé.
