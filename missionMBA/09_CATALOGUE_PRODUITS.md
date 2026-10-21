# Mission 09 : Catalogue Produits, Catégories & Stocks

## 1. Objectif de la mission
Mettre en œuvre la gestion complète du catalogue produits e-commerce multi-vendeurs : structuration des catégories, fiches produits détaillées, gestion dynamique du stock et contrôles d'inventaire.

## 2. Fichiers et modules concernés
- `apps/api/src/routes/products.ts`
- `apps/api/src/products.test.ts`
- Table PostgreSQL `products` & `categories`

## 3. Tâches à réaliser
- Implémenter les routes CRUD : Création, Consultation (avec filtres/pagination), Mise à jour (avec ajustement de stock) et Suppression de produit.
- Mettre en place la prévention des surventes de stock via verrous pessimistes ou transactionnels.
- Gérer l'association Produit <-> Boutique Vendeur (`vendor_id`).

## 4. Dépendances avec les autres missions
- Dépendances amont : Mission 04, Mission 05, Mission 06.
- Dépendances aval : Mission 07, Mission 08, Mission 10, Mission 11.

## 5. Critères d'acceptation
- Impossibilité de commander un produit hors-stock (`stock <= 0`).
- Filtrage rapide par catégorie, tranche de prix, boutique et disponibilité.
- Mise à jour atomique des niveaux de stock lors des commandes.

## 6. Tests à exécuter
- `pnpm --filter @web-manager/api test src/products.test.ts`

## 7. Risques et précautions
- Éviter la modification involontaire du produit d'un autre vendeur (vérification obligatoire de l'appartenance `vendor_id`).

## 8. Conditions permettant de déclarer la mission terminée
- Module produit entièrement fonctionnel et validé par les tests automatisés.
