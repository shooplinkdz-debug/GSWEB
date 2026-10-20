<template>
  <div class="max-w-md mx-auto my-8">
    <div class="bg-white rounded-2xl border border-slate-200 p-8 shadow-md">
      <div class="text-center mb-6">
        <h1 class="text-2xl font-black text-slate-900 mb-1">Espace Vendeur</h1>
        <p class="text-slate-500 text-sm">Connectez-vous ou créez votre boutique indépendante</p>
      </div>

      <div class="flex border-b mb-6">
        <button
          @click="mode = 'login'"
          :class="['flex-1 py-2 font-bold text-sm border-b-2 transition', mode === 'login' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-slate-400']"
        >
          Connexion
        </button>
        <button
          @click="mode = 'register'"
          :class="['flex-1 py-2 font-bold text-sm border-b-2 transition', mode === 'register' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-slate-400']"
        >
          Créer un compte Vendeur
        </button>
      </div>

      <div v-if="errorMessage" class="mb-4 p-3 bg-red-50 text-red-600 text-xs rounded-lg border border-red-200">
        {{ errorMessage }}
      </div>

      <div v-if="successMessage" class="mb-4 p-3 bg-emerald-50 text-emerald-600 text-xs rounded-lg border border-emerald-200">
        {{ successMessage }}
      </div>

      <!-- Login Form -->
      <form v-if="mode === 'login'" @submit.prevent="handleLogin" class="space-y-4">
        <div>
          <label class="block text-xs font-bold text-slate-700 uppercase mb-1">Email</label>
          <input v-model="email" type="email" required placeholder="vendor@domain.local" class="w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
        </div>
        <div>
          <label class="block text-xs font-bold text-slate-700 uppercase mb-1">Mot de passe</label>
          <input v-model="password" type="password" required placeholder="••••••••" class="w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
        </div>
        <button type="submit" class="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2.5 rounded-lg text-sm transition shadow">
          Se connecter à l'espace vendeur
        </button>
      </form>

      <!-- Register Form -->
      <form v-else @submit.prevent="handleRegister" class="space-y-4">
        <div>
          <label class="block text-xs font-bold text-slate-700 uppercase mb-1">Email</label>
          <input v-model="email" type="email" required placeholder="votre-email@domaine.com" class="w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
        </div>
        <div>
          <label class="block text-xs font-bold text-slate-700 uppercase mb-1">Nom de l'entreprise / boutique</label>
          <input v-model="companyName" type="text" required placeholder="Ex: TechStore Direct" class="w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
        </div>
        <div>
          <label class="block text-xs font-bold text-slate-700 uppercase mb-1">Identifiant unique (slug)</label>
          <input v-model="slug" type="text" required placeholder="ex: techstore-direct" class="w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
        </div>
        <div>
          <label class="block text-xs font-bold text-slate-700 uppercase mb-1">Mot de passe</label>
          <input v-model="password" type="password" required placeholder="••••••••" class="w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
        </div>
        <button type="submit" class="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2.5 rounded-lg text-sm transition shadow">
          Créer mon profil vendeur
        </button>
      </form>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue';
import { useRouter } from 'vue-router';

const router = useRouter();
const mode = ref('login');

const email = ref('');
const password = ref('');
const companyName = ref('');
const slug = ref('');

const errorMessage = ref('');
const successMessage = ref('');

const API_BASE = 'http://localhost:4000/api';

async function handleLogin() {
  errorMessage.value = '';
  try {
    const res = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: email.value, password: password.value }),
    });
    const data = await res.json();
    if (!res.ok) {
      errorMessage.value = data.error || 'Identifiants invalides';
      return;
    }

    localStorage.setItem('vendor_token', data.token);
    localStorage.setItem('vendor_user', JSON.stringify(data.user));
    successMessage.value = 'Connexion réussie ! Redirection...';
    setTimeout(() => {
      router.push('/dashboard');
    }, 800);
  } catch (err) {
    errorMessage.value = 'Erreur réseau lors de la connexion.';
  }
}

async function handleRegister() {
  errorMessage.value = '';
  try {
    const regRes = await fetch(`${API_BASE}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: email.value, password: password.value }),
    });
    const regData = await regRes.json();
    if (!regRes.ok) {
      errorMessage.value = regData.error || 'Erreur lors de l’inscription.';
      return;
    }

    const token = regData.token;
    localStorage.setItem('vendor_token', token);

    // Register vendor profile
    const vRes = await fetch(`${API_BASE}/vendors`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ company_name: companyName.value, slug: slug.value }),
    });

    if (!vRes.ok) {
      const vData = await vRes.json();
      errorMessage.value = vData.error || 'Erreur lors de la création de la boutique.';
      return;
    }

    successMessage.value = 'Compte et boutique vendeur créés avec succès ! Redirection...';
    setTimeout(() => {
      router.push('/dashboard');
    }, 800);
  } catch (err) {
    errorMessage.value = 'Erreur réseau lors de l’inscription.';
  }
}
</script>
