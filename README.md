# Web Manager — Ma Boutique Algérienne (MBA)

Plateforme web e-commerce, place de marché multi-vendeurs et gestionnaire de contenu (CMS) modulable, sécurisée, multilingue (FR/AR - RTL) et conteneurisée.

---

## Architecture du Monorepo

Le projet est structuré sous forme de monorepo géré avec `pnpm` workspaces :

- **`apps/api`** : Serveur API REST backend en Node.js / Express / TypeScript avec authentification JWT, RBAC, intégration PostgreSQL, Redis, gestion des commandes COD (Cash on Delivery), tarifs de livraison pour les 58 Wilayas d'Algérie et Assistant IA.
- **`apps/web-astro`** : Front-end public et site e-commerce / marketplace développé avec Astro (rendu hybride SSR / statique) et Tailwind CSS.
- **`apps/admin-nuxt`** : Portail d'administration back-office développé avec Nuxt 3 / Vue 3 pour la gestion des produits, commandes, commissions vendeurs, tarifs Wilayas, contenus, statistiques, logs et sauvegardes.
- **`apps/web-multivendor`** : Espace dédié aux vendeurs pour la gestion de leur boutique, catalogue produit et suivi des commissions.
- **`packages/shared`** : Bibliothèque partagée de types TypeScript, énumérations (rôles, statuts de commande), dictionnaire d'internationalisation (FR/AR/RTL) et modèles de données métier.
- **`docker-compose.yml`** : Orchestration de l'ensemble des services (PostgreSQL 16, Redis 7, API backend, Web Astro public, Admin Nuxt, Espace Vendeurs Multivendor).

---

## Prérequis Système

Pour exécuter et déployer l'application, assurez-vous d'avoir installé :

- **Node.js** : Version `>= 18.0.0` (Recommandé : LTS v20.x)
- **pnpm** : Version `>= 8.0.0` (Installation : `npm install -g pnpm`)
- **Docker & Docker Compose** : Docker Engine `>= 20.10` / Docker Compose `>= 2.0`
- **PostgreSQL** : Version `16` (fourni via Docker Compose)
- **Redis** : Version `7` (fourni via Docker Compose)

---

## Guides d'Installation Pas à Pas

### 1. Installation sous Windows

#### Option A : PowerShell / CMD (Mode Développement Local)
1. **Ouvrir PowerShell ou l'invite de commande** dans le répertoire racine du projet.
2. **Copier le fichier de configuration d'environnement** :
   ```powershell
   copy .env.example .env
   ```
3. **Installer les dépendances du monorepo** :
   ```powershell
   pnpm install
   ```
4. **Lancer les services d'infrastructure (PostgreSQL & Redis)** via Docker :
   ```powershell
   docker compose up -d postgres redis
   ```
5. **Démarrer toutes les applications en mode développement** :
   ```powershell
   pnpm dev
   ```

#### Option B : WSL2 (Windows Subsystem for Linux — Recommandé)
1. **Lancer votre terminal WSL2** (Ubuntu/Debian).
2. **Cloner / Naviguer vers le dossier du projet** :
   ```bash
   cd /path/to/web-manager
   ```
3. **Copier le fichier de configuration** :
   ```bash
   cp .env.example .env
   ```
4. **Installer les dépendances et lancer via Docker Compose** :
   ```bash
   pnpm install
   docker compose up -d --build
   ```

---

### 2. Installation sous Linux (Ubuntu / Debian / CentOS / RHEL)

1. **Installer les dépendances de base** (Node.js, pnpm, Docker) :
   ```bash
   # Mise à jour des paquets et installation de Node.js 20
   curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
   sudo apt-get install -y nodejs docker.io docker-compose-plugin
   sudo npm install -g pnpm
   ```
2. **Cloner le dépôt et accéder au dossier** :
   ```bash
   git clone <repository_url>
   cd web-manager
   ```
3. **Configurer les variables d'environnement** :
   ```bash
   cp .env.example .env
   ```
4. **Installer les paquets pnpm** :
   ```bash
   pnpm install
   ```
