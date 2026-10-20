<template>
  <div>
    <div class="mb-8">
      <h1 class="text-3xl font-extrabold text-slate-900">Annuaire des Boutiques Vendeurs</h1>
      <p class="text-slate-500">Explorez toutes nos boutiques de vendeurs indépendants inscrites sur WebManager.</p>
    </div>

    <div v-if="loading" class="text-center py-12 text-slate-500">Chargement de l'annuaire des vendeurs...</div>
    <div v-else-if="vendors.length === 0" class="p-8 bg-white rounded-2xl border text-center text-slate-500">
      Aucune boutique partenaire n'est enregistrée pour le moment.
    </div>
    <div v-else class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      <div v-for="vendor in vendors" :key="vendor.id" class="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm hover:shadow-md transition">
        <div class="flex items-center space-x-4 mb-4">
          <img :src="vendor.logo_url || 'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5'" class="w-16 h-16 rounded-xl object-cover border" alt="Logo" />
          <div>
            <h2 class="font-bold text-xl text-slate-900">{{ vendor.company_name }}</h2>
            <span class="inline-block bg-emerald-100 text-emerald-800 text-xs px-2.5 py-0.5 rounded-full font-semibold">Partenaire Agrée</span>
          </div>
        </div>
        <p class="text-slate-600 text-sm mb-6 min-h-[40px]">{{ vendor.description || 'Spécialiste agréé sur la Marketplace WebManager.' }}</p>
        <NuxtLink :to="`/vendors/${vendor.slug}`" class="block text-center bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-2.5 rounded-xl text-sm transition">
          Découvrir le catalogue
        </NuxtLink>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';

const vendors = ref([]);
const loading = ref(true);

onMounted(async () => {
  try {
    const res = await fetch('http://localhost:4000/api/vendors');
    if (res.ok) {
      vendors.value = await res.json();
    }
  } catch (err) {
    console.error(err);
  } finally {
    loading.value = false;
  }
});
</script>
