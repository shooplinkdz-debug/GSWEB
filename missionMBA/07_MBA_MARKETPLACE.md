# Mission 07 : Application Client MBA Marketplace Public

## 1. Objectif de la mission
Développer l'application web publique e-commerce MBA Marketplace dédiée aux clients pour la découverte des produits, la recherche, la consultation des boutiques, la gestion du panier et la passation de commandes en Algérie.

## 2. Fichiers et modules concernés
- `apps/web-astro/` (Pages Astro, composants UI, Tailwind CSS)
- API Backend REST (`/api/products`, `/api/orders`, `/api/vendors`)

## 3. Tâches à réaliser
- Structurer les vues : Page d'accueil, Catalogue produits avec filtres, Fiche détail produit, Vues boutiques vendeurs, Panier, Tunnel de commande, Suivi de commande client.
- Intégrer l'affichage des prix en Dinars Algériens (DZD).
- Assurer le chargement dynamique des données depuis l'API REST sans fausses données codées en dur.

## 4. Dépendances avec les autres missions
- Dépendances amont : Mission 05, Mission 06, Mission 09, Mission 10, Mission 11.
- Dépendances aval : Mission 12, Mission 15.

## 5. Critères d'acceptation
- Expérience utilisateur fluide et rapide sur mobile, tablette et ordinateur.
- Connectivité complète avec l'API backend REST pour l'affichage du catalogue et le tunnel d'achat.
- Gestion élégante des états de chargement (skeletons), erreurs et videries (empty states).

## 6. Tests à exécuter
- `pnpm --filter @web-manager/web-astro build`
- Vérification visuelle et responsive des pages publiques.

## 7. Risques et précautions
- Ne jamais stocker de jetons d'administration dans le localStorage ou le code client public.

## 8. Conditions permettant de déclarer la mission terminée
- Marketplace fonctionnel, compilable avec `astro build` et connecté à l'API.
