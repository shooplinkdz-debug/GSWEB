<template>
  <div>
    <h1 class="text-3xl font-bold mb-6 text-slate-800">Gestion des Commandes</h1>
    <div class="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
      <table class="w-full text-left border-collapse">
        <thead class="bg-slate-50 border-b border-slate-200 text-xs font-semibold uppercase text-slate-500">
          <tr>
            <th class="p-4">N° Commande</th>
            <th class="p-4">Client</th>
            <th class="p-4">Montant</th>
            <th class="p-4">Statut</th>
          </tr>
        </thead>
        <tbody class="divide-y divide-slate-100 text-sm">
          <tr>
            <td class="p-4 font-mono font-bold text-indigo-600">CMD-173500-101</td>
            <td class="p-4">John Doe (customer@webmanager.local)</td>
            <td class="p-4 font-bold">999.99 €</td>
            <td class="p-4"><span class="px-3 py-1 text-xs font-bold bg-emerald-100 text-emerald-800 rounded-full">Payée</span></td>
          </tr>
          <tr>
            <td class="p-4 font-mono font-bold text-indigo-600">CMD-173500-102</td>
            <td class="p-4">Alice Smith (alice@example.com)</td>
            <td class="p-4 font-bold">229.98 €</td>
            <td class="p-4"><span class="px-3 py-1 text-xs font-bold bg-blue-100 text-blue-800 rounded-full">Expédiée</span></td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>
