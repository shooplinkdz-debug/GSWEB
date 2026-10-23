<template>
  <div class="space-y-6">
    <div class="flex justify-between items-center bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
      <div>
        <h1 class="text-2xl font-black text-slate-900">Gestion des Abonnements des Boutiques</h1>
        <p class="text-sm text-slate-500">Suivi des formules, dates d'échéance et notifications sans suppression de données.</p>
      </div>
    </div>

    <!-- Subscriptions Table -->
    <div class="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
      <div class="overflow-x-auto">
        <table class="w-full text-left border-collapse text-sm">
          <thead>
            <tr class="bg-slate-50 text-slate-600 border-b border-slate-200">
              <th class="p-3">Boutique</th>
              <th class="p-3">Formule</th>
              <th class="p-3">Date de Fin</th>
              <th class="p-3">Statut</th>
              <th class="p-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="sub in subscriptions" :key="sub.id" class="border-b border-slate-100 hover:bg-slate-50">
              <td class="p-3 font-bold text-slate-900">{{ sub.vendor_name || 'Boutique #' + sub.vendor_id }}</td>
              <td class="p-3">{{ sub.plan_name }}</td>
              <td class="p-3 text-xs font-mono">{{ new Date(sub.end_date).toLocaleDateString('fr-FR') }}</td>
              <td class="p-3">
                <span
                  :class="{
                    'bg-emerald-100 text-emerald-800': sub.status === 'ACTIVE',
                    'bg-amber-100 text-amber-800': sub.status === 'EXPIRING_SOON',
                    'bg-rose-100 text-rose-800': sub.status === 'EXPIRED',
                  }"
                  class="text-xs font-bold px-2.5 py-1 rounded-lg"
                >
                  {{ sub.status }}
                </span>
              </td>
              <td class="p-3">
                <button
                  @click="extendSubscription(sub)"
                  class="bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs px-3 py-1.5 rounded-lg transition"
                >
                  Prolonger
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';

const subscriptions = ref([]);
const apiBase = 'http://localhost:4000/api';

async function loadSubscriptions() {
  try {
    const token = localStorage.getItem('token');
    const res = await fetch(`${apiBase}/admin/subscriptions`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (res.ok) subscriptions.value = await res.json();
  } catch (err) {
    console.error('Error loading subscriptions:', err);
  }
}

async function extendSubscription(sub) {
  const days = prompt("Nombre de jours de prolongation :", "30");
  if (!days || isNaN(Number(days))) return;

  const currentEnd = new Date(sub.end_date);
  const newEnd = new Date(currentEnd.getTime() + Number(days) * 24 * 3600 * 1000);

  try {
    const token = localStorage.getItem('token');
    const res = await fetch(`${apiBase}/admin/subscriptions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        vendorId: sub.vendor_id,
        planName: sub.plan_name,
        endDate: newEnd.toISOString(),
      }),
    });

    if (res.ok) {
      loadSubscriptions();
    } else {
      alert("Erreur lors de la prolongation de l'abonnement.");
    }
  } catch (err) {
    alert("Erreur réseau.");
  }
}

onMounted(() => {
  loadSubscriptions();
});
</script>
