<template>
  <div>
    <h1 class="text-3xl font-bold mb-6 text-slate-800">Assistant IA Intégré</h1>

    <div class="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 mb-6">
      <label class="block text-sm font-semibold mb-2">Prompt / Demande à l'IA</label>
      <input v-model="prompt" type="text" placeholder="Ex: Rédaction de la fiche produit du nouveau Casque Pro..." class="w-full px-4 py-2 border rounded-lg mb-4 focus:ring-2 focus:ring-indigo-500 outline-none" />

      <button @click="generate" class="bg-indigo-600 hover:bg-indigo-700 text-white font-bold px-6 py-2 rounded-lg transition">
        Générer la suggestion IA
      </button>
    </div>

    <div v-if="response" class="bg-indigo-50 p-6 rounded-2xl border border-indigo-200">
      <h2 class="text-lg font-bold text-indigo-900 mb-2">Résultat IA</h2>
      <p class="text-slate-800 whitespace-pre-line">{{ response }}</p>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue';

const prompt = ref('');
const response = ref('');

const generate = () => {
  if (!prompt.value) return;
  response.value = `Description optimisée pour : "${prompt.value}"\n\nCe produit offre une performance d'exception, un design épuré et une ergonomie conçue pour durer dans le temps.`;
};
</script>
