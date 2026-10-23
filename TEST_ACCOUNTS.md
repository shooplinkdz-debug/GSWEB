# Base de Données Locale & Comptes de Test

Ce document détaille la procédure pour initialiser la base de données PostgreSQL locale et utiliser les comptes de test pré-configurés pour la plateforme **Web Manager / Ma Boutique Algérienne (MBA)**.

---

## 1. Démarrage des Services d'Infrastructure (PostgreSQL & Redis)

À la racine du projet, lancez les conteneurs Docker pour PostgreSQL (port `5432`) et Redis (port `6379`) :

```bash
docker compose up -d postgres redis
```

Vous pouvez vérifier le bon fonctionnement des services avec :

```bash
docker compose ps
```

---

## 2. Initialisation et Injection des Données (Migrations & Seed)

Pour exécuter automatiquement toutes les migrations SQL et injecter l'ensemble des données de test (comptes, catégories, boutiques, produits, pages CMS et 58 tarifs de livraison Wilayas) :

```bash
pnpm seed:db
```

Ou directement dans le paquet API :

```bash
pnpm --filter @web-manager/api seed
```

*Note : La fonction de seeding est idempotent (`ON CONFLICT DO NOTHING`), vous pouvez donc réexécuter cette commande à tout moment sans réinitialiser vos modifications.*

---

## 3. Liste des Comptes de Test Pré-configurés

| Rôle | Email | Mot de passe | Portail / Accès | Description & Usage |
| :--- | :--- | :--- | :--- | :--- |
| **Administrateur (`ADMIN`)** | `admin@webmanager.local` | `AdminPass123!` | Portail Admin (`http://localhost:3001`) | Accès complet aux tableaux de bord, gestion des rôles, sauvegardes, Wilayas et exports. |
| **Vendeur 1 (`VENDOR`)** | `vendor@techstore.local` | `VendorPass123!` | Espace Vendeur (`http://localhost:3002`) | Boutique **TechStore Direct** (produits High-Tech, commandes et commissions). |
| **Vendeur 2 (`VENDOR`)** | `vendor2@fashionplus.local` | `VendorPass123!` | Espace Vendeur (`http://localhost:3002`) | Boutique **Fashion Plus** (produits Mode, tests multi-vendeurs). |
| **Manager (`MANAGER`)** | `manager@webmanager.local` | `ManagerPass123!` | Portail Admin (`http://localhost:3001`) | Gestion catalogue produits, modération et suivi quotidien. |
| **Confirmateur (`CONFIRMATEUR`)** | `confirmateur@webmanager.local` | `ConfirmateurPass123!` | Portail Admin (`http://localhost:3001`) | Confirmation téléphonique des commandes clients COD. |
| **Développeur (`DEVELOPER`)** | `developer@webmanager.local` | `DevPass123!` | API / Impersonation (`http://localhost:4000`) | Profil technique, tests d'API et intégrations. |
| **Client (`CUSTOMER`)** | `customer@webmanager.local` | `CustomerPass123!` | Marketplace Astro (`http://localhost:3000`) | Passage de commande COD, panier, favoris et compte client. |

---

## 4. Connexion Directe à la Base de Données Local PostgreSQL

Pour vous connecter manuellement avec un client PostgreSQL (psql, DBeaver, TablePlus, VS Code) :

- **Hôte** : `localhost`
- **Port** : `5432`
- **Base de données** : `webmanager`
- **Utilisateur** : `postgres`
- **Mot de passe** : `postgres_secure_password`

### Commande CLI `psql` via Docker :
```bash
docker exec -it webmanager_postgres psql -U postgres -d webmanager
```
