<template>
  <div>
    <div class="flex justify-between items-center mb-8">
      <div>
        <h1 class="text-3xl font-black text-slate-900">Espace Tableau de Bord Vendeur</h1>
        <p class="text-slate-500 text-sm">Gérez vos produits, votre stock et suivez vos ventes en temps réel.</p>
      </div>
      <button @click="logout" class="bg-slate-200 hover:bg-slate-300 text-slate-700 font-semibold px-4 py-2 rounded-lg text-sm transition">
        Déconnexion
      </button>
    </div>

    <div v-if="loading" class="text-center py-12 text-slate-500">Chargement de votre tableau de bord...</div>
    <div v-else-if="!isLoggedIn" class="p-8 bg-amber-50 border border-amber-200 text-amber-800 rounded-2xl text-center">
      Veuillez vous <NuxtLink to="/login" class="underline font-bold">connecter</NuxtLink> pour accéder à votre espace vendeur.
    </div>
    <div v-else class="space-y-8">
      <!-- KPI Stats Bar -->
      <div class="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div class="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
          <span class="text-xs font-bold text-slate-400 uppercase">Produits au catalogue</span>
          <p class="text-3xl font-black text-slate-900 mt-2">{{ stats.totalProducts || 0 }}</p>
        </div>
        <div class="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
          <span class="text-xs font-bold text-slate-400 uppercase">Alertes Stock Bas</span>
          <p class="text-3xl font-black text-amber-600 mt-2">{{ stats.lowStockProducts || 0 }}</p>
        </div>
        <div class="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
          <span class="text-xs font-bold text-slate-400 uppercase">Commandes Effectuées</span>
          <p class="text-3xl font-black text-indigo-600 mt-2">{{ stats.totalOrders || 0 }}</p>
        </div>
        <div class="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
          <span class="text-xs font-bold text-slate-400 uppercase">Chiffre d'Affaires</span>
          <p class="text-3xl font-black text-emerald-600 mt-2">{{ (stats.totalRevenue || 0).toFixed(2) }} €</p>
        </div>
      </div>

      <!-- Add Product Form -->
      <div class="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm">
        <h2 class="text-xl font-bold text-slate-800 mb-4">Ajouter un nouveau produit à votre boutique</h2>
        <form @submit.prevent="createProduct" class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label class="block text-xs font-bold text-slate-700 uppercase mb-1">SKU</label>
            <input v-model="newProduct.sku" type="text" required placeholder="EX: VEND-001" class="w-full px-3 py-2 border rounded-lg text-sm" />
          </div>
          <div>
            <label class="block text-xs font-bold text-slate-700 uppercase mb-1">Nom du produit</label>
            <input v-model="newProduct.name" type="text" required placeholder="Nom du produit" class="w-full px-3 py-2 border rounded-lg text-sm" />
          </div>
          <div>
            <label class="block text-xs font-bold text-slate-700 uppercase mb-1">Identifiant URL (Slug)</label>
            <input v-model="newProduct.slug" type="text" required placeholder="nom-du-produit" class="w-full px-3 py-2 border rounded-lg text-sm" />
          </div>
          <div>
            <label class="block text-xs font-bold text-slate-700 uppercase mb-1">Prix (€)</label>
            <input v-model.number="newProduct.price" type="number" step="0.01" required placeholder="49.99" class="w-full px-3 py-2 border rounded-lg text-sm" />
          </div>
          <div>
            <label class="block text-xs font-bold text-slate-700 uppercase mb-1">Quantité en Stock</label>
            <input v-model.number="newProduct.stock" type="number" required placeholder="20" class="w-full px-3 py-2 border rounded-lg text-sm" />
          </div>
          <div>
            <label class="block text-xs font-bold text-slate-700 uppercase mb-1">Image URL</label>
            <input v-model="newProduct.image_url" type="text" placeholder="https://..." class="w-full px-3 py-2 border rounded-lg text-sm" />
          </div>
          <div class="md:col-span-2">
            <label class="block text-xs font-bold text-slate-700 uppercase mb-1">Description</label>
            <textarea v-model="newProduct.description" rows="2" placeholder="Description du produit..." class="w-full px-3 py-2 border rounded-lg text-sm"></textarea>
          </div>
          <div class="md:col-span-2 flex justify-end">
            <button type="submit" class="bg-indigo-600 hover:bg-indigo-700 text-white font-bold px-6 py-2.5 rounded-xl transition shadow">
              Mettre en vente
            </button>
          </div>
        </form>
      </div>

      <!-- Vendor Product List Table -->
      <div class="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
        <div class="p-6 border-b">
          <h2 class="text-xl font-bold text-slate-800">Vos produits en vente</h2>
        </div>
        <div class="overflow-x-auto">
          <table class="w-full text-left text-sm">
            <thead class="bg-slate-50 text-slate-500 uppercase text-xs">
              <tr>
                <th class="p-4">SKU</th>
                <th class="p-4">Nom</th>
                <th class="p-4">Prix</th>
                <th class="p-4">Stock</th>
                <th class="p-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-100">
              <tr v-for="p in products" :key="p.id" class="hover:bg-slate-50">
                <td class="p-4 font-mono font-bold text-indigo-600">{{ p.sku }}</td>
                <td class="p-4 font-semibold text-slate-800">{{ p.name }}</td>
                <td class="p-4 font-bold text-slate-900">{{ p.price }} €</td>
                <td class="p-4">
                  <span :class="['px-2.5 py-1 rounded-full text-xs font-bold', p.stock <= p.low_stock_threshold ? 'bg-amber-100 text-amber-800' : 'bg-emerald-100 text-emerald-800']">
                    {{ p.stock }} unités
                  </span>
                </td>
                <td class="p-4 text-right">
                  <button @click="deleteProduct(p.id)" class="bg-red-50 hover:bg-red-100 text-red-600 px-3 py-1.5 rounded-lg text-xs font-semibold transition">
                    Supprimer
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';

