<template>
  <div class="space-y-6">
    <div class="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
      <h1 class="text-2xl font-black text-slate-900">Modération des Avis & Commentaires</h1>
      <p class="text-sm text-slate-500">Validez, masquez ou examinez les notes et retours d'expérience clients.</p>
    </div>

    <div class="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
      <div class="space-y-4">
        <div v-for="review in reviews" :key="review.id" class="border p-4 rounded-xl space-y-2">
          <div class="flex justify-between items-center">
            <div class="flex items-center space-x-2 rtl:space-x-reverse">
              <span class="text-amber-500 font-bold">★ {{ review.rating }}/5</span>
              <span class="font-bold text-slate-900 text-sm">{{ review.product_name }}</span>
            </div>
            <span :class="review.status === 'APPROVED' ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'" class="text-xs font-bold px-2 py-0.5 rounded">
              {{ review.status }}
            </span>
          </div>
          <p class="text-xs text-slate-700">{{ review.comment || 'Sans commentaire écrit.' }}</p>
          <div class="text-[10px] text-slate-400">Auteur : {{ review.user_email || 'Client' }} — Achat vérifié : {{ review.is_verified_purchase ? 'OUI' : 'NON' }}</div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';

const reviews = ref([]);
const apiBase = 'http://localhost:4000/api';

async function loadReviews() {
  const token = localStorage.getItem('token');
  const res = await fetch(`${apiBase}/reviews/admin/all`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (res.ok) reviews.value = await res.json();
}

onMounted(() => {
  loadReviews();
});
</script>
