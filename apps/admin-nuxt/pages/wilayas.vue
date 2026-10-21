<template>
  <div>
    <div class="flex justify-between items-center mb-6">
      <div>
        <h1 class="text-3xl font-bold text-slate-800">Paramétrage des Tarifs de Livraison (58 Wilayas)</h1>
        <p class="text-slate-500 text-sm">Ajustez les frais de livraison à domicile et en bureau de poste pour chaque Wilaya.</p>
      </div>
      <input
        v-model="search"
        type="text"
        placeholder="Rechercher une Wilaya..."
        class="bg-white border border-slate-300 rounded-xl px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 shadow-sm"
      />
    </div>

    <div class="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
      <div v-if="loading" class="p-6 text-slate-500 text-center">Chargement des tarifs par Wilaya...</div>
      <table v-else class="w-full text-left border-collapse">
        <thead class="bg-slate-50 border-b border-slate-200 text-xs font-semibold uppercase text-slate-500">
          <tr>
            <th class="p-4">Code</th>
            <th class="p-4">Wilaya</th>
            <th class="p-4">Nom Arabe</th>
            <th class="p-4">Livraison Domicile (DZD)</th>
            <th class="p-4">Livraison Bureau (DZD)</th>
            <th class="p-4 text-right">Mettre à jour</th>
          </tr>
        </thead>
        <tbody class="divide-y divide-slate-100 text-sm">
          <tr v-for="w in filteredRates" :key="w.id || w.wilaya_code" class="hover:bg-slate-50">
            <td class="p-4 font-mono font-bold text-indigo-600">{{ String(w.wilaya_code).padStart(2, '0') }}</td>
            <td class="p-4 font-bold text-slate-800">{{ w.wilaya_name }}</td>
            <td class="p-4 font-arabic text-slate-600 text-base" dir="rtl">{{ w.wilaya_name_ar }}</td>
            <td class="p-4">
              <input
                v-model.number="w.home_fee"
                type="number"
                step="10"
                class="w-28 border border-slate-300 rounded-lg p-1.5 text-xs font-bold focus:ring-2 focus:ring-indigo-500"
              />
            </td>
            <td class="p-4">
              <input
                v-model.number="w.desk_fee"
                type="number"
                step="10"
                class="w-28 border border-slate-300 rounded-lg p-1.5 text-xs font-bold focus:ring-2 focus:ring-indigo-500"
              />
            </td>
            <td class="p-4 text-right">
              <button
                @click="saveRate(w)"
                class="bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold px-3 py-1.5 rounded-lg transition"
              >
                Enregistrer
              </button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';

const defaultRates = [
  { id: 1, wilaya_code: 16, wilaya_name: 'Alger', wilaya_name_ar: 'الجزائر', home_fee: 400, desk_fee: 250 },
  { id: 2, wilaya_code: 31, wilaya_name: 'Oran', wilaya_name_ar: 'وهران', home_fee: 600, desk_fee: 400 },
  { id: 3, wilaya_code: 25, wilaya_name: 'Constantine', wilaya_name_ar: 'قسنطينة', home_fee: 600, desk_fee: 400 },
];

const rates = ref([]);
const loading = ref(true);
const search = ref('');

const filteredRates = computed(() => {
  if (!search.value) return rates.value;
  const query = search.value.toLowerCase();
  return rates.value.filter(
    (w) =>
      w.wilaya_name.toLowerCase().includes(query) ||
      String(w.wilaya_code).includes(query) ||
      (w.wilaya_name_ar && w.wilaya_name_ar.includes(query))
  );
});

async function fetchRates() {
  loading.value = true;
  const token = typeof localStorage !== 'undefined' ? localStorage.getItem('admin_token') : null;
  try {
    const res = await fetch('http://localhost:4000/api/admin/delivery-rates', {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });
    if (res.ok) {
      const data = await res.json();
      rates.value = data.length > 0 ? data : defaultRates;
    } else {
      rates.value = defaultRates;
    }
  } catch (err) {
    rates.value = defaultRates;
  } finally {
    loading.value = false;
  }
}

async function saveRate(rate) {
  const token = typeof localStorage !== 'undefined' ? localStorage.getItem('admin_token') : null;
  try {
    if (rate.id) {
      await fetch(`http://localhost:4000/api/admin/delivery-rates/${rate.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          home_fee: rate.home_fee,
          desk_fee: rate.desk_fee,
        }),
      });
    }
  } catch (err) {
    console.error('Failed to save delivery rate:', err);
  }
}

onMounted(() => {
  fetchRates();
});
</script>
