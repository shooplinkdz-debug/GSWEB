# Web Manager — Application Web Complète (Astro + Nuxt + Express + PostgreSQL + Redis)

Plateforme web e-commerce et gestionnaire de contenu (CMS) modulable, sécurisée et conteneurisée.

---

## Architecture du Monorepo

Le projet est structuré sous forme de monorepo géré avec `pnpm` workspaces :

- **`apps/api`** : Serveur API REST backend en Node.js / Express / TypeScript avec authentification JWT, RBAC, intégration PostgreSQL, Redis et Assistant IA.
- **`apps/web-astro`** : Front-end public et site e-commerce / CMS développé avec Astro (rendu hybride SSR / statique) et Tailwind CSS.
- **`apps/admin-nuxt`** : Portail d'administration back-office développé avec Nuxt 3 / Vue 3 pour la gestion des produits, commandes, contenus, statistiques, logs et sauvegardes.
- **`packages/shared`** : Bibliothèque partagée de types TypeScript, énumérations (rôles, statuts de commande) et modèles de données métier.
- **`docker-compose.yml`** : Orchestration de l'ensemble des services (PostgreSQL 16, Redis 7, API backend, Web Astro public, Admin Nuxt).

---

## Guide d'Installation et Déploiement

### Prérequis
- **Node.js** : `>= 18.0.0`
- **Gestionnaire de paquets** : `pnpm` (`npm install -g pnpm`) ou `npm`
- **Conteneurisation** : `Docker` et `Docker Compose` (Docker Desktop pour Windows / macOS / Linux)

---

### Installation sous Windows

#### Option 1 : PowerShell / CMD (Développement local)
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

#### Option 2 : WSL2 (Windows Subsystem for Linux - Recommandé)
1. **Lancer votre terminal WSL2** (Ubuntu/Debian).
2. **Cloner / Naviguer vers le dossier du projet** :
   ```bash
   cd /path/to/web-manager
   ```
3. **Configurer les variables d'environnement** :
   ```bash
   cp .env.example .env
   ```
4. **Lancer l'ensemble de la pile avec Docker Compose** :
   ```bash
   docker compose up -d --build
   ```

---

### Installation avec Docker & Docker Compose

Pour un déploiement rapide et conteneurisé de l'intégralité de l'application :

1. **Préparer le fichier `.env`** :
   ```bash
   cp .env.example .env
   ```
2. **Construire et démarrer tous les conteneurs** en arrière-plan :
   ```bash
   docker compose up -d --build
   ```
3. **Vérifier le statut des services conteneurisés** :
   ```bash
   docker compose ps
   ```
4. **Services disponibles** :
   - **Site public Astro** : `http://localhost:3000`
   - **Interface d'administration Nuxt** : `http://localhost:3001`
   - **API Backend Express** : `http://localhost:4000`
   - **Base de données PostgreSQL** : `localhost:5432`
   - **Cache Redis** : `localhost:6379`

---

## Documentation de l'API REST Backend

L'API backend est exposée par défaut sur le port `4000`. Les routes nécessitant une authentification s'attendent à un header `Authorization: Bearer <JWT_TOKEN>`.

### Endpoints Principaux

