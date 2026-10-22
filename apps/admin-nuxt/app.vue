<template>
  <div class="min-h-screen bg-slate-100 flex flex-col font-sans text-slate-900" :dir="dir" :lang="currentLang">
    <header class="bg-slate-900 text-white py-4 px-6 shadow-md border-b border-slate-800">
      <div class="max-w-7xl mx-auto flex justify-between items-center">
        <div class="flex items-center space-x-3 rtl:space-x-reverse">
          <span class="text-xl font-bold tracking-tight text-white">WebManager Admin</span>
        </div>

        <!-- Desktop Navigation -->
        <nav class="hidden lg:flex items-center space-x-4 rtl:space-x-reverse text-sm font-medium">
          <NuxtLink to="/" class="hover:text-indigo-400 transition" active-class="text-indigo-400 font-bold">{{ t.dashboard }}</NuxtLink>
          <NuxtLink to="/products" class="hover:text-indigo-400 transition" active-class="text-indigo-400 font-bold">{{ t.products }}</NuxtLink>
          <NuxtLink to="/vendors" class="hover:text-indigo-400 transition" active-class="text-indigo-400 font-bold">{{ t.vendors }}</NuxtLink>
          <NuxtLink to="/orders" class="hover:text-indigo-400 transition" active-class="text-indigo-400 font-bold">{{ t.orders }}</NuxtLink>
          <NuxtLink to="/wilayas" class="hover:text-indigo-400 transition" active-class="text-indigo-400 font-bold">{{ t.wilayas }}</NuxtLink>
          <NuxtLink to="/pages" class="hover:text-indigo-400 transition" active-class="text-indigo-400 font-bold">{{ t.cmsPages }}</NuxtLink>
          <NuxtLink to="/logs" class="hover:text-indigo-400 transition" active-class="text-indigo-400 font-bold">{{ t.logsBackup }}</NuxtLink>
          <NuxtLink to="/ai" class="hover:text-indigo-400 transition" active-class="text-indigo-400 font-bold">{{ t.aiAssistant }}</NuxtLink>
        </nav>

        <div class="flex items-center space-x-3 rtl:space-x-reverse">
          <!-- Language Switcher -->
          <div class="flex items-center bg-slate-800 border border-slate-700 rounded-xl p-1 text-xs font-bold">
            <button
              @click="setLang('fr')"
              :class="currentLang === 'fr' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'"
              class="px-2.5 py-1 rounded-lg transition focus:outline-none focus:ring-1 focus:ring-indigo-400"
              aria-label="Français"
            >
              FR
            </button>
            <button
              @click="setLang('ar')"
              :class="currentLang === 'ar' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'"
              class="px-2.5 py-1 rounded-lg transition focus:outline-none focus:ring-1 focus:ring-indigo-400"
              aria-label="العربية"
            >
              العربية
            </button>
          </div>

          <!-- Mobile Menu Button -->
          <button
            @click="isMobileMenuOpen = !isMobileMenuOpen"
            type="button"
            class="lg:hidden p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-400"
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
      <div v-if="isMobileMenuOpen" class="lg:hidden mt-3 border-t border-slate-800 pt-3 space-y-2 text-sm font-medium">
        <NuxtLink to="/" @click="isMobileMenuOpen = false" class="block px-3 py-2 rounded-lg hover:bg-slate-800 text-slate-200 hover:text-white">{{ t.dashboard }}</NuxtLink>
        <NuxtLink to="/products" @click="isMobileMenuOpen = false" class="block px-3 py-2 rounded-lg hover:bg-slate-800 text-slate-200 hover:text-white">{{ t.products }}</NuxtLink>
        <NuxtLink to="/vendors" @click="isMobileMenuOpen = false" class="block px-3 py-2 rounded-lg hover:bg-slate-800 text-slate-200 hover:text-white">{{ t.vendors }}</NuxtLink>
        <NuxtLink to="/orders" @click="isMobileMenuOpen = false" class="block px-3 py-2 rounded-lg hover:bg-slate-800 text-slate-200 hover:text-white">{{ t.orders }}</NuxtLink>
        <NuxtLink to="/wilayas" @click="isMobileMenuOpen = false" class="block px-3 py-2 rounded-lg hover:bg-slate-800 text-slate-200 hover:text-white">{{ t.wilayas }}</NuxtLink>
        <NuxtLink to="/pages" @click="isMobileMenuOpen = false" class="block px-3 py-2 rounded-lg hover:bg-slate-800 text-slate-200 hover:text-white">{{ t.cmsPages }}</NuxtLink>
        <NuxtLink to="/logs" @click="isMobileMenuOpen = false" class="block px-3 py-2 rounded-lg hover:bg-slate-800 text-slate-200 hover:text-white">{{ t.logsBackup }}</NuxtLink>
        <NuxtLink to="/ai" @click="isMobileMenuOpen = false" class="block px-3 py-2 rounded-lg hover:bg-slate-800 text-slate-200 hover:text-white">{{ t.aiAssistant }}</NuxtLink>
      </div>
    </header>

    <main class="flex-1 p-6 max-w-7xl w-full mx-auto">
      <NuxtPage />
    </main>

    <footer class="bg-slate-200 text-slate-700 text-xs py-4 text-center border-t border-slate-300 font-medium">
      {{ t.footerText }}
    </footer>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';

const currentLang = ref('fr');
const isMobileMenuOpen = ref(false);

const dict = {
  fr: {
    dashboard: 'Dashboard',
    products: 'Produits & Stocks',
    vendors: 'Boutiques Vendeurs',
    orders: 'Commandes',
    wilayas: 'Tarifs Wilayas',
    cmsPages: 'Pages CMS',
    logsBackup: 'Journaux & Backup',
    aiAssistant: 'Assistant IA',
    footerText: "Panel d'Administration Web Manager — Protégé par RBAC",
  },
  ar: {
    dashboard: 'لوحة التحكم',
    products: 'المنتجات والمخزون',
    vendors: 'متاجر البائعين',
    orders: 'الطلبات',
    wilayas: 'أسعار الولايات',
    cmsPages: 'صفحات الموقع',
    logsBackup: 'السجلات والنسخ الاحتياطي',
    aiAssistant: 'المساعد الذكي',
    footerText: 'لوحة التحكم والإدارة Web Manager — محمية بـ RBAC',
  },
};

const t = computed(() => dict[currentLang.value] || dict.fr);
const dir = computed(() => (currentLang.value === 'ar' ? 'rtl' : 'ltr'));

function setLang(lang) {
  currentLang.value = lang;
  if (typeof localStorage !== 'undefined') {
    localStorage.setItem('admin_lang', lang);
  }
}

onMounted(() => {
  if (typeof localStorage !== 'undefined') {
    const saved = localStorage.getItem('admin_lang');
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
