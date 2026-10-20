# Mission 02 — Cahier des charges fonctionnel et technique

## 1. Contexte & Description
Cette mission définit de manière exhaustive les spécifications fonctionnelles et techniques du système Web Manager. Elle sert de référence pour le comportement attendu des composants, les rôles utilisateurs, les parcours, les entités manipulées et les règles de validation associées.

## 2. Objectifs Fonctionnels & Techniques
- Définir le modèle d'habilitation utilisateur basé sur les rôles (RBAC) : `ADMIN`, `MANAGER`, `CUSTOMER`.
- Spécifier les modules fonctionnels principaux : Authentification, Catalogue & Produits, CMS Pages, Commandes & Paiements, Assistant IA, Audit Logs, et Sauvegardes/Restauration.
- Garantir le respect des exigences de sécurité (hachage des mots de passe bcrypt, tokens JWT, rate-limiting, masquage des secrets).

## 3. Spécification Détaillée des Entités & Rôles

### 3.1 Rôles Utilisateurs & Permissions (RBAC)
- **ADMIN** : Accès complet à l'ensemble du système, gestion des utilisateurs, journaux d'activité, sauvegardes, produits, pages et commandes.
- **MANAGER** : Gestion opérationnelle du catalogue de produits, traitement des commandes et gestion des pages CMS. Pas d'accès à la gestion administrative avancée (utilisateurs, logs système, sauvegardes).
- **CUSTOMER** : Utilisateur public/client. Inscription, connexion, consultation du catalogue public, passage de commandes et gestion du panier.

### 3.2 Cycle de vie des Entités Métier
- **Produits** :
  - Champs : `id`, `name`, `slug`, `description`, `price`, `stock`, `low_stock_threshold`, `image_url`, `created_at`, `updated_at`.
  - Règles : Stock décrémenté automatiquement lors de la validation d'une commande (`PAID`). Alerte stock bas déclenchée si `stock <= low_stock_threshold`.
- **Commandes & Paiements** :
  - Champs : `id`, `order_number`, `user_id`, `total_amount`, `status` (`PENDING`, `PAID`, `SHIPPED`, `CANCELLED`), `customer_email`, `shipping_address`, `created_at`.
  - Transitions :
    - `PENDING` -> `PAID` (lors de la validation du paiement de test).
    - `PAID` -> `SHIPPED` (lors de l'expédition par un MANAGER/ADMIN).
    - `PENDING` | `PAID` -> `CANCELLED` (en cas d'annulation ou défaut de paiement).
- **Pages CMS** :
  - Champs : `id`, `title`, `slug`, `content`, `is_published`, `created_at`, `updated_at`.
  - Rendu : Format HTML/Markdown supporté avec rendu optimisé sur le site public Astro.
- **Journaux d'Activité (Audit Logs)** :
  - Champs : `id`, `user_id`, `action`, `ip_address`, `details`, `created_at`.
  - Règles : Inscription automatique lors des actions sensibles (connexion, modifications de stock, changements de statuts de commande).

## 4. Parcours Utilisateurs Principaux
1. **Parcours Client (Public Astro)** : Navigation sur l'accueil/catalogue -> Ajout de produits au panier -> Inscription / Connexion -> Validation de la commande et paiement de test -> Confirmation de la commande.
2. **Parcours Administrateur / Manager (Nuxt Admin)** : Connexion back-office -> Visualisation du Dashboard -> Gestion des stocks/produits -> Validation des expéditions de commandes -> Consultation des logs d'audit.

## 5. Mesures de Sécurité & Bonnes Pratiques
- Validation stricte des entrées API avec Zod.
- Hachage sécurisé des mots de passe avec `bcryptjs` (salt factor >= 10).
- Authentification par jetons JWT transmis dans les en-têtes Authorization (`Bearer <token>`).
- Protection contre le force brute grâce au rate limiting (Redis).

## 6. Critères de Validation
- Documentation complète et alignée avec l'implémentation de la base de données et des routes API.
- Tous les schémas d'entrées et statuts de réponses HTTP sont conformes aux spécifications REST.
- Execution sans erreur en environnement local et sous conteneurisation Docker.
