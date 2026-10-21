# Mission 06 : Serveur & Services API Backend Express

## 1. Objectif de la mission
Développer et maintenir les services API REST centralisés pour exposer de manière sécurisée et performante l'ensemble des règles métier MBA aux frontends Marketplace et Gestionnaire.

## 2. Fichiers et modules concernés
- `apps/api/src/index.ts`
- `apps/api/src/routes/` (`auth.ts`, `products.ts`, `orders.ts`, `vendors.ts`, `admin.ts`, `pages.ts`)
- `apps/api/src/services/` (`logger.ts`, `redis.ts`)
- `apps/api/src/middleware/`

## 3. Tâches à réaliser
- Assurer la gestion globale du routage, des middlewares de parsing, de CORS et de sécurité (Helmet/Rate-limiting).
- Implémenter le middleware centralisé de gestion d'erreurs et le fallback HTTP 404 JSON.
- Offrir des mécanismes de validation d'entrées strictes (via `zod` ou validation personnalisée).

## 4. Dépendances avec les autres missions
- Dépendances amont : Mission 04, Mission 05.
- Dépendances aval : Mission 07, Mission 08, Mission 09, Mission 10, Mission 11, Mission 12, Mission 13, Mission 14, Mission 16.

## 5. Critères d'acceptation
- API fonctionnelle répondant sur `/api/health` avec statut HTTP 200.
- Réponses JSON standardisées, codes de statut HTTP appropriés (200, 201, 400, 401, 403, 404, 500).
- Journalisation des erreurs côté serveur sans exposition de données sensibles.

## 6. Tests à exécuter
- `pnpm --filter @web-manager/api test src/server.test.ts`
- `pnpm --filter @web-manager/api test src/index.test.ts`

## 7. Risques et précautions
- Éviter le plantage du serveur Express sur des exceptions non capturées dans des routes asynchrones.

## 8. Conditions permettant de déclarer la mission terminée
- Serveur API Express stable, couvert par les tests unitaires et d'intégration HTTP (Supertest).