5. **Lancement de l'application** :
   - **Mode conteneurisé (Production / Test d'intégration)** :
     ```bash
     docker compose up -d --build
     ```
   - **Mode développement hybride (Bases de données Docker + App Node.js)** :
     ```bash
     docker compose up -d postgres redis
     pnpm dev
     ```

---

### 3. Installation sous macOS

1. **Installer les dépendances avec Homebrew** :
   ```bash
   brew install node pnpm docker docker-compose
   ```
2. **Configurer l'environnement et installer les dépendances** :
   ```bash
   cp .env.example .env
   pnpm install
   ```
3. **Démarrer les services** :
   ```bash
   docker compose up -d postgres redis
   pnpm dev
   ```

---

### Services Disponibles après Lancement

- **Site Public Marketplace (Astro)** : `http://localhost:3000`
- **Portail Administrateur (Nuxt 3)** : `http://localhost:3001`
- **Portail Vendeurs (Multivendor Nuxt)** : `http://localhost:3002`
- **API Backend Express** : `http://localhost:4000`
- **Base de Données PostgreSQL** : `localhost:5432`
- **Cache & Session Redis** : `localhost:6379`

---

## Variable d'Environnement (`.env.example`)

Le fichier `.env` à la racine centralise l'ensemble des configurations :

| Variable | Description | Valeur par Défaut / Exemple |
| :--- | :--- | :--- |
| `PORT` | Port d'écoute de l'API backend | `4000` |
| `NODE_ENV` | Environnement d'exécution (`development`/`production`) | `development` |
| `JWT_SECRET` | Clé secrète pour la signature des jetons JWT | `super_secret_jwt_key_...` |
| `JWT_EXPIRES_IN` | Durée de validité des jetons JWT | `7d` |
| `POSTGRES_HOST` | Hôte PostgreSQL | `localhost` (ou `postgres` sous Docker) |
| `POSTGRES_PORT` | Port PostgreSQL | `5432` |
| `POSTGRES_DB` | Nom de la base de données SQL | `webmanager` |
| `POSTGRES_USER` | Utilisateur PostgreSQL | `postgres` |
| `POSTGRES_PASSWORD` | Mot de passe PostgreSQL | `postgres_secure_password` |
| `DATABASE_URL` | URL de connexion PostgreSQL complète | `postgresql://postgres:...@localhost:5432/webmanager?schema=public` |
| `REDIS_HOST` | Hôte Redis | `localhost` (ou `redis` sous Docker) |
| `REDIS_PORT` | Port Redis | `6379` |
| `REDIS_URL` | URL de connexion Redis | `redis://localhost:6379` |
| `AI_PROVIDER_API_KEY` | Clé d'API du service / assistant IA | `mock_key_for_local_ai_assistant` |
| `GOOGLE_SHEETS_ENABLED` | Activation de la synchro Google Sheets | `false` (ou `true`) |
| `GOOGLE_SERVICE_ACCOUNT_EMAIL` | Email du Service Account Google | `your-service-account@project.iam.gserviceaccount.com` |
| `GOOGLE_PRIVATE_KEY` | Clé privée RSA du Service Account Google | `"-----BEGIN PRIVATE KEY-----\n..."` |
| `GOOGLE_SPREADSHEET_ID` | Identifiant de la feuille Google Sheets | `your_google_spreadsheet_id` |
| `PUBLIC_API_URL` | URL de l'API pour le frontend Astro | `http://localhost:4000/api` |
| `NUXT_PUBLIC_API_URL` | URL de l'API pour le back-office Nuxt | `http://localhost:4000/api` |

---

## Scripts pnpm & NPM Disponibles

### Scripts Monorepo Racine
- **`pnpm dev`** : Démarrage simultané de toutes les applications en mode développement avec rechargement à chaud.
- **`pnpm build`** : Compilation de l'ensemble des paquets et applications (`@web-manager/shared`, `api`, `web-astro`, `admin-nuxt`, `web-multivendor`).
- **`pnpm test`** : Exécution de l'ensemble de la suite de tests automatisés Jest.
- **`pnpm lint`** : Analyse et contrôle de la qualité du code.
- **`pnpm prepare`** : Installation automatique du hook Git `post-merge`.

### Scripts par Module
- **`apps/api`** :
  - `pnpm --filter @web-manager/api dev` : Démarre l'API avec `tsx watch`.
  - `pnpm --filter @web-manager/api build` : Compile TypeScript en JavaScript (`dist/`).
  - `pnpm --filter @web-manager/api start` : Exécute le serveur compilé (`dist/index.js`).
  - `pnpm --filter @web-manager/api test` : Lance la suite de tests Jest de l'API backend.
- **`apps/web-astro`** :
  - `pnpm --filter @web-manager/web-astro dev` : Lance le serveur de dev Astro (`http://localhost:3000`).
  - `pnpm --filter @web-manager/web-astro build` : Génère le build de production Astro.
- **`apps/admin-nuxt`** :
  - `pnpm --filter @web-manager/admin-nuxt dev` : Lance le serveur de dev Nuxt 3 (`http://localhost:3001`).
  - `pnpm --filter @web-manager/admin-nuxt build` : Compile l'application Nuxt 3 pour la production.
- **`apps/web-multivendor`** :
  - `pnpm --filter @web-manager/web-multivendor dev` : Lance le serveur de dev Multivendor (`http://localhost:3002`).
  - `pnpm --filter @web-manager/web-multivendor build` : Compile l'application Multivendor pour la production.
- **`packages/shared`** :
  - `pnpm --filter @web-manager/shared build` : Compile les types, helpers et i18n FR/AR vers `dist/`.

---

## Migrations, Base de Données, Déploiement & Sauvegardes

### Migrations & Initialisation Automatique
Au démarrage du serveur API (`apps/api`), la connexion à PostgreSQL exécute automatiquement :
1. La création des tables relationnelles (`users`, `products`, `categories`, `orders`, `order_items`, `cms_pages`, `vendors`, `delivery_rates`, `activity_logs`).
2. L'amorçage des données (*seeding*) initiales si les tables sont vides (utilisateurs par défaut, catégories, tarifs de livraison pour les 58 Wilayas d'Algérie).

