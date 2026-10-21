<template>
  <div>
    <div class="flex justify-between items-center mb-6">
      <h1 class="text-3xl font-bold text-slate-800">Gestion & Suivi des Commandes</h1>
      <button @click="fetchOrders" class="bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold px-3 py-2 rounded-xl transition">
        Actualiser
      </button>
    </div>

    <div class="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
      <div v-if="loading" class="p-6 text-slate-500 text-center">Chargement des commandes...</div>
      <table v-else class="w-full text-left border-collapse">
        <thead class="bg-slate-50 border-b border-slate-200 text-xs font-semibold uppercase text-slate-500">
          <tr>
            <th class="p-4">N° Commande</th>
            <th class="p-4">Client</th>
            <th class="p-4">Adresse</th>
            <th class="p-4">Montant Total</th>
            <th class="p-4">Statut</th>
            <th class="p-4 text-right">Changer Statut</th>
          </tr>
        </thead>
        <tbody class="divide-y divide-slate-100 text-sm">
          <tr v-for="order in orders" :key="order.id || order.order_number" class="hover:bg-slate-50">
            <td class="p-4 font-mono font-bold text-indigo-600">{{ order.order_number }}</td>
            <td class="p-4 font-semibold text-slate-800">
              {{ order.customer_name }}
              <span class="block text-xs font-normal text-slate-500">{{ order.customer_email }}</span>
            </td>
            <td class="p-4 text-slate-600 text-xs max-w-xs truncate">{{ order.shipping_address }}</td>
            <td class="p-4 font-bold text-slate-900">{{ typeof order.total_amount === 'number' ? order.total_amount.toFixed(2) : order.total_amount }} DZD</td>
            <td class="p-4">
              <span :class="['px-3 py-1 text-xs font-bold rounded-full', statusBadge(order.status)]">
                {{ statusLabel(order.status) }}
              </span>
            </td>
            <td class="p-4 text-right">
              <select
                :value="order.status"
                @change="changeStatus(order, $event.target.value)"
                class="bg-slate-100 border border-slate-300 rounded-lg text-xs font-semibold p-1.5 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="PENDING">En attente</option>
                <option value="PAID">Payée</option>
                <option value="SHIPPED">Expédiée</option>
                <option value="DELIVERED">Livrée</option>
                <option value="CANCELLED">Annulée</option>
              </select>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';

const defaultOrders = [
  { id: 1, order_number: 'CMD-173500-101', customer_name: 'John Doe', customer_email: 'customer@webmanager.local', shipping_address: 'Alger Centre, Alger', total_amount: 999.99, status: 'PAID' },
  { id: 2, order_number: 'CMD-173500-102', customer_name: 'Alice Smith', customer_email: 'alice@example.com', shipping_address: 'Oran Ville, Oran', total_amount: 229.98, status: 'SHIPPED' },
];

const orders = ref([]);
const loading = ref(true);

function statusBadge(status) {
  switch (status) {
    case 'PAID': return 'bg-emerald-100 text-emerald-800';
    case 'SHIPPED': return 'bg-blue-100 text-blue-800';
    case 'DELIVERED': return 'bg-purple-100 text-purple-800';
    case 'CANCELLED': return 'bg-red-100 text-red-800';
    default: return 'bg-amber-100 text-amber-800';
  }
}

function statusLabel(status) {
  switch (status) {
    case 'PAID': return 'Payée';
    case 'SHIPPED': return 'Expédiée';
    case 'DELIVERED': return 'Livrée';
    case 'CANCELLED': return 'Annulée';
    default: return 'En attente';
  }
}

async function fetchOrders() {
  loading.value = true;
  const token = typeof localStorage !== 'undefined' ? localStorage.getItem('admin_token') : null;
  try {
    const res = await fetch('http://localhost:4000/api/orders', {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });
    if (res.ok) {
      const data = await res.json();
      orders.value = data.length > 0 ? data : defaultOrders;
    } else {
      orders.value = defaultOrders;
    }
  } catch (err) {
    orders.value = defaultOrders;
  } finally {
    loading.value = false;
  }
}

async function changeStatus(order, newStatus) {
  const token = typeof localStorage !== 'undefined' ? localStorage.getItem('admin_token') : null;
  order.status = newStatus;

  try {
    if (order.id) {
      await fetch(`http://localhost:4000/api/orders/${order.id}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ status: newStatus }),
      });
    }
  } catch (err) {
    console.error('Failed to change order status:', err);
  }
}

onMounted(() => {
  fetchOrders();
});
</script>