const router = useRouter();
const isLoggedIn = ref(false);
const loading = ref(true);

const stats = ref({});
const products = ref([]);

const newProduct = ref({
  sku: '',
  name: '',
  slug: '',
  price: 0,
  stock: 10,
  image_url: '',
  description: '',
});

const API_BASE = 'http://localhost:4000/api';

async function loadData() {
  const token = localStorage.getItem('vendor_token');
  if (!token) {
    isLoggedIn.value = false;
    loading.value = false;
    return;
  }
  isLoggedIn.value = true;

  try {
    const statsRes = await fetch(`${API_BASE}/vendors/me/stats`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (statsRes.ok) {
      stats.value = await statsRes.json();
    }

    const prodRes = await fetch(`${API_BASE}/vendors/me/products`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (prodRes.ok) {
      products.value = await prodRes.json();
    }
  } catch (err) {
    console.error(err);
  } finally {
    loading.value = false;
  }
}

async function createProduct() {
  const token = localStorage.getItem('vendor_token');
  try {
    const res = await fetch(`${API_BASE}/vendors/me/products`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(newProduct.value),
    });

    if (res.ok) {
      newProduct.value = { sku: '', name: '', slug: '', price: 0, stock: 10, image_url: '', description: '' };
      await loadData();
    }
  } catch (err) {
    console.error(err);
  }
}

async function deleteProduct(id) {
  const token = localStorage.getItem('vendor_token');
  try {
    const res = await fetch(`${API_BASE}/vendors/me/products/${id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` },
    });
    if (res.ok) {
      await loadData();
    }
  } catch (err) {
    console.error(err);
  }
}

function logout() {
  localStorage.removeItem('vendor_token');
  localStorage.removeItem('vendor_user');
  router.push('/login');
}

onMounted(() => {
  loadData();
});
</script>
