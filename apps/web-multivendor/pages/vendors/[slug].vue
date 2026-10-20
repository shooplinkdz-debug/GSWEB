<template>
  <div>
    <div v-if="loading" class="text-center py-12 text-slate-500">Chargement de la boutique...</div>
    <div v-else-if="error" class="p-8 bg-white rounded-2xl border border-red-200 text-center text-red-600">
      {{ error }}
    </div>
    <div v-else-if="vendor">
      <!-- Vendor Header Banner -->
      <div class="bg-white rounded-3xl p-8 border border-slate-200 shadow-sm mb-10 flex flex-col md:flex-row items-center gap-6">
        <img :src="vendor.logo_url || 'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5'" class="w-24 h-24 rounded-2xl object-cover border-2 border-indigo-100 shadow" alt="Logo" />
        <div class="flex-1 text-center md:text-left">
          <div class="flex flex-wrap items-center justify-center md:justify-start gap-3 mb-2">
            <h1 class="text-3xl font-black text-slate-900">{{ vendor.company_name }}</h1>
            <span class="bg-emerald-100 text-emerald-800 text-xs px-3 py-1 rounded-full font-bold">Vendeur Officiel</span>
          </div>
          <p class="text-slate-600 text-sm max-w-2xl mb-2">{{ vendor.description || 'Boutique vérifiée et partenaire de confiance.' }}</p>
          <p class="text-slate-400 text-xs">Contact : {{ vendor.user_email }}</p>
        </div>
      </div>

      <!-- Vendor Products Grid -->
      <section>
        <h2 class="text-2xl font-bold text-slate-800 mb-6">Produits de la boutique ({{ products.length }})</h2>
        <div v-if="products.length === 0" class="p-8 bg-white rounded-2xl border text-center text-slate-500">
          Ce vendeur n'a pas encore mis de produit en vente.
        </div>
        <div v-else class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          <div v-for="product in products" :key="product.id" class="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm hover:shadow-md transition flex flex-col">
            <img :src="product.image_url || 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e'" class="h-48 w-full object-cover" alt="Produit" />
            <div class="p-5 flex-1 flex flex-col">
              <div class="flex justify-between items-start mb-2">
                <span class="text-xs font-bold text-indigo-600 bg-indigo-50 px-2 py-1 rounded">{{ product.category_name || 'Général' }}</span>
                <span class="text-lg font-black text-slate-900">{{ product.price }} €</span>
              </div>
              <h3 class="font-bold text-slate-800 text-lg mb-2">{{ product.name }}</h3>
              <p class="text-slate-500 text-xs line-clamp-2 mb-4 flex-1">{{ product.description }}</p>
              <div class="pt-3 border-t flex justify-between items-center text-xs text-slate-500">
                <span>Stock: <strong class="text-slate-700">{{ product.stock }}</strong></span>
                <button class="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold px-3 py-1.5 rounded-lg transition">Acheter</button>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useRoute } from 'vue-router';

const route = useRoute();
const vendor = ref(null);
const products = ref([]);
const loading = ref(true);
const error = ref('');

onMounted(async () => {
  try {
    const res = await fetch(`http://localhost:4000/api/vendors/${route.params.slug}`);
    if (!res.ok) {
      error.value = 'Boutique vendeur introuvable.';
      return;
    }
    const data = await res.json();
    vendor.value = data.vendor;
    products.value = data.products;
  } catch (err) {
    error.value = 'Erreur lors du chargement de la boutique.';
  } finally {
    loading.value = false;
  }
});
</script>
