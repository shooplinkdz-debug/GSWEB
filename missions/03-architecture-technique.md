# Mission 03 — Architecture technique globale

## 1. Contexte & Description
Cette mission définit la structure technique globale du projet Web Manager, l'organisation en Monorepo, la pile technologique complète, le schéma de base de données relationnelle PostgreSQL, la stratégie de cache et rate-limiting Redis, ainsi que les modèles de sécurité et d'authentification.

## 2. Monorepo & Structure des Applications

Le projet s'appuie sur une organisation en Monorepo gérée par `pnpm workspaces` (`pnpm-workspace.yaml`) :

- `apps/api` : Service Backend API REST développé en **Node.js / Express / TypeScript**. Responsable de la logique métier, de l'accès aux données PostgreSQL, de l'interaction avec Redis, de la gestion des jetons JWT et des règles RBAC.
- `apps/web-astro` : Application Frontend publique sous **Astro** (SSR / Hybride / Tailwind CSS). Fournit l'interface utilisateur e-commerce et CMS ultra-rapide et optimisée pour le référencement.
- `apps/admin-nuxt` : Application Frontend Back-Office sous **Nuxt 3 / Vue 3 / Pinia / Tailwind CSS**. Offre le tableau de bord d'administration dynamique pour la gestion du catalogue, des commandes, des pages CMS, des utilisateurs, des journaux et de l'assistant IA.

## 3. Base de Données Relationnelle PostgreSQL (Schéma ER)

La persistance des données repose sur **PostgreSQL 16**. Le schéma relationnel comprend les tables suivantes :

```
┌─────────────────┐       ┌─────────────────┐       ┌─────────────────┐
│      users      │1     *│     orders      │1     *│   order_items   │
├─────────────────┤───────├─────────────────┤───────├─────────────────┤
│ id (PK)         │       │ id (PK)         │       │ id (PK)         │
│ email (UNIQUE)  │       │ order_number    │       │ order_id (FK)   │
│ password_hash   │       │ user_id (FK)    │       │ product_id (FK) │
│ role            │       │ total_amount    │       │ quantity        │
│ created_at      │       │ status          │       │ unit_price      │
└─────────────────┘       └─────────────────┘       └─────────────────┘
         │                                                   │
         │1                                                  │*
         │                                          ┌─────────────────┐
         │                                          │    products     │
         │                                          ├─────────────────┤
         │                                          │ id (PK)         │
         │                                          │ name, slug      │
         │                                          │ price, stock    │
         │                                          │ low_stock_thresh│
         │                                          └─────────────────┘
         │*
┌─────────────────┐       ┌─────────────────┐
│   audit_logs    │       │      pages      │
├─────────────────┤       ├─────────────────┤
│ id (PK)         │       │ id (PK)         │
│ user_id (FK)    │       │ title, slug     │
│ action, ip, date│       │ content, is_pub │
└─────────────────┘       └─────────────────┘
```

## 4. Architecture Redis & Strategie Caching / Rate Limiting

Le service **Redis 7** remplit trois rôles majeurs :
1. **Rate Limiting** : Restriction du nombre de requêtes par IP/utilisateur sur les routes sensibles (`/api/auth/*`, `/api/admin/*`) pour prévenir les attaques par force brute et par déni de service.
2. **Session / Revocation Store** : Liste d'invalidation des jetons JWT révoqués et sessions temporaires.
3. **Data Caching** : Mise en cache en mémoire des requêtes fréquentes du catalogue produit et des pages CMS publiques pour optimiser les temps de réponse.

## 5. Sécurité, Authentification & Autorisations (RBAC)

- **Cryptage des identifiants** : Les mots de passe sont hachés de manière irréversible à l'aide d'un sel via `bcryptjs`.
- **Authentification Stateless** : Emission de tokens JWT signés avec une clé secrète forte configurable via variable d'environnement (`JWT_SECRET`).
- **Contrôle d'Accès Réparti (RBAC Middleware)** :
  - `requireAuth` : Extrait et vérifie le jeton JWT transmis dans l'en-tête `Authorization: Bearer <token>`.
  - `requireRole(...roles)` : Valide le rôle attribué à l'utilisateur (`ADMIN`, `MANAGER`, `CUSTOMER`) avant d'autoriser l'accès aux endpoints d'API.

## 6. Architecture de Conteneurisation & Déploiement Docker

Orchestration complète définie dans `docker-compose.yml` :
- Service `postgres` (PostgreSQL 16) sur port `5432`.
- Service `redis` (Redis 7) sur port `6379`.
- Service `api` (Backend Express) sur port `4000`.
- Service `web-astro` (Frontend Astro) sur port `3000`.
- Service `admin-nuxt` (Frontend Nuxt 3) sur port `3001`.

## 7. Critères de Validation
- Le réseau inter-conteneurs Docker permet la communication sécurisée entre services.
- L'API gère correctement les formats de données JSON et renvoie des codes HTTP standardisés (`200 OK`, `201 Created`, `400 Bad Request`, `401 Unauthorized`, `403 Forbidden`, `404 Not Found`, `500 Internal Server Error`).
