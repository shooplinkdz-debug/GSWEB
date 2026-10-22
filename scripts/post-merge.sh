#!/usr/bin/env bash
# Git post-merge hook script to automatically install dependencies and rebuild projects on 'git pull'

echo "🔄 [Git Pull] Mise à jour automatique détectée..."
echo "📦 Installation des dépendances pnpm..."
pnpm install

echo "🏗️ Recompilation automatique des projets..."
pnpm build

echo "✅ Mise à jour et recompilation terminées avec succès !"