### Procédure de Déploiement Conteneurisé & Zero-Downtime
1. **Lancement global** :
   ```bash
   docker compose up -d --build
   ```
2. **Mise à jour sans interruption (*zero-downtime*)** :
   Redéployez un service individuel sans perturber le reste de la plateforme :
   ```bash
   docker compose up -d --build --no-deps api
   ```
3. **Sécurité des conteneurs** :
   Tous les conteneurs s'exécutent avec des images multi-stage légères et sans privilèges root (`USER node`).

### Endpoints de Sauvegarde & Restauration API
- **`POST /api/admin/backup`** : Exporte l'intégralité de la base de données sous forme de données structurées (Rôle `ADMIN` requis).
- **`POST /api/admin/restore`** : Restaure la base de données relationnelle à partir des données de sauvegarde fournies dans la requête (Rôle `ADMIN` requis).

### Sauvegarde & Restauration manuelle via Docker
- **Sauvegarde SQL manuelle** :
  ```bash
  docker exec -t webmanager_postgres pg_dump -U postgres webmanager > backup_$(date +%Y%m%d).sql
  ```
- **Restauration SQL manuelle** :
  ```bash
  cat backup_20260101.sql | docker exec -i webmanager_postgres psql -U postgres -d webmanager
  ```

---

## Intégration Google Sheets & Service Account

L'application prend en charge l'exportation et la synchronisation automatique des commandes avec **Google Sheets** :

