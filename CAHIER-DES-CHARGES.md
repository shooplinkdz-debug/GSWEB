# CAHIER DES CHARGES — GESTIONNAIRE WEB COMPLET

## 1. Contexte et Vision du Projet
Le projet Web Manager est une plateforme e-commerce et CMS moderne, performante et modulaire, composée d'un site public e-commerce/CMS (Astro), d'un portail d'administration complet (Nuxt 3), et d'une API backend robuste (Express / Node.js / TypeScript) adossée à PostgreSQL et Redis.

## 2. Objectifs Métier
- Offrir une vitrine e-commerce et de contenus publique ultra-rapide et optimisée pour le SEO.
- Fournir un back-office d'administration réactif pour gérer le catalogue produits, les stocks, les contenus CMS, les commandes, les utilisateurs, la sécurité et la sauvegarde.
- Intégrer un assistant IA pour l'aide à la création de contenu et l'analyse de données.
- Assurer une sécurité optimale (RBAC, JWT, hachage bcrypt, audit logs, rate-limiting, pas de secrets dans le code source).

## 3. Architecture Technique
- **Monorepo** : pnpm / npm workspaces
- **Backend API** : Node.js / Express / TypeScript (JWT, RBAC, Knex/Kysely/pg/Prisma)
- **Frontend Public** : Astro (Rendu hybride, SSR/Static, Tailwind CSS)
- **Frontend Admin** : Nuxt 3 / Vue 3 (Dashboard, Pinia, Tailwind CSS / UI Components)
- **Base de données** : PostgreSQL 16
- **Cache & Rate Limiting** : Redis 7
- **Conteneurisation** : Docker & Docker Compose

## 4. Spécifications des Entités Principales
1. **Utilisateurs & Rôles** : `ADMIN`, `MANAGER`, `CUSTOMER`.
2. **Produits & Catégories** : SKU, nom, slug, prix, stock, alertes stock bas, images.
3. **Commandes & Paiements** : Numéro unique, statut (`PENDING`, `PAID`, `SHIPPED`, `CANCELLED`), mode paiement test, détails client.
4. **Pages CMS** : Titre, slug, contenu Markdown/HTML, statut de publication.
5. **Journaux d'Activité** : Action, utilisateur, IP, horodatage.
6. **Sauvegardes** : Export SQL et restauration via endpoints API sécurisés.
