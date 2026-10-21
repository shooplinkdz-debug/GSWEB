# Mission 18 : Intégration Optionnelle Google Sheets & Automatisations

## 1. Objectif de la mission
Spécifier et développer l'intégration optionnelle avec Google Sheets pour la synchronisation administrative et l'exportation automatique des rapports de commandes et de ventes.

## 2. Fichiers et modules concernés
- Services backend d'export dans `apps/api/src/services/`
- Endpoints d'administration dans `apps/api/src/routes/admin.ts`

## 3. Tâches à réaliser
- Préparer la structure d'exportation de données (format CSV / JSON / API Google Sheets).
- Prévoir un mode sans identifiants Google (fallback dégradé configurable via variables d'environnement) évitant les erreurs au démarrage.
- Documenter la configuration du Service Account Google et des identifiants OAuth.

## 4. Dépendances avec les autres missions
- Dépendances amont : Mission 06, Mission 11.
- Dépendances aval : Mission 19.

## 5. Critères d'acceptation
- Exportation propre des commandes sans impact sur la base de données principale.
- Comportement gracieux et sans crash si l'intégration Google n'est pas activée (`GOOGLE_SHEETS_ENABLED=false`).

## 6. Tests à exécuter
- Validation des fonctions d'exportation via `stats.test.ts`.

## 7. Risques et précautions
- Ne jamais considérer Google Sheets comme la base de données principale de l'e-commerce.
- Proscrire le stockage de clés privées Google dans le dépôt Git.

## 8. Conditions permettant de déclarer la mission terminée
- Service d'exportation documenté, configurable et testé en mode dégradé et actif.