### Configuration du Service Account Google
1. Rendez-vous sur la [Google Cloud Console](https://console.cloud.google.com/) et créez un projet.
2. Activez l'API **Google Sheets API**.
3. Allez dans *Credentials -> Create Credentials -> Service Account* et générez une clé privée JSON.
4. Dans votre feuille de calcul Google Sheets, partagez le document avec l'adresse email du Service Account avec les droits d'Éditeur.
5. Renseignez dans votre fichier `.env` :
   ```env
   GOOGLE_SHEETS_ENABLED=true
   GOOGLE_SERVICE_ACCOUNT_EMAIL=votre-service-account@projet.iam.gserviceaccount.com
   GOOGLE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n..."
   GOOGLE_SPREADSHEET_ID=identifiant_de_votre_feuille
   ```

### Mode Dégradé
Si `GOOGLE_SHEETS_ENABLED=false` ou si les identifiants ne sont pas configurés, l'application bascule automatiquement en **mode dégradé sans interruption de service**. L'exportation reste pleinement fonctionnelle aux formats CSV et JSON.

---

## Accès Mobile : PWA & Application Webview

L'interface utilisateur a été conçue pour offrir une expérience fluide sur tous les appareils mobiles (smartphones et tablettes iOS / Android) :

### 1. Ergonomie Mobile-First & Responsive
- **Tailwind CSS Responsive Grid/Flexbox** : Adaptation dynamique de la mise en page selon la taille d'écran (`sm:`, `md:`, `lg:`).
- **Contrôles Tactiles & Navigation Adaptée** : Menus tiroir (*drawer*), boutons tactiles larges, et support complet des langues LTR (Français) et RTL (Arabe avec adaptation automatique de la direction du texte `dir="rtl"`).

### 2. Progressive Web App (PWA)
- Balises méta viewport configurées pour la gestion tactile et l'absence de zoom involontaire.
- Possibilité d'ajouter l'application à l'écran d'accueil (*Add to Home Screen*) depuis Safari iOS ou Chrome Android.

### 3. Intégration Webview (Application Native iOS / Android)
Pour encapsuler la plateforme dans une application mobile distribuée sur Google Play Store ou Apple App Store :
- **Android (WebView / Capacitor / TWA)** :
  Intégration possible via `Android WebView` ou `Trusted Web Activity (TWA)`.
  ```java
  WebView myWebView = (WebView) findViewById(R.id.webview);
  myWebView.setWebViewClient(new WebViewClient());
  myWebView.getSettings().setJavaScriptEnabled(true);
  myWebView.loadUrl("https://votre-domaine.dz");
  ```
- **iOS (WKWebView / Capacitor)** :
  Encapsulation dans `WKWebView` sous Swift / Xcode avec prise en charge du défilement natif et de la gestion de la barre de statut.

---

## Documentation de l'API REST Backend

L'API backend est exposée sur le port `4000`. Les routes authentifiées requièrent l'en-tête `Authorization: Bearer <JWT_TOKEN>`.

### Endpoints Principaux

| Méthode | Route | Rôle requis | Description |
| :--- | :--- | :--- | :--- |
| **GET** | `/api/health` | Public | Statut de santé de l'API et version |
| **POST** | `/api/auth/register` | Public | Inscription d'un client (`CUSTOMER`) ou vendeur (`VENDOR`) |
| **POST** | `/api/auth/login` | Public | Authentification et émission du jeton JWT |
| **GET** | `/api/products` | Public | Catalogue produits avec filtres, recherche et catégories |
| **GET** | `/api/products/:id` | Public | Détail d'un produit spécifique |
| **POST** | `/api/products` | `ADMIN`, `MANAGER`, `VENDOR` | Création d'un produit |
| **PUT** | `/api/products/:id` | `ADMIN`, `MANAGER`, `VENDOR` | Modification d'un produit et mise à jour du stock |
| **DELETE** | `/api/products/:id` | `ADMIN` | Suppression d'un produit |
| **POST** | `/api/orders` | Authentifié | Création d'une commande COD (Paiement à la livraison) |
| **GET** | `/api/orders` | Authentifié | Liste des commandes (propres commandes pour clients/vendeurs, toutes pour admin) |
| **GET** | `/api/orders/:id` | Authentifié | Consultation du détail d'une commande |
| **PATCH** | `/api/orders/:id/status` | `ADMIN`, `MANAGER` | Mise à jour du statut (`PENDING`, `PAID`, `SHIPPED`, `CANCELLED`) |
| **GET** | `/api/cms/pages` | Public | Liste des pages de contenu CMS |
| **GET** | `/api/cms/pages/:slug` | Public | Consultation d'une page CMS par son slug |
| **POST** | `/api/cms/pages` | `ADMIN`, `MANAGER` | Création d'une page CMS |
| **PUT** | `/api/cms/pages/:id` | `ADMIN`, `MANAGER` | Modification d'une page CMS |
| **DELETE** | `/api/cms/pages/:id` | `ADMIN` | Suppression d'une page CMS |
| **GET** | `/api/admin/stats` | `ADMIN`, `MANAGER` | Statistiques du tableau de bord et chiffre d'affaires |
| **GET** | `/api/admin/logs` | `ADMIN` | Consultation des journaux d'activité d'audit |
| **POST** | `/api/admin/backup` | `ADMIN` | Exportation et création d'une sauvegarde de la base |
| **POST** | `/api/admin/restore` | `ADMIN` | Restauration de la base de données relationnelle |
| **GET** | `/api/admin/delivery-rates` | `ADMIN`, `MANAGER` | Tarifs de livraison par Wilaya (58 Wilayas) |
| **PUT** | `/api/admin/delivery-rates/:id` | `ADMIN`, `MANAGER` | Mise à jour du tarif de livraison d'une Wilaya |
| **POST** | `/api/admin/ai/assistant` | `ADMIN`, `MANAGER` | Assistant IA pour création de fiche produit et analyse |
| **GET** | `/api/admin/export/orders` | `ADMIN`, `MANAGER` | Exportation des commandes (formats `json`, `csv`, `sheets`) |
| **POST** | `/api/admin/export/google-sheets` | `ADMIN`, `MANAGER` | Synchronisation manuelle avec Google Sheets |

---

## Bilan Complet des Fonctionnalités du Projet

Le projet **Web Manager / Ma Boutique Algérienne** couvre l'ensemble des 21 missions du cahier des charges :

1. **Architecture Monorepo & Workspaces** :
   - Applications isolées (`apps/`) et bibliothèque partagée (`packages/shared`).
   - Compilation TypeScript stricte et gestion centralisée des dépendances.

2. **Base de Données & Persistance (PostgreSQL 16)** :
   - Schéma complet : utilisateurs, rôles, boutiques vendeurs, produits, catégories, commandes multi-vendeurs, tarifs Wilayas, pages CMS, logs.
   - Migrations et initialisation automatique au démarrage.

3. **Caching, Verrous & Rate Limiting (Redis 7)** :
   - Caching haute performance des requêtes produit.
   - Limiteur de débit contre les attaques par force brute et verrous distribués pour la gestion des stocks.

4. **Authentification & Autorisations (RBAC)** :
   - Mots de passe sécurisés avec `bcrypt`.
   - Jetons JWT sécurisés et rôles applicatifs (`ADMIN`, `MANAGER`, `CUSTOMER`, `VENDOR`).

5. **Marketplace & Vitrine Public (Astro)** :
   - Rendu hybride ultra-rapide optimisé pour le SEO.
   - Catalogue, panier multi-boutiques et confirmation de commande.

6. **Portail de Gestion Back-Office (Nuxt 3)** :
   - Dashboard synthétique, gestion des stocks, des Wilayas (58), des commissions vendeurs et assistant IA.

7. **Sécurité, Audit & Sauvegardes** :
   - Traçabilité complète des actions d'administration, endpoints sécurisés d'export/import SQL.

8. **Tests Automated & Déploiement Conteneurisé** :
   - Tests unitaires et d'intégration Jest & Supertest.
   - Orchestration multi-conteneurs Docker Compose prête pour la production.

---

## Documentation Complémentaire
- `CAHIER-DES-CHARGES.md` : Cahier des charges et spécifications métier.
- `missionMBA/` : Dossier contenant l'ensemble des spécifications par mission (00 à 21).
- `missionMBA/INDEX.md` : Suivi global de l'avancement des missions MBA.
