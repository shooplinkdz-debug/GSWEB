<template>
  <div class="space-y-6">
    <div class="flex justify-between items-center bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
      <div>
        <h1 class="text-2xl font-black text-slate-900">Suivi Financier & Solde Vendeurs</h1>
        <p class="text-sm text-slate-500">Journal des bénéfices, dépenses et crédits signés (Solde = Bénéfices validés - Dépenses validées).</p>
      </div>
    </div>

    <!-- Manual Movement Form -->
    <div class="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 space-y-4">
      <h2 class="text-lg font-bold text-slate-900">Saisir un Mouvement ou Crédit Signé</h2>
      <form @submit.prevent="submitMovement" class="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div>
          <label class="block text-xs font-bold text-slate-700 mb-1">ID Boutique Vendeur</label>
          <input v-model.number="newMovement.vendorId" type="number" required placeholder="Ex: 1" class="w-full border rounded-xl p-2.5 text-sm" />
        </div>
        <div>
          <label class="block text-xs font-bold text-slate-700 mb-1">Montant (DZD)</label>
          <input v-model.number="newMovement.amount" type="number" step="0.01" required placeholder="Positif (+) ou Négatif (-)" class="w-full border rounded-xl p-2.5 text-sm" />
        </div>
        <div>
          <label class="block text-xs font-bold text-slate-700 mb-1">Description / Motif</label>
          <input v-model="newMovement.description" type="text" required placeholder="Ex: Virement régularisation" class="w-full border rounded-xl p-2.5 text-sm" />
        </div>
        <div class="flex items-end">
          <button type="submit" class="w-full bg-emerald-700 hover:bg-emerald-800 text-white font-bold p-2.5 rounded-xl text-sm transition">
            Enregistrer Mouvement
          </button>
        </div>
      </form>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue';

const apiBase = 'http://localhost:4000/api';
const newMovement = ref({
  vendorId: 1,
  amount: 0,
  description: '',
});

async function submitMovement() {
  if (!newMovement.value.vendorId || !newMovement.value.description) return;

  try {
    const token = localStorage.getItem('token');
    const res = await fetch(`${apiBase}/finances/movements`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(newMovement.value),
    });

    if (res.ok) {
      alert("Mouvement financier enregistré avec succès !");
      newMovement.value.description = '';
      newMovement.value.amount = 0;
    } else {
      const err = await res.json();
      alert(err.error || "Erreur lors de l'enregistrement.");
    }
  } catch (err) {
    alert("Erreur réseau.");
  }
}
</script>
