<template>
  <div>
    <h1 class="text-3xl font-bold mb-6 text-slate-800">Gestion des Pages CMS</h1>
    <div class="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
      <p class="text-slate-600 mb-4">Créez et modifiez les contenus des pages publiques de la plateforme.</p>

      <div v-if="loading" class="text-slate-500 py-4">Chargement des pages CMS...</div>
      <div v-else-if="pages.length === 0" class="text-slate-500 py-4">Aucune page CMS trouvée.</div>
      <div v-else class="space-y-4">
        <div v-for="page in pages" :key="page.id || page.slug" class="p-4 border rounded-xl flex justify-between items-center">
          <div>
            <h3 class="font-bold text-slate-800">{{ page.title }}</h3>
            <p class="text-xs text-slate-500">Slug: /{{ page.slug }}</p>
            <p v-if="page.content" class="text-xs text-slate-600 mt-1 line-clamp-1">{{ page.content }}</p>
          </div>
          <span
            class="px-3 py-1 text-xs font-bold rounded-full"
            :class="page.is_published !== false ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-600'"
          >
            {{ page.is_published !== false ? 'Publié' : 'Brouillon' }}
          </span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';

const defaultPages = [
  { id: 1, title: 'À propos', slug: 'a-propos', content: 'Bienvenue sur Web Manager. Notre plateforme offre une solution complète pour la gestion e-commerce.', is_published: true },
  { id: 2, title: 'Mentions Légales', slug: 'mentions-legales', content: 'Éditeur du site : Web Manager Inc. Hébergement local et conteneurisé.', is_published: true },
];

const pages = ref([]);
const loading = ref(true);

onMounted(async () => {
  try {
    const res = await fetch('http://localhost:4000/api/pages');
    if (res.ok) {
      const data = await res.json();
      pages.value = data.length > 0 ? data : defaultPages;
    } else {
      pages.value = defaultPages;
    }
  } catch (err) {
    pages.value = defaultPages;
  } finally {
    loading.value = false;
  }
});
</script>
