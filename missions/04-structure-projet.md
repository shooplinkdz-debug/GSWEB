# Mission 04 — Structure du projet et Monorepo

## 1. Contexte & Description
Cette mission formalise et valide l'organisation du projet sous forme de **Monorepo** orchestré avec `pnpm workspaces`. L'architecture permet la cohabitation centralisée et la gestion fluide des dépendances de l'ensemble des sous-systèmes de la plateforme Web Manager : l'API REST backend, le site public e-commerce Astro, le portail d'administration Nuxt 3, et le package partagé pour les modèles de données et types TypeScript.

## 2. Objectifs de l'Architecture Monorepo
- **Isolation des applications** : Chaque sous-projet dispose de son propre périmètre (`package.json`, configuration de build, tests, dépendances spécifiques).
- **Partage de code type-safe** : Centralisation des interfaces, énumérations et types métiers (`User`, `Product`, `Order`, `Page`, `AuditLog`, `UserRole`, `OrderStatus`) dans `packages/shared`.
- **Simplification des workflows** : Exécution centralisée des commandes de développement (`pnpm dev`), de build (`pnpm build`), de test (`pnpm test`), et de linting (`pnpm lint`) depuis la racine du monorepo.
- **Optimisation du stockage et des builds** : Réutilisation efficace du stockage global pnpm et liaison automatique via des liens symboliques workspace.

## 3. Structure des Espaces de Travail (`pnpm-workspace.yaml`)

Configuration du workspace à la racine (`pnpm-workspace.yaml`) :
```yaml
packages:
  - 'apps/*'
  - 'packages/*'
```

### Arborescence Détaillée du Monorepo
```
web-manager-monorepo/
├── package.json               # Manifeste racine (scripts globaux & orchestration)
├── pnpm-workspace.yaml        # Définition des workspaces (`apps/*`, `packages/*`)
├── pnpm-lock.yaml             # Verrouillage des versions des dépendances
├── docker-compose.yml         # Orchestration multi-conteneurs Docker
├── README.md                  # Guide de démarrage et vue d'ensemble
├── CAHIER-DES-CHARGES.md      # Spécifications fonctionnelles et techniques
├── CHECKLIST-MISSIONS.md      # Suivi d'avancement des 21 missions
├── missions/                  # Fiches descriptives des missions 00 à 20
├── packages/
│   └── shared/                # Package TypeScript partagé (@web-manager/shared)
│       ├── package.json
│       ├── tsconfig.json
│       └── src/
│           └── index.ts       # Types, interfaces, énumérations et constantes métiers
└── apps/
    ├── api/                   # Backend Express / TypeScript API REST
    │   ├── package.json
    │   ├── tsconfig.json
    │   ├── Dockerfile
    │   └── src/
    ├── web-astro/             # Frontend e-commerce / CMS public Astro
    │   ├── package.json
    │   ├── astro.config.mjs
    │   ├── Dockerfile
    │   └── src/
    └── admin-nuxt/            # Back-office administration Nuxt 3
        ├── package.json
        ├── nuxt.config.ts
        ├── Dockerfile
        └── pages/
```

## 4. Scripts d'Orchestration Racine (`package.json`)
- `pnpm dev` : Lance l'ensemble des services en mode développement parallèle (`pnpm --parallel --recursive run dev`).
- `pnpm build` : Compile récursivement tous les projets du monorepo (`pnpm --recursive run build`).
- `pnpm test` : Exécute la suite de tests unitaires et d'intégration (`pnpm --recursive run test`).
- `pnpm lint` : Exécute le linter sur tous les espaces de travail (`pnpm --recursive run lint`).

## 5. Mesures de Sécurité & Bonnes Pratiques
- **Absence de couplage fort** : Pas de dépendances directes croisées non déclarées dans les manifestes `package.json`.
- **Gestion stricte des variables d'environnement** : Chaque application utilise son propre fichier `.env` ou hérite des variables système transmises par Docker/environnement sans exposer de clés privées.
- **Cohérence des dépendances** : Utilisation de TypeScript sur l'ensemble du monorepo pour garantir un typage strict et uniforme.

## 6. Critères de Validation
- La résolution des modules par `pnpm` s'effectue correctement pour toutes les applications.
- La commande `pnpm build` compile avec succès les projets `apps/api`, `apps/web-astro`, `apps/admin-nuxt`, et `packages/shared`.
- La suite de tests validant la structure du monorepo s'exécute sans erreur.
