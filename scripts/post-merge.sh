#!/usr/bin/env bash
# Git post-merge hook script to automatically install dependencies, rebuild projects, and update UI containers on 'git pull'

echo "🔄 [Git Pull] Mise à jour automatique détectée..."

echo "📦 Installation des dépendances pnpm..."
pnpm install

echo "🏗️ Recompilation automatique des projets et interfaces..."
pnpm build

# Vérification si Docker Compose est actif
if command -v docker &> /dev/null && docker compose ps --services --filter "status=running" 2>/dev/null | grep -q .; then
    echo "🐳 Conteneurs Docker en cours d'exécution détectés."
    echo "🔄 Reconfiguration et redémarrage des services Docker..."
    docker compose up -d --build
elif command -v docker-compose &> /dev/null && docker-compose ps --services --filter "status=running" 2>/dev/null | grep -q .; then
    echo "🐳 Conteneurs Docker-Compose en cours d'exécution détectés."
    echo "🔄 Reconfiguration et redémarrage des services Docker..."
    docker-compose up -d --build
fi

echo "✨ Les interfaces applicatives et services ont été mis à jour avec succès !"
