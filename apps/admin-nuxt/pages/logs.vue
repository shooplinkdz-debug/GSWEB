<template>
  <div>
    <h1 class="text-3xl font-bold mb-6 text-slate-800">Journaux & Sauvegardes</h1>
    <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
      <div class="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
        <h2 class="text-xl font-bold mb-4 text-slate-800">Journaux d'Activité</h2>
        <div class="space-y-3 text-sm">
          <div class="p-3 bg-slate-50 rounded-lg">
            <p class="font-bold text-slate-800">Connexion Administrateur</p>
            <p class="text-xs text-slate-500">IP: 127.0.0.1 - Hier à 14:30</p>
          </div>
          <div class="p-3 bg-slate-50 rounded-lg">
            <p class="font-bold text-slate-800">Mise à jour du produit ELEC-001</p>
            <p class="text-xs text-slate-500">IP: 127.0.0.1 - Hier à 15:10</p>
          </div>
        </div>
      </div>

      <div class="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
        <h2 class="text-xl font-bold mb-4 text-slate-800">Sauvegarde PostgreSQL</h2>
        <p class="text-slate-600 text-sm mb-4">Générez une sauvegarde complète au format JSON/SQL.</p>
        <button class="bg-indigo-600 hover:bg-indigo-700 text-white font-bold px-6 py-2 rounded-lg transition">
          Déclencher la sauvegarde
        </button>
      </div>
    </div>
  </div>
</template>
