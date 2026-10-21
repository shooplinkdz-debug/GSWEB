# Mission 02 : Plan Stratégique de Développement

## 1. Objectif de la mission
Établir une feuille de route stratégique, structurée et ordonnancée pour l'ensemble du cycle de développement du système e-commerce multi-vendeurs **MBA (Ma Boutique Algérienne)**. Cette planification garantit une livraison itérative, sécurisée et modulaire des 22 missions (00 à 21), en adressant les spécificités du marché algérien (58 Wilayas, paiement à la livraison COD, cloisonnement multi-boutiques).

---

## 2. Ordonnancement Stratégique & Jalons Critiques (Milestones)

Le développement est articulé autour de 7 Jalons Critiques garantissant la montée en charge progressive du système :

### Jalon 1 : Audit, Architecture & Environnement Technique
- **Missions rattachées** : `00_AUDIT_EXISTANT`, `01_ARCHITECTURE_PROJET`, `02_PLAN_DEVELOPPEMENT`, `03_ENVIRONNEMENT_DEPENDANCES`
- **Objectif** : Stabiliser le monorepo, formaliser l'architecture cible (`apps/*`, `packages/*`), définir les standards de code et configurer les scripts de build.
- **Livrables principaux** : Rapport d'audit, schéma d'architecture, feuille de route, configuration de workspace `pnpm` et dépendances.

### Jalon 2 : Socle Backend, Base de Données & Authentification RBAC
- **Missions rattachées** : `04_BASE_DE_DONNEES`, `05_AUTHENTIFICATION_AUTORISATIONS`, `06_API_BACKEND`
- **Objectif** : Déployer la base de données PostgreSQL 16 avec migrations et seeding, implémenter l'authentification JWT/bcrypt, le contrôle d'accès basé sur les rôles (`ADMIN`, `MANAGER`, `CUSTOMER`, `VENDOR`) et le serveur API Express/TypeScript.
- **Livrables principaux** : Schéma SQL relationnel, middleware RBAC, endpoints d'authentification et d'administration.

### Jalon 3 : Cœur E-Commerce Multi-Vendeurs & Catalogue Produits
- **Missions rattachées** : `09_CATALOGUE_PRODUITS`, `10_BOUTIQUES_VENDEURS`, `11_PANIER_COMMANDES`
- **Objectif** : Modéliser le catalogue produits (catégories, variantes, stocks), autoriser les vendeurs à créer et gérer leurs boutiques indépendantes, et activer le moteur de gestion des paniers et commandes multi-boutiques.
- **Livrables principaux** : Routes API `/api/products`, `/api/vendors`, `/api/orders`, logique de répartition des commandes multi-vendeurs.

### Jalon 4 : Spécificités Algérie & Transactions (58 Wilayas & COD)
- **Missions rattachées** : `12_LIVRAISON_ALGERIE`, `13_PAIEMENT_ET_COMMISSION`
- **Objectif** : Intégrer la matrice logistique des 58 Wilayas algériennes (calcul des frais à domicile / stop-desk, délais) et le système de paiement COD (Cash on Delivery) avec calcul automatique des commissions plateforme.
- **Livrables principaux** : Service de calcul de livraison par Wilaya, système de facturation des commissions vendeurs et suivi des états de commande COD.

### Jalon 5 : Interfaces Client & Administration (Frontends)
- **Missions rattachées** : `07_MBA_MARKETPLACE`, `08_MBA_GESTIONNAIRE`, `15_INTERFACE_DESIGN_RESPONSIVE`
- **Objectif** : Développer le portail public Astro (`web-astro`), le tableau de bord d'administration Nuxt 3 (`admin-nuxt`) et l'espace vendeur (`web-multivendor`), avec support bilingue (Français/Arabe - RTL) et design responsive.
- **Livrables principaux** : Application Astro SSR, dashboard d'administration Nuxt 3, portail vendeur Nuxt 3, thèmes UI compatibles RTL.

