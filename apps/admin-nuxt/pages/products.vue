<template>
  <div>
    <h1 class="text-3xl font-bold mb-6 text-slate-800">Gestion du Catalogue et des Stocks</h1>

    <div class="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
      <table class="w-full text-left border-collapse">
        <thead class="bg-slate-50 border-b border-slate-200 text-xs font-semibold uppercase text-slate-500">
          <tr>
            <th class="p-4">SKU</th>
            <th class="p-4">Nom</th>
            <th class="p-4">Prix</th>
            <th class="p-4">Stock</th>
            <th class="p-4">Statut Stock</th>
          </tr>
        </thead>
        <tbody class="divide-y divide-slate-100 text-sm">
          <tr v-for="p in products" :key="p.sku">
            <td class="p-4 font-mono text-slate-600">{{ p.sku }}</td>
            <td class="p-4 font-bold text-slate-800">{{ p.name }}</td>
            <td class="p-4">{{ p.price }}</td>
            <td class="p-4">{{ p.stock }}</td>
            <td class="p-4">
              <span v-if="p.stock <= p.lowThreshold" class="px-3 py-1 text-xs font-bold bg-amber-100 text-amber-800 rounded-full">Stock Bas</span>
              <span v-else class="px-3 py-1 text-xs font-bold bg-emerald-100 text-emerald-800 rounded-full">En Stock</span>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<script setup>
const products = [
  { sku: 'ELEC-001', name: 'Smartphone Pro Max', price: '999.99 €', stock: 15, lowThreshold: 3 },
  { sku: 'ELEC-002', name: 'Casque Audio Sans Fil', price: '199.99 €', stock: 4, lowThreshold: 5 },
  { sku: 'VET-001', name: 'T-shirt Coton Bio', price: '29.99 €', stock: 50, lowThreshold: 10 },
];
</script>
