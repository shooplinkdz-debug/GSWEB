<template>
  <div class="min-h-screen bg-slate-50 flex flex-col font-sans text-slate-900">
    <!-- Header Navigation -->
    <header class="bg-indigo-900 text-white shadow-lg sticky top-0 z-50">
      <div class="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
        <NuxtLink to="/" class="flex items-center space-x-3">
          <div class="bg-indigo-500 text-white p-2 rounded-lg font-black text-xl tracking-wider">MV</div>
          <div>
            <span class="text-xl font-extrabold tracking-tight block leading-none">MarketPlace Multi-Vendeurs</span>
            <span class="text-xs text-indigo-300">Connecté au WebManager</span>
          </div>
        </NuxtLink>

        <nav class="flex items-center space-x-6 text-sm font-medium">
          <NuxtLink to="/" class="hover:text-indigo-300 transition">Accueil</NuxtLink>
          <NuxtLink to="/vendors" class="hover:text-indigo-300 transition">Boutiques Vendeurs</NuxtLink>
          <NuxtLink to="/login" class="bg-indigo-600 hover:bg-indigo-500 px-4 py-2 rounded-lg font-semibold text-white transition shadow-sm">
            Espace Vendeur
          </NuxtLink>
        </nav>
      </div>
    </header>

    <!-- Main Content -->
    <main class="flex-1 max-w-7xl w-full mx-auto px-6 py-8">
      <NuxtPage />
    </main>

    <!-- Footer -->
    <footer class="bg-slate-900 text-slate-400 text-xs py-6 border-t border-slate-800">
      <div class="max-w-7xl mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-4">
        <p>© 2025 Plateforme Multi-Vendeurs — Connectée à l'API Gestionnaire Web Manager</p>
        <div class="flex space-x-4">
          <NuxtLink to="/" class="hover:text-white">Accueil Marketplace</NuxtLink>
          <NuxtLink to="/vendors" class="hover:text-white">Annuaire des Vendeurs</NuxtLink>
          <NuxtLink to="/dashboard" class="hover:text-white">Dashboard Vendeur</NuxtLink>
        </div>
      </div>
    </footer>
  </div>
</template>