### Jalon 6 : Services Avancés, IA & Intégrations
- **Missions rattachées** : `14_RECHERCHE_INTELLIGENTE_IA`, `18_INTEGRATION_GOOGLE_SHEETS`
- **Objectif** : Intégrer l'assistant IA pour la recherche naturelle/recommandations et la possibilité de synchronisation optionnelle avec Google Sheets pour le suivi des stocks/commandes.
- **Livrables principaux** : Endpoint `/api/admin/ai/assistant` avec fallback déterministe hors-ligne, connecteur Google Sheets API.

### Jalon 7 : Sécurité, Performance, Tests, Documentation & Déploiement
- **Missions rattachées** : `16_SECURITE_PERFORMANCES`, `17_TESTS_QUALITE`, `19_DOCUMENTATION_INSTALLATION`, `20_DEPLOIEMENT_ET_MISE_A_JOUR`, `21_VALIDATION_FINALE`
- **Objectif** : Sécuriser les API (rate-limiting Redis, backups SQL), garantir la couverture de tests Jest/Supertest (100% verts), préparer les conteneurs Docker multi-stage et rédiger la documentation complète.
- **Livrables principaux** : Cache Redis/Fallback memory, conteneurs Docker optimisés, README.md avec guide d'installation Windows/Linux/Docker, suite de tests d'intégration complète.

---

## 3. Matrice de Dépendances et Feuille de Route des 22 Missions

| ID | Mission | Description / Portée | Dépendances Amont | Jalon |
| :--- | :--- | :--- | :--- | :--- |
| **00** | Audit de l'existant | État des lieux du monorepo, correction des tests et builds initialisés | Aucune | Jalon 1 |
| **01** | Architecture du projet | Découplage `apps/*` / `packages/*`, contrats de types TypeScript | Mission 00 | Jalon 1 |
| **02** | Plan de développement | Feuilles de route, dépendances, Jalons et matrice des risques | Missions 00, 01 | Jalon 1 |
| **03** | Environnement & Dépendances | Alignement Node 18+, pnpm workspace, variables d'environnement | Missions 00, 01 | Jalon 1 |
| **04** | Base de données PostgreSQL | Schéma SQL relationnel, scripts de migration, jeux de données (seed) | Missions 01, 03 | Jalon 2 |
| **05** | Authentification & RBAC | JWT, hachage bcrypt, middleware d'autorisation par rôle (`ADMIN`, `VENDOR`...) | Mission 04 | Jalon 2 |
| **06** | API Backend Express | Restructuring des routes REST Express, gestion centralisée des erreurs | Missions 04, 05 | Jalon 2 |
| **07** | MBA Marketplace (Client) | Application frontend Astro pour la recherche et l'achat client | Missions 05, 06 | Jalon 5 |
| **08** | MBA Gestionnaire (Admin/Vendeurs) | Interface Nuxt 3 back-office pour administrateurs et vendeurs | Missions 05, 06 | Jalon 5 |
| **09** | Catalogue Produits & Catégories | CRUD produits, catégories, recherche, stock et variantes | Missions 04, 06 | Jalon 3 |
| **10** | Boutiques Multi-Vendeurs | Création de boutique, paramétrage vendeur et isolation des données | Missions 05, 06, 09 | Jalon 3 |
| **11** | Panier & Commandes | Gestion du panier client et génération de commandes multi-vendeurs | Missions 09, 10 | Jalon 3 |
| **12** | Logistique Algérie (58 Wilayas) | Grille tarifaire de livraison 58 Wilayas (Domicile / Stop-Desk) | Missions 10, 11 | Jalon 4 |
| **13** | Paiements (COD) & Commissions | Gestion du Cash on Delivery et prélèvement automatique de commissions | Missions 10, 11 | Jalon 4 |
| **14** | Assistant IA & Recherche | Recherche sémantique, suggestions d'achat et assistant virtuel | Missions 06, 09 | Jalon 6 |
| **15** | Interface Design & RTL | Support multilingue FR/AR, mise en page responsive et support RTL | Missions 07, 08 | Jalon 5 |
| **16** | Sécurité & Redis | Rate limiting, système de cache Redis et sauvegardes SQL | Missions 04, 06 | Jalon 7 |
| **17** | Tests & Assurance Qualité | Couverture de tests unitaires/d'intégration (Jest/Supertest) | Toutes missions | Jalon 7 |
| **18** | Intégration Google Sheets | Import/Export dynamique pour gestion d'inventaire déportée | Missions 06, 11 | Jalon 6 |
| **19** | Documentation & Guide | Rédaction de README.md complet, guides Windows/PowerShell/Docker | Toutes missions | Jalon 7 |
| **20** | Déploiement & Containerisation | Dockerfile multi-stage et orchestration docker-compose.yml | Mission 19 | Jalon 7 |
| **21** | Validation Finale | Bilan complet et recette de l'ensemble de la plateforme | Toutes missions | Jalon 7 |

