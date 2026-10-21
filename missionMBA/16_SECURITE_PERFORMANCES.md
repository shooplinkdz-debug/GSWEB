# Mission 16 : Sécurité, Caching Redis & Performances

## 1. Objectif de la mission
Renforcer la sécurité applicative de la plateforme MBA, optimiser les temps de réponse grâce au cache Redis, implémenter un taux limite de requêtes (rate limiting) et prévenir les attaques courantes (XSS, SQLi, CSRF, Brute Force).

## 2. Fichiers et modules concernés
- `apps/api/src/services/redis.ts`
- `apps/api/src/redis.test.ts`
- `apps/api/src/security_backup.test.ts`
- Middlewares de rate limiting et d'en-têtes de sécurité (Helmet, Express Rate Limit)

## 3. Tâches à réaliser
- Configurer la mise en cache Redis pour les requêtes de lecture à fort trafic (catalogue produits, catégories).
- Mettre en place le Rate Limiting sur les routes sensibles (`/api/auth/login`, `/api/orders`).
- Sécuriser les en-têtes HTTP, masquer la signature serveur, assainir les entrées utilisateurs.
- Mettre en place les fonctions de sauvegarde SQL et restauration sécurisées (`/api/admin/backup`, `/api/admin/restore`).

## 4. Dépendances avec les autres missions
- Dépendances amont : Mission 04, Mission 06.
- Dépendances aval : Mission 17, Mission 20.

## 5. Critères d'acceptation
- Temps de réponse de l'API optimisés sur les lectures fréquemment sollicitées.
- Blocage automatique des tentatives abusives sur la connexion par rate limiting.
- Opérations de sauvegarde et restauration de base de données validées.

## 6. Tests à exécuter
- `pnpm --filter @web-manager/api test src/redis.test.ts`
- `pnpm --filter @web-manager/api test src/security_backup.test.ts`

## 7. Risques et précautions
- Garantir un mode dégradé (in-memory fallback) si le serveur Redis est indisponible.
- Restreindre l'accès à la sauvegarde/restauration exclusivement aux administrateurs.

## 8. Conditions permettant de déclarer la mission terminée
- Suite de tests de sécurité, sauvegarde et Redis exécutée avec 100% de réussite.
