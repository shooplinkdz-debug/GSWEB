<template>
  <div>
    <!-- Hero Banner -->
    <div class="bg-gradient-to-r from-indigo-700 via-purple-700 to-indigo-900 text-white rounded-3xl p-8 md:p-12 mb-10 shadow-2xl relative overflow-hidden">
      <div class="relative z-10 max-w-2xl">
        <span class="inline-block bg-indigo-500/30 text-indigo-200 text-xs font-semibold uppercase px-3 py-1 rounded-full mb-4">
          Marketplace Multi-Vendeurs Indépendants
        </span>
        <h1 class="text-4xl md:text-5xl font-black tracking-tight mb-4 leading-tight">
          Achetez en direct auprès de nos vendeurs vérifiés
        </h1>
        <p class="text-indigo-100 text-base md:text-lg mb-8 leading-relaxed">
          Découvrez des milliers de produits proposés par nos boutiques partenaires de confiance, gérés et synchronisés en temps réel via le gestionnaire central.
        </p>
        <div class="flex flex-wrap gap-4">
          <NuxtLink to="/vendors" class="bg-white text-indigo-900 font-bold px-6 py-3 rounded-xl shadow-lg hover:bg-indigo-50 transition transform hover:-translate-y-0.5">
            Explorer les boutiques
          </NuxtLink>
          <NuxtLink to="/login" class="bg-indigo-600/80 hover:bg-indigo-600 text-white font-bold px-6 py-3 rounded-xl backdrop-blur border border-indigo-400/30 transition">
            Devenir Vendeur
          </NuxtLink>
        </div>
      </div>
    </div>

    <!-- Featured Vendors -->
    <section class="mb-12">
      <div class="flex justify-between items-end mb-6">
        <div>
          <h2 class="text-2xl font-extrabold text-slate-800">Vendeurs Partenaires</h2>
          <p class="text-slate-500 text-sm">Découvrez nos commerçants à la une</p>
        </div>
        <NuxtLink to="/vendors" class="text-indigo-600 font-semibold text-sm hover:underline">Voir tout →</NuxtLink>
      </div>

      <div v-if="loadingVendors" class="text-center py-8 text-slate-500">Chargement des vendeurs...</div>
      <div v-else-if="vendors.length === 0" class="p-6 bg-white rounded-xl border text-center text-slate-500">
        Aucun vendeur enregistré pour le moment.
      </div>
      <div v-else class="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div v-for="vendor in vendors" :key="vendor.id" class="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm hover:shadow-md transition">
          <div class="flex items-center space-x-4 mb-4">
            <img :src="vendor.logo_url || 'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5'" class="w-14 h-14 rounded-xl object-cover border" alt="Logo" />
            <div>
              <h3 class="font-bold text-lg text-slate-900">{{ vendor.company_name }}</h3>
              <span class="inline-block bg-emerald-100 text-emerald-800 text-xs px-2 py-0.5 rounded-md font-medium">Vendeur Vérifié</span>
            </div>
          </div>
          <p class="text-slate-600 text-sm line-clamp-2 mb-4">{{ vendor.description || 'Boutique partenaire certifiée.' }}</p>
          <NuxtLink :to="`/vendors/${vendor.slug}`" class="block text-center bg-slate-100 hover:bg-indigo-50 text-indigo-700 font-semibold py-2 rounded-lg text-sm transition">
            Visiter la boutique
          </NuxtLink>
        </div>
      </div>
    </section>

    <!-- Marketplace Products Catalog -->
    <section>
      <div class="mb-6">
        <h2 class="text-2xl font-extrabold text-slate-800">Catalogue Multi-Vendeurs</h2>
        <p class="text-slate-500 text-sm">Produits en vente issus de nos boutiques partenaires</p>
      </div>

      <div v-if="loadingProducts" class="text-center py-8 text-slate-500">Chargement des produits...</div>
      <div v-else-if="products.length === 0" class="p-6 bg-white rounded-xl border text-center text-slate-500">
        Aucun produit disponible dans le catalogue.
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
              <span class="text-emerald-600 font-medium">Expédié sous 24h</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';

const vendors = ref([]);
const products = ref([]);
const loadingVendors = ref(true);
const loadingProducts = ref(true);

const API_BASE = 'http://localhost:4000/api';

onMounted(async () => {
  try {
    const vRes = await fetch(`${API_BASE}/vendors`);
    if (vRes.ok) {
      vendors.value = await vRes.json();
    }
  } catch (e) {
    console.error(e);
  } finally {
    loadingVendors.value = false;
  }

  try {
    const pRes = await fetch(`${API_BASE}/products`);
    if (pRes.ok) {
      products.value = await pRes.json();
    }
  } catch (e) {
    console.error(e);
  } finally {
    loadingProducts.value = false;
  }
});
</script>