---

## 4. Matrice de Gestion des Risques & Stratégies d'Atténuation

| Risque Identifié | Impact | Probabilité | Stratégie d'Atténuation / Solution Technique |
| :--- | :--- | :--- | :--- |
| **Complexité de la grille tarifaire des 58 Wilayas algériennes** | Élevé | Moyenne | Centraliser la configuration des frais de livraison (A domicile vs Stop-Desk) dans une table SQL dédiée et dans le paquet `@web-manager/shared`. En cas d'indisponibilité DB, appliquer un tarif forfaitaire de secours. |
| **Fuite de données ou non-cloisonnement entre vendeurs** | Critique | Faible | Filtrer impérativement l'ensemble des requêtes vendeur par leur `vendor_id` via un middleware de contrôle d'accès strict au niveau des routes Express backend (`/api/vendors`). |
| **Indisponibilité du serveur Redis (Rate limiting / Cache)** | Moyen | Moyenne | Développer un fallback transparent en mémoire (*In-Memory fallback*) dans `apps/api/src/services/redis.ts` pour maintenir le service actif sans interruption même si Redis est indisponible. |
| **Échec ou Timeout des services d'IA externes** | Moyen | Moyenne | Fournir un mode fallback déterministe hors-ligne pour l'assistant IA (`/api/admin/ai/assistant`) afin d'assurer des réponses fonctionnelles locales sans dépendance bloquante envers les API tierces. |
| **Anomalie de compilation TypeScript sur les types partagés (`@web-manager/shared`)** | Élevé | Faible | Configurer un script `pretest` (`pnpm --filter @web-manager/shared build`) dans `apps/api/package.json` pour garantir la génération continue des artéfacts JavaScript avant toute exécution de tests. |
| **Mode de Paiement par Chèque / Virement indisponible en Algérie** | Moyen | Élevé | Privilégier le mode de paiement à la livraison (**Cash on Delivery - COD**) comme mode prioritaire nativement géré avec statut d'attente d'encaissement par le livreur. |

---

## 5. Critères d'Acceptation Explicites par Phase

1. **Jalon 1 (Architecture & Setup)** : `pnpm build` s'exécute sans erreur sur tous les workspaces. `@web-manager/shared` produit ses fichiers de distribution `dist/`.
2. **Jalon 2 (Backend & DB)** : PostgreSQL exécute la totalité des migrations SQL et du seeding. La route `/api/auth/login` émet des jetons JWT valides.
3. **Jalon 3 & 4 (E-commerce Multi-Vendeurs & Algérie)** : Création réussie de produits attribués à un `vendor_id`, calcul exact de la livraison sur les 58 Wilayas et gestion des commandes COD.
4. **Jalon 5 & 6 (Frontends & IA)** : Rendu Astro et Nuxt 3 sans erreur, assistant IA répondant correctement avec ou sans clé API.
5. **Jalon 7 (Qualité & Livrables)** : 100% des tests Jest passent avec succès (`16/16 test suites`, `90+ tests`), le déploiement `docker compose up -d` démarre l'ensemble des conteneurs en état sain (*healthy*).

---

## 6. Conditions Permettant de Déclarer la Mission 02 Terminée

- [x] Structuration et ordonnancement complet des 22 missions (00 à 21) documentés dans `missionMBA/02_PLAN_DEVELOPPEMENT.md`.
- [x] Définition des 7 Jalons Critiques (Milestones) et de leurs critères d'acceptation.
- [x] Rédaction de la Matrice de Gestion des Risques et d'Atténuation pour le contexte algérien et multi-vendeurs.
- [x] Mise à jour du fichier `missionMBA/INDEX.md` avec le statut des missions.
- [x] Validation de la complétude par la suite de tests automatisés.
