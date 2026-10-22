<template>
  <div class="min-h-screen bg-slate-50 flex flex-col font-sans text-slate-900" :dir="dir" :lang="currentLang">
    <!-- Header Navigation -->
    <header class="bg-indigo-900 text-white shadow-lg sticky top-0 z-50 border-b border-indigo-800">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 py-4 flex justify-between items-center">
        <NuxtLink to="/" class="flex items-center space-x-3 rtl:space-x-reverse">
          <div class="bg-indigo-500 text-white p-2 rounded-xl font-black text-xl tracking-wider shadow">MV</div>
          <div>
            <span class="text-xl font-extrabold tracking-tight block leading-none text-white">MarketPlace Multi-Vendeurs</span>
            <span class="text-xs text-indigo-300 font-medium">Connecté au WebManager</span>
          </div>
        </NuxtLink>

        <!-- Desktop Navigation -->
        <nav class="hidden md:flex items-center space-x-6 rtl:space-x-reverse text-sm font-medium">
          <NuxtLink to="/" class="hover:text-indigo-200 transition" active-class="text-indigo-300 font-bold">{{ t.home }}</NuxtLink>
          <NuxtLink to="/vendors" class="hover:text-indigo-200 transition" active-class="text-indigo-300 font-bold">{{ t.vendors }}</NuxtLink>
          <NuxtLink to="/login" class="bg-indigo-600 hover:bg-indigo-500 px-4 py-2 rounded-xl font-semibold text-white transition shadow-sm focus:ring-2 focus:ring-indigo-300">
            {{ t.vendorSpace }}
          </NuxtLink>
        </nav>

        <div class="flex items-center space-x-3 rtl:space-x-reverse">
          <!-- Language Switcher -->
          <div class="flex items-center bg-indigo-950 border border-indigo-800 rounded-xl p-1 text-xs font-bold">
            <button
              @click="setLang('fr')"
              :class="currentLang === 'fr' ? 'bg-indigo-600 text-white' : 'text-indigo-300 hover:text-white'"
              class="px-2.5 py-1 rounded-lg transition focus:outline-none focus:ring-1 focus:ring-indigo-400"
              aria-label="Français"
            >
              FR
            </button>
            <button
              @click="setLang('ar')"
              :class="currentLang === 'ar' ? 'bg-indigo-600 text-white' : 'text-indigo-300 hover:text-white'"
              class="px-2.5 py-1 rounded-lg transition focus:outline-none focus:ring-1 focus:ring-indigo-400"
              aria-label="العربية"
            >
              العربية
            </button>
          </div>

          <!-- Mobile Hamburger Toggle -->
          <button
            @click="isMobileMenuOpen = !isMobileMenuOpen"
            type="button"
            class="md:hidden p-2 rounded-xl bg-indigo-950 hover:bg-indigo-800 text-indigo-100 focus:outline-none focus:ring-2 focus:ring-indigo-400"
            aria-label="Toggle navigation menu"
            :aria-expanded="isMobileMenuOpen"
          >
            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
        </div>
      </div>

      <!-- Mobile Navigation Drawer -->
      <div v-if="isMobileMenuOpen" class="md:hidden border-t border-indigo-800 px-4 py-3 space-y-2 bg-indigo-900 text-sm font-medium">
        <NuxtLink to="/" @click="isMobileMenuOpen = false" class="block px-3 py-2 rounded-lg hover:bg-indigo-800 text-indigo-100">{{ t.home }}</NuxtLink>
        <NuxtLink to="/vendors" @click="isMobileMenuOpen = false" class="block px-3 py-2 rounded-lg hover:bg-indigo-800 text-indigo-100">{{ t.vendors }}</NuxtLink>
        <NuxtLink to="/login" @click="isMobileMenuOpen = false" class="block px-3 py-2 rounded-lg bg-indigo-600 text-white font-semibold text-center">{{ t.vendorSpace }}</NuxtLink>
      </div>
    </header>

    <!-- Main Content -->
    <main class="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-8">
      <NuxtPage />
    </main>

    <!-- Footer -->
    <footer class="bg-slate-900 text-slate-400 text-xs py-6 border-t border-slate-800">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 flex flex-col md:flex-row justify-between items-center gap-4">
        <p>© 2025 {{ t.footerCopyright }}</p>
        <div class="flex space-x-4 rtl:space-x-reverse">
          <NuxtLink to="/" class="hover:text-white transition">{{ t.home }}</NuxtLink>
          <NuxtLink to="/vendors" class="hover:text-white transition">{{ t.vendors }}</NuxtLink>
          <NuxtLink to="/dashboard" class="hover:text-white transition">{{ t.dashboard }}</NuxtLink>
        </div>
      </div>
    </footer>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';

const currentLang = ref('fr');
const isMobileMenuOpen = ref(false);

const dict = {
  fr: {
    home: 'Accueil Marketplace',
    vendors: 'Boutiques Vendeurs',
    vendorSpace: 'Espace Vendeur',
    dashboard: 'Dashboard Vendeur',
    footerCopyright: "Plateforme Multi-Vendeurs — Connectée à l'API Gestionnaire Web Manager",
  },
  ar: {
    home: 'الرئيسية',
    vendors: 'دليل المتاجر',
    vendorSpace: 'فضاء البائع',
    dashboard: 'لوحة تحكم البائع',
    footerCopyright: 'منصة المتاجر المتعددة — متصلة بالمدير المركزي Web Manager',
  },
};

const t = computed(() => dict[currentLang.value] || dict.fr);
const dir = computed(() => (currentLang.value === 'ar' ? 'rtl' : 'ltr'));

function setLang(lang) {
  currentLang.value = lang;
  if (typeof localStorage !== 'undefined') {
    localStorage.setItem('mv_lang', lang);
  }
}

onMounted(() => {
  if (typeof localStorage !== 'undefined') {
    const saved = localStorage.getItem('mv_lang');
    if (saved === 'ar' || saved === 'fr') {
      currentLang.value = saved;
    }
  }
});

useHead({
  htmlAttrs: computed(() => ({
    lang: currentLang.value,
    dir: dir.value,
  })),
});
</script>
