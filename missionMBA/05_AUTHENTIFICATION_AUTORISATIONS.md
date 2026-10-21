# Mission 05 : Authentification & Autorisations RBAC

## 1. Objectif de la mission
Mettre en place le système d'authentification sécurisé par jetons JWT, le hachage de mots de passe avec bcrypt, et le contrôle d'accès fondé sur les rôles (RBAC : ADMIN, MANAGER, VENDOR, CUSTOMER).

## 2. Fichiers et modules concernés
- `apps/api/src/routes/auth.ts`
- `apps/api/src/middleware/auth.ts`
- `apps/api/src/auth.test.ts`
- `packages/shared/src/types.ts` (`UserRole`)

## 3. Tâches à réaliser
- Implémenter les routes `/api/auth/register`, `/api/auth/login`, `/api/auth/me`.
- Appliquer la vérification du token JWT et la validation du rôle dans les middlewares backend (`authenticateJWT`, `requireRole`).
- Sécuriser l'isolation des données : un VENDOR ne doit accéder qu'aux données de sa propre boutique.

## 4. Dépendances avec les autres missions
- Dépendances amont : Mission 04 (Base de données).
- Dépendances aval : Mission 06, Mission 07, Mission 08, Mission 10.

## 5. Critères d'acceptation
- Inscription et connexion sécurisées avec génération de token JWT valide.
- Rejet des accès non autorisés (HTTP 401 Unauthenticated, HTTP 403 Forbidden).
- Hachage systématique des mots de passe avec `bcryptjs` (salt factor >= 10).

## 6. Tests à exécuter
- `pnpm --filter @web-manager/api test src/auth.test.ts`

## 7. Risques et précautions
- Risque de fuite de jetons JWT si expirations trop longues ou clés secrètes faibles.
- Ne jamais envoyer le mot de passe haché dans les réponses API.

## 8. Conditions permettant de déclarer la mission terminée
- Module d'authentification entièrement testé et sécurisé par la suite Jest.
