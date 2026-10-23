<template>
  <div class="space-y-8">
    <div class="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
      <div>
        <h1 class="text-2xl font-black text-slate-900">Espace Opérationnel Vendeur / Confirmateur</h1>
        <p class="text-slate-500 text-xs">Accès adapté selon vos permissions (Vendeur, Confirmateur, Manager, Développeur).</p>
      </div>
      <div class="flex items-center space-x-3 rtl:space-x-reverse">
        <span class="bg-indigo-100 text-indigo-800 text-xs font-black px-3 py-1 rounded-xl uppercase">Rôle : {{ userRole }}</span>
        <button @click="logout" class="bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold px-4 py-2 rounded-xl text-xs transition">
          Déconnexion
        </button>
      </div>
    </div>

    <!-- Confirmateur Orders Management View -->
    <div v-if="userRole === 'CONFIRMATEUR' || userRole === 'ADMIN' || userRole === 'MANAGER'" class="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-4">
      <div class="flex justify-between items-center">
        <h2 class="text-lg font-bold text-slate-900">Commandes à Traiter & Confirmation Téléphonique</h2>
        <span class="text-xs text-slate-400 font-mono">{{ orders.length }} commande(s)</span>
      </div>

      <div class="overflow-x-auto">
        <table class="w-full text-left border-collapse text-sm">
          <thead>
            <tr class="bg-slate-50 text-slate-600 border-b border-slate-200 text-xs">
              <th class="p-3">N° Commande</th>
              <th class="p-3">Client</th>
              <th class="p-3">Téléphone</th>
              <th class="p-3">Wilaya & Adresse</th>
              <th class="p-3">Total (DZD)</th>
              <th class="p-3">Statut</th>
              <th class="p-3">Action Confirmation</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="o in orders" :key="o.id" class="border-b border-slate-100 hover:bg-slate-50">
              <td class="p-3 font-mono font-bold text-indigo-600">#{{ o.order_number }}</td>
              <td class="p-3 font-medium">{{ o.customer_name }}</td>
              <td class="p-3 font-mono text-xs">{{ o.customer_phone || 'Non spécifié' }}</td>
              <td class="p-3 text-xs max-w-xs truncate">{{ o.shipping_address }}</td>
              <td class="p-3 font-bold text-slate-900">{{ Number(o.total_amount).toFixed(2) }} DZD</td>
              <td class="p-3">
                <span :class="getStatusBadgeClass(o.status)" class="text-xs font-bold px-2 py-0.5 rounded-lg">
                  {{ o.status }}
                </span>
              </td>
              <td class="p-3 space-x-2">
                <button @click="updateOrderStatus(o, 'CONFIRMED')" class="bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs px-2.5 py-1 rounded-lg transition">
                  Confirmée
                </button>
                <button @click="updateOrderStatus(o, 'CANCELLED')" class="bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs px-2.5 py-1 rounded-lg transition">
                  Annulée
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Financial Ledger & Net Balance View for Vendor -->
    <div v-if="userRole === 'SELLER' || userRole === 'VENDOR' || userRole === 'ADMIN'" class="grid grid-cols-1 md:grid-cols-3 gap-6">
      <div class="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-2">
        <span class="text-xs font-bold text-slate-400 uppercase">Total Bénéfices Validés</span>
        <p class="text-2xl font-black text-emerald-600">{{ balance.totalBenefits.toFixed(2) }} DZD</p>
      </div>
      <div class="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-2">
        <span class="text-xs font-bold text-slate-400 uppercase">Total Dépenses Validées</span>
        <p class="text-2xl font-black text-rose-600">{{ balance.totalExpenses.toFixed(2) }} DZD</p>
      </div>
      <div class="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-2 bg-gradient-to-br from-slate-900 to-indigo-950 text-white">
        <span class="text-xs font-bold text-indigo-300 uppercase">Solde Comptable Net</span>
        <p class="text-3xl font-black text-amber-400">{{ balance.solde.toFixed(2) }} DZD</p>
      </div>
    </div>

    <!-- AI Helper in Product Creator -->
    <div v-if="userRole === 'SELLER' || userRole === 'VENDOR'" class="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
      <h2 class="text-lg font-bold text-slate-900">Assistant IA — Générateur de Description Produit</h2>
      <div class="flex space-x-2 rtl:space-x-reverse">
        <input v-model="aiPrompt" type="text" placeholder="Entrez le nom ou l'idée du produit (ex: Parfum Oud Rose)" class="flex-1 border p-2.5 rounded-xl text-sm" />
        <button @click="generateAiDescription" class="bg-indigo-600 hover:bg-indigo-700 text-white font-bold px-4 py-2.5 rounded-xl text-sm transition">
          Générer avec IA
        </button>
      </div>
      <textarea v-if="aiResult" v-model="aiResult" rows="3" class="w-full border p-3 rounded-xl text-sm bg-slate-50 font-sans"></textarea>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';

const router = useRouter();
const userRole = ref('VENDOR');
const orders = ref([]);
const balance = ref({ totalBenefits: 0, totalExpenses: 0, solde: 0 });
const aiPrompt = ref('');
const aiResult = ref('');

const API_BASE = 'http://localhost:4000/api';

async function loadData() {
  const token = localStorage.getItem('vendor_token') || localStorage.getItem('token');
  if (!token) return;

  try {
    const userRes = await fetch(`${API_BASE}/auth/me`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (userRes.ok) {
      const u = await userRes.json();
      userRole.value = u.role;
    }

    const ordersRes = await fetch(`${API_BASE}/orders`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (ordersRes.ok) orders.value = await ordersRes.json();

    const balRes = await fetch(`${API_BASE}/finances/balance`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (balRes.ok) balance.value = await balRes.json();
  } catch (err) {
    console.error(err);
  }
}

async function updateOrderStatus(order, status) {
  const token = localStorage.getItem('vendor_token') || localStorage.getItem('token');
  try {
    const res = await fetch(`${API_BASE}/orders/${order.id}/status`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ status }),
    });
    if (res.ok) loadData();
  } catch (err) {
    console.error(err);
  }
}

async function generateAiDescription() {
  if (!aiPrompt.value) return;
  const token = localStorage.getItem('vendor_token') || localStorage.getItem('token');
  try {
    const res = await fetch(`${API_BASE}/ai/assistant`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ prompt: aiPrompt.value, type: 'product_description' }),
    });
    if (res.ok) {
      const data = await res.json();
      aiResult.value = data.response;
    }
  } catch (err) {
    console.error(err);
  }
}

function getStatusBadgeClass(s) {
  if (s === 'CONFIRMED' || s === 'DELIVERED') return 'bg-emerald-100 text-emerald-800';
  if (s === 'CANCELLED') return 'bg-rose-100 text-rose-800';
  return 'bg-amber-100 text-amber-800';
}

function logout() {
  localStorage.removeItem('vendor_token');
  localStorage.removeItem('token');
  router.push('/login');
}

onMounted(() => {
  loadData();
});
</script>
