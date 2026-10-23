<template>
  <div class="space-y-6">
    <div class="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
      <h1 class="text-2xl font-black text-slate-900">Sociétés de Livraison Partenaires</h1>
      <p class="text-sm text-slate-500">Gérez les partenaires de livraison et leurs clés d'intégration API.</p>
    </div>

    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div v-for="c in companies" :key="c.id" class="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 space-y-2">
        <div class="flex justify-between items-center">
          <h2 class="font-bold text-slate-900 text-base">{{ c.name }}</h2>
          <span :class="c.status === 'ACTIVE' ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'" class="text-xs font-bold px-2 py-0.5 rounded">
            {{ c.status }}
          </span>
        </div>
        <p class="text-xs text-slate-500">Téléphone : {{ c.phone || 'Non renseigné' }}</p>
        <p class="text-xs text-slate-500">Email : {{ c.email || 'Non renseigné' }}</p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';

const companies = ref([]);
const apiBase = 'http://localhost:4000/api';

async function loadCompanies() {
  const res = await fetch(`${apiBase}/delivery/companies`);
  if (res.ok) companies.value = await res.json();
}

onMounted(() => {
  loadCompanies();
});
</script>
