<template>
  <div>
    <div class="flex justify-between items-center mb-6">
      <h1 class="text-3xl font-bold text-slate-800">Gestion du Catalogue & Contrôle des Stocks</h1>
      <button @click="showModal = true" class="bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold px-4 py-2 rounded-xl transition">
        + Nouveau Produit
      </button>
    </div>

    <!-- Product List Table -->
    <div class="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
      <div v-if="loading" class="p-6 text-slate-500 text-center">Chargement des produits du catalogue...</div>
      <table v-else class="w-full text-left border-collapse">
        <thead class="bg-slate-50 border-b border-slate-200 text-xs font-semibold uppercase text-slate-500">
          <tr>
            <th class="p-4">SKU</th>
            <th class="p-4">Produit</th>
            <th class="p-4">Catégorie</th>
            <th class="p-4">Prix</th>
            <th class="p-4">Stock</th>
            <th class="p-4">Statut</th>
            <th class="p-4 text-right">Ajuster Stock</th>
          </tr>
        </thead>
        <tbody class="divide-y divide-slate-100 text-sm">
          <tr v-for="p in products" :key="p.id || p.sku" class="hover:bg-slate-50">
            <td class="p-4 font-mono text-indigo-600 font-bold">{{ p.sku }}</td>
            <td class="p-4 font-bold text-slate-800">{{ p.name }}</td>
            <td class="p-4 text-slate-500">{{ p.category_name || 'Général' }}</td>
            <td class="p-4 font-semibold">{{ typeof p.price === 'number' ? p.price.toFixed(2) + ' DZD' : p.price }}</td>
            <td class="p-4 font-bold">{{ p.stock }}</td>
            <td class="p-4">
              <span v-if="p.stock <= (p.low_stock_threshold !== undefined ? p.low_stock_threshold : 5)" class="px-3 py-1 text-xs font-bold bg-amber-100 text-amber-800 rounded-full">
                Stock Bas (≤ {{ p.low_stock_threshold || 5 }})
              </span>
              <span v-else class="px-3 py-1 text-xs font-bold bg-emerald-100 text-emerald-800 rounded-full">
                En Stock
              </span>
            </td>
            <td class="p-4 text-right">
              <div class="inline-flex items-center space-x-1">
                <button @click="updateStock(p, p.stock - 1)" class="w-8 h-8 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-sm flex items-center justify-center border">
                  -
                </button>
                <span class="w-10 text-center font-bold text-xs">{{ p.stock }}</span>
                <button @click="updateStock(p, p.stock + 1)" class="w-8 h-8 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-sm flex items-center justify-center border">
                  +
                </button>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Create Product Modal -->
    <div v-if="showModal" class="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div class="bg-white rounded-2xl p-6 max-w-lg w-full shadow-2xl border">
        <h2 class="text-xl font-bold text-slate-800 mb-4">Créer un nouveau produit</h2>
        <form @submit.prevent="createProduct" class="space-y-4">
          <div class="grid grid-cols-2 gap-4">
            <div>
              <label class="block text-xs font-bold uppercase text-slate-600 mb-1">SKU</label>
              <input v-model="form.sku" required class="w-full border p-2 rounded-lg text-sm" placeholder="EX: ELEC-003" />
            </div>
            <div>
              <label class="block text-xs font-bold uppercase text-slate-600 mb-1">Nom</label>
              <input v-model="form.name" required class="w-full border p-2 rounded-lg text-sm" placeholder="Nom du produit" />
            </div>
          </div>
          <div class="grid grid-cols-2 gap-4">
            <div>
              <label class="block text-xs font-bold uppercase text-slate-600 mb-1">Slug</label>
              <input v-model="form.slug" required class="w-full border p-2 rounded-lg text-sm" placeholder="nom-du-produit" />
            </div>
            <div>
              <label class="block text-xs font-bold uppercase text-slate-600 mb-1">Prix (DZD)</label>
              <input v-model.number="form.price" type="number" step="0.01" required class="w-full border p-2 rounded-lg text-sm" placeholder="1000" />
            </div>
          </div>
          <div class="grid grid-cols-2 gap-4">
            <div>
              <label class="block text-xs font-bold uppercase text-slate-600 mb-1">Stock Initial</label>
              <input v-model.number="form.stock" type="number" required class="w-full border p-2 rounded-lg text-sm" placeholder="10" />
            </div>
            <div>
              <label class="block text-xs font-bold uppercase text-slate-600 mb-1">Seuil Alerte Stock</label>
              <input v-model.number="form.low_stock_threshold" type="number" required class="w-full border p-2 rounded-lg text-sm" placeholder="5" />
            </div>
          </div>
          <div>
            <label class="block text-xs font-bold uppercase text-slate-600 mb-1">Description</label>
            <textarea v-model="form.description" rows="2" class="w-full border p-2 rounded-lg text-sm" placeholder="Description..."></textarea>
          </div>
          <div class="flex justify-end space-x-3 pt-2">
            <button type="button" @click="showModal = false" class="px-4 py-2 bg-slate-100 text-slate-700 text-sm font-semibold rounded-lg">Annuler</button>
            <button type="submit" class="px-4 py-2 bg-indigo-600 text-white text-sm font-semibold rounded-lg shadow hover:bg-indigo-700">Enregistrer</button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';

const defaultProducts = [
  { id: 1, sku: 'ELEC-001', name: 'Smartphone Pro Max', price: 999.99, stock: 15, low_stock_threshold: 3 },
  { id: 2, sku: 'ELEC-002', name: 'Casque Audio Sans Fil', price: 199.99, stock: 4, low_stock_threshold: 5 },
  { id: 3, sku: 'VET-001', name: 'T-shirt Coton Bio', price: 29.99, stock: 50, low_stock_threshold: 10 },
];

const products = ref([]);
const loading = ref(true);
const showModal = ref(false);

const form = ref({
  sku: '',
  name: '',
  slug: '',
  price: 0,
  stock: 10,
  low_stock_threshold: 5,
  description: '',
});

async function fetchProducts() {
  try {
    const res = await fetch('http://localhost:4000/api/products');
    if (res.ok) {
      const data = await res.json();
      products.value = data.length > 0 ? data : defaultProducts;
    } else {
      products.value = defaultProducts;
    }
  } catch (err) {
    products.value = defaultProducts;
  } finally {
    loading.value = false;
  }
}

async function updateStock(product, newStock) {
  if (newStock < 0) return;
  const token = typeof localStorage !== 'undefined' ? localStorage.getItem('admin_token') : null;
  product.stock = newStock;

  try {
    if (product.id) {
      await fetch(`http://localhost:4000/api/products/${product.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ ...product, stock: newStock }),
      });
    }
  } catch (err) {
    console.error('Failed to update stock:', err);
  }
}

async function createProduct() {
  const token = typeof localStorage !== 'undefined' ? localStorage.getItem('admin_token') : null;
  try {
    const res = await fetch('http://localhost:4000/api/products', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify(form.value),
    });

    if (res.ok) {
      showModal.value = false;
      form.value = { sku: '', name: '', slug: '', price: 0, stock: 10, low_stock_threshold: 5, description: '' };
      await fetchProducts();
    }
  } catch (err) {
    console.error('Failed to create product:', err);
  }
}

onMounted(() => {
  fetchProducts();
});
</script>
