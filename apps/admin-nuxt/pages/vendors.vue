<template>
  <div>
    <div class="flex justify-between items-center mb-6">
      <div>
        <h1 class="text-3xl font-bold text-slate-800">Modération & Validation des Boutiques Vendeurs</h1>
        <p class="text-slate-500 text-sm">Gérez les demandes d'inscription et valideurs de boutiques multi-vendeurs.</p>
      </div>
      <button @click="fetchVendors" class="bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold px-4 py-2 rounded-xl transition shadow">
        Actualiser
      </button>
    </div>

    <!-- Vendor Table -->
    <div class="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
      <div v-if="loading" class="p-6 text-slate-500 text-center">Chargement des boutiques vendeurs...</div>
      <table v-else class="w-full text-left border-collapse">
        <thead class="bg-slate-50 border-b border-slate-200 text-xs font-semibold uppercase text-slate-500">
          <tr>
            <th class="p-4">Entreprise / Nom</th>
            <th class="p-4">Identifiant Slug</th>
            <th class="p-4">Compte Utilisateur</th>
            <th class="p-4">Statut</th>
            <th class="p-4 text-right">Actions de Validation</th>
          </tr>
        </thead>
        <tbody class="divide-y divide-slate-100 text-sm">
          <tr v-for="v in vendors" :key="v.id" class="hover:bg-slate-50">
            <td class="p-4 font-bold text-slate-800">
              {{ v.company_name }}
              <p class="text-xs font-normal text-slate-500 line-clamp-1">{{ v.description }}</p>
            </td>
            <td class="p-4 font-mono text-indigo-600 text-xs font-bold">{{ v.slug }}</td>
            <td class="p-4 text-slate-600 text-xs">{{ v.user_email || 'vendeur@webmanager.local' }}</td>
            <td class="p-4">
              <span :class="['px-3 py-1 text-xs font-bold rounded-full', statusBadge(v.status)]">
                {{ statusLabel(v.status) }}
              </span>
            </td>
            <td class="p-4 text-right space-x-2">
              <button
                v-if="v.status !== 'APPROVED'"
                @click="updateVendorStatus(v.id, 'APPROVED')"
                class="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold px-3 py-1.5 rounded-lg transition"
              >
                Approuver
              </button>
              <button
                v-if="v.status !== 'REJECTED'"
                @click="updateVendorStatus(v.id, 'REJECTED')"
                class="bg-red-600 hover:bg-red-700 text-white text-xs font-bold px-3 py-1.5 rounded-lg transition"
              >
                Rejeter
              </button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';

const defaultVendors = [
  { id: 1, company_name: 'TechStore Direct', slug: 'techstore-direct', description: 'High tech & accessoires', user_email: 'vendor@techstore.local', status: 'APPROVED' },
  { id: 2, company_name: 'Boutique DZ Mode', slug: 'dz-mode', description: 'Vêtements et prêt-à-porter', user_email: 'mode@dzmode.local', status: 'PENDING' },
];

const vendors = ref([]);
const loading = ref(true);

function statusBadge(status) {
  switch (status) {
    case 'APPROVED': return 'bg-emerald-100 text-emerald-800';
    case 'REJECTED': return 'bg-red-100 text-red-800';
    default: return 'bg-amber-100 text-amber-800';
  }
}

function statusLabel(status) {
  switch (status) {
    case 'APPROVED': return 'Approuvée';
    case 'REJECTED': return 'Refusée';
    default: return 'En attente';
  }
}

async function fetchVendors() {
  loading.value = true;
  const token = typeof localStorage !== 'undefined' ? localStorage.getItem('admin_token') : null;
  try {
    const res = await fetch('http://localhost:4000/api/admin/vendors', {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });
    if (res.ok) {
      const data = await res.json();
      vendors.value = data.length > 0 ? data : defaultVendors;
    } else {
      vendors.value = defaultVendors;
    }
  } catch (err) {
    vendors.value = defaultVendors;
  } finally {
    loading.value = false;
  }
}

async function updateVendorStatus(id, newStatus) {
  const token = typeof localStorage !== 'undefined' ? localStorage.getItem('admin_token') : null;
  try {
    const res = await fetch(`http://localhost:4000/api/admin/vendors/${id}/status`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify({ status: newStatus }),
    });
    if (res.ok) {
      await fetchVendors();
    }
  } catch (err) {
    console.error('Failed to update vendor status:', err);
  }
}

onMounted(() => {
  fetchVendors();
});
</script>
