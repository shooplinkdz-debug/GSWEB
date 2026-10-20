<template>
  <div class="min-h-screen bg-slate-100 flex flex-col font-sans">
    <header class="bg-slate-900 text-white py-4 px-6 shadow-md flex justify-between items-center">
      <div class="flex items-center space-x-3">
        <span class="text-xl font-bold tracking-tight">WebManager Admin</span>
      </div>
      <nav class="space-x-4 text-sm font-medium">
        <NuxtLink to="/" class="hover:text-indigo-400">Dashboard</NuxtLink>
        <NuxtLink to="/products" class="hover:text-indigo-400">Produits & Stocks</NuxtLink>
        <NuxtLink to="/pages" class="hover:text-indigo-400">Pages CMS</NuxtLink>
        <NuxtLink to="/orders" class="hover:text-indigo-400">Commandes</NuxtLink>
        <NuxtLink to="/logs" class="hover:text-indigo-400">Journaux & Backup</NuxtLink>
        <NuxtLink to="/ai" class="hover:text-indigo-400">Assistant IA</NuxtLink>
      </nav>
    </header>

    <main class="flex-1 p-6 max-w-7xl w-full mx-auto">
      <NuxtPage />
    </main>

    <footer class="bg-slate-200 text-slate-600 text-xs py-4 text-center border-t border-slate-300">
      Panel d'Administration Web Manager — Protégé par RBAC
    </footer>
  </div>
</template>