| Méthode | Route | Rôle requis | Description |
| :--- | :--- | :--- | :--- |
| **GET** | `/api/health` | Public | Vérification de la santé du serveur et statut du service |
| **POST** | `/api/auth/register` | Public | Inscription d'un nouvel utilisateur (`CUSTOMER`) |
| **POST** | `/api/auth/login` | Public | Authentification et génération du token JWT |
| **GET** | `/api/products` | Public | Liste des produits du catalogue e-commerce |
| **GET** | `/api/products/:id` | Public | Détail d'un produit par ID |
| **POST** | `/api/products` | `ADMIN`, `MANAGER` | Création d'un nouveau produit |
| **PUT** | `/api/products/:id` | `ADMIN`, `MANAGER` | Mise à jour d'un produit et ajustement du stock |
| **DELETE** | `/api/products/:id` | `ADMIN` | Suppression d'un produit |
| **POST** | `/api/orders` | Authentifié | Création d'une nouvelle commande client |
| **GET** | `/api/orders` | Authentifié | Liste des commandes (propres commandes pour `CUSTOMER`, toutes pour `ADMIN`/`MANAGER`) |
| **GET** | `/api/orders/:id` | Authentifié | Détail d'une commande spécifique |
| **PATCH** | `/api/orders/:id/status` | `ADMIN`, `MANAGER` | Changement du statut d'une commande (`PENDING`, `PAID`, `SHIPPED`, `CANCELLED`) |
| **GET** | `/api/cms/pages` | Public | Liste des pages CMS publiées |
| **GET** | `/api/cms/pages/:slug` | Public | Obtenir le contenu d'une page CMS par son slug |
| **POST** | `/api/cms/pages` | `ADMIN`, `MANAGER` | Créer une nouvelle page CMS |
| **PUT** | `/api/cms/pages/:id` | `ADMIN`, `MANAGER` | Modifier une page CMS existante |
| **DELETE** | `/api/cms/pages/:id` | `ADMIN` | Supprimer une page CMS |
| **GET** | `/api/admin/stats` | `ADMIN`, `MANAGER` | Statistiques du tableau de bord (ventes, commandes, produits) |
| **GET** | `/api/admin/logs` | `ADMIN` | Consultation des journaux d'activité et d'audit |
| **GET** | `/api/admin/backup` | `ADMIN` | Export et téléchargement de la sauvegarde de la base de données SQL |
| **POST** | `/api/admin/restore` | `ADMIN` | Restauration de la base de données depuis un fichier d'export |
| **POST** | `/api/admin/ai/assistant` | `ADMIN`, `MANAGER` | Assistant IA pour génération de contenu et analyse |

---

## Bilan Complet des Fonctionnalités du Projet

Le projet **Web Manager** couvre l'ensemble des 21 missions définies dans le cahier des charges :

1. **Architecture Monorepo & Structure Modulaire** :
   - Isolation claire des applications (`apps/`) et paquets partagés (`packages/shared`).
   - Compilation TypeScript stricte et gestion centralisée des dépendances via `pnpm`.

2. **Base de Données & Persistance (PostgreSQL)** :
   - Schéma relationnel complet : utilisateurs, rôles, produits, catégories, commandes, éléments de commande, pages CMS, journaux d'activité.
   - Migrations SQL automatiques et scripts d'amorçage des données (*seeding*).

3. **Performance & Sécurité du Caching (Redis)** :
   - Cache Redis pour optimiser les réponses d'API à fort trafic.
   - Limiteur de débit (*Rate Limiting*) pour prévenir les attaques par déni de service (DDoS) et force brute.
   - Verrous distribués pour sécuriser les mises à jour concurrentes de stock.

4. **Authentification & Contrôle d'Accès Réparti (RBAC)** :
   - Mots de passe sécurisés par hachage `bcrypt`.
   - Authentification basée sur les jetons JSON Web Tokens (JWT).
   - Middleware de contrôle d'accès fondé sur les rôles (`ADMIN`, `MANAGER`, `CUSTOMER`).

5. **Site Public & E-Commerce (Astro)** :
   - Vitrine Web ultra-rapide optimisée pour le SEO avec rendu hybride.
   - Catalogue produit dynamiquement alimenté, panier d'achat et tunnel de commande.
   - Consultation des pages de contenus CMS.

6. **Portail d'Administration Back-Office (Nuxt 3)** :
   - Dashboard synthétique avec widgets graphiques et indicateurs clés de performance (KPIs).
   - Gestion avancée des catalogues produits, des niveaux de stock et alertes de stock bas.
   - Traitement des commandes et mise à jour des statuts en temps réel.
   - Édition et publication des contenus CMS.
   - Interface d'Assistant IA intégré pour l'aide à la création de fiches produits et d'articles.

7. **Sécurité, Audit & Sauvegardes** :
   - Journalisation exhaustive des actions sensibles (*Activity Logs*).
   - Endpoints sécurisés pour la sauvegarde exportée et la restauration de la base de données.
   - Absence totale de secrets enregistrés en dur dans les fichiers source.

8. **Qualité & Intégration Continue** :
   - Suites de tests automatisés (unitaires et d'intégration) via `Jest` et `Supertest`.
   - Conteneurisation complète multi-stage prête pour la production avec Docker et Docker Compose.

---

## Documentation Complémentaire
- `CAHIER-DES-CHARGES.md` : Cahier des charges et spécifications initiales.
- `CHECKLIST-MISSIONS.md` : Checklist de suivi d'avancement des 21 missions (00 à 20).
- `missions/` : Dossier contenant le détail des spécifications par mission.
