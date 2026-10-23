<template>
  <div class="space-y-6">
    <div class="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
      <h1 class="text-2xl font-black text-slate-900">Campagnes Publicitaires & Bannières</h1>
      <p class="text-sm text-slate-500">Gérez les bannières de la page d'accueil et des emplacements promo.</p>
    </div>

    <!-- Ad Form -->
    <div class="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 space-y-4">
      <h2 class="text-lg font-bold text-slate-900">Ajouter une Bannière</h2>
      <form @submit.prevent="createAd" class="grid grid-cols-1 md:grid-cols-3 gap-4">
        <input v-model="form.title" placeholder="Titre de la campagne" required class="border p-2.5 rounded-xl text-sm" />
        <input v-model="form.imageUrl" placeholder="URL Image" required class="border p-2.5 rounded-xl text-sm" />
        <input v-model="form.targetUrl" placeholder="URL Cible / Produit" class="border p-2.5 rounded-xl text-sm" />
        <button type="submit" class="bg-emerald-700 hover:bg-emerald-800 text-white font-bold p-2.5 rounded-xl text-sm transition">
          Créer la Publicité
        </button>
      </form>
    </div>

    <!-- Ads List -->
    <div class="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div v-for="ad in ads" :key="ad.id" class="border p-4 rounded-xl flex space-x-4 rtl:space-x-reverse">
          <img :src="ad.image_url" class="w-24 h-24 object-cover rounded-lg border" />
          <div class="flex-1 space-y-1">
            <h3 class="font-bold text-slate-900 text-sm">{{ ad.title }}</h3>
            <p class="text-xs text-slate-500 font-mono">{{ ad.target_url || 'Sans lien' }}</p>
            <span :class="ad.is_active ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-600'" class="text-[10px] font-bold px-2 py-0.5 rounded">
              {{ ad.is_active ? 'Actif' : 'Masqué' }}
            </span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';

const ads = ref([]);
const form = ref({ title: '', imageUrl: '', targetUrl: '' });
const apiBase = 'http://localhost:4000/api';

async function loadAds() {
  const token = localStorage.getItem('token');
  const res = await fetch(`${apiBase}/ads/admin/all`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (res.ok) ads.value = await res.json();
}

async function createAd() {
  const token = localStorage.getItem('token');
  const res = await fetch(`${apiBase}/ads/admin`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(form.value),
  });
  if (res.ok) {
    form.value = { title: '', imageUrl: '', targetUrl: '' };
    loadAds();
  }
}

onMounted(() => {
  loadAds();
});
</script>
