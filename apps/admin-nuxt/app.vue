<template>
  <div class="min-h-screen bg-slate-100 flex flex-col font-sans text-slate-900" :dir="dir" :lang="currentLang">
    <!-- Impersonation / Assistance Banner -->
    <div v-if="isImpersonating" class="bg-amber-600 text-white text-xs font-bold px-4 py-2 flex justify-between items-center shadow-inner">
      <div class="flex items-center space-x-2 rtl:space-x-reverse">
        <span class="animate-pulse bg-white text-amber-700 px-2 py-0.5 rounded text-[10px] uppercase font-black">Mode Assistance</span>
        <span>{{ t.impersonationBanner }} <strong>{{ impersonatedUserEmail }}</strong> ({{ impersonatedUserRole }})</span>
      </div>
      <button @click="exitImpersonation" class="bg-white/20 hover:bg-white/30 text-white px-3 py-1 rounded text-xs transition">
        {{ t.exitAssistance }}
      </button>
    </div>

    <header class="bg-slate-900 text-white py-4 px-6 shadow-md border-b border-slate-800">
      <div class="max-w-7xl mx-auto flex justify-between items-center">
        <div class="flex items-center space-x-3 rtl:space-x-reverse">
          <span class="text-xl font-bold tracking-tight text-white">MBA Admin</span>
        </div>

        <!-- Desktop Navigation -->
        <nav class="hidden lg:flex items-center space-x-4 rtl:space-x-reverse text-sm font-medium">
          <NuxtLink to="/" class="hover:text-amber-400 transition" active-class="text-amber-400 font-bold">{{ t.dashboard }}</NuxtLink>
          <NuxtLink to="/roles" class="hover:text-amber-400 transition" active-class="text-amber-400 font-bold">{{ t.rolesPermissions }}</NuxtLink>
          <NuxtLink to="/products" class="hover:text-amber-400 transition" active-class="text-amber-400 font-bold">{{ t.products }}</NuxtLink>
          <NuxtLink to="/vendors" class="hover:text-amber-400 transition" active-class="text-amber-400 font-bold">{{ t.vendors }}</NuxtLink>
          <NuxtLink to="/subscriptions" class="hover:text-amber-400 transition" active-class="text-amber-400 font-bold">{{ t.subscriptions }}</NuxtLink>
          <NuxtLink to="/orders" class="hover:text-amber-400 transition" active-class="text-amber-400 font-bold">{{ t.orders }}</NuxtLink>
          <NuxtLink to="/finances" class="hover:text-amber-400 transition" active-class="text-amber-400 font-bold">{{ t.finances }}</NuxtLink>
          <NuxtLink to="/marketing" class="hover:text-amber-400 transition" active-class="text-amber-400 font-bold">{{ t.adsBanners }}</NuxtLink>
          <NuxtLink to="/delivery" class="hover:text-amber-400 transition" active-class="text-amber-400 font-bold">{{ t.deliveryCompanies }}</NuxtLink>
          <NuxtLink to="/reviews" class="hover:text-amber-400 transition" active-class="text-amber-400 font-bold">{{ t.reviews }}</NuxtLink>
          <NuxtLink to="/wilayas" class="hover:text-amber-400 transition" active-class="text-amber-400 font-bold">{{ t.wilayas }}</NuxtLink>
          <NuxtLink to="/logs" class="hover:text-amber-400 transition" active-class="text-amber-400 font-bold">{{ t.logsBackup }}</NuxtLink>
        </nav>

        <div class="flex items-center space-x-3 rtl:space-x-reverse">
          <!-- Platform Switcher -->
          <div class="hidden xl:flex items-center space-x-2 rtl:space-x-reverse bg-slate-800 border border-slate-700 rounded-xl px-2.5 py-1 text-xs font-semibold">
            <span class="text-amber-400 font-bold">{{ t.platformSwitcher }}:</span>
            <a href="http://localhost:3000" target="_blank" class="hover:text-amber-400 transition text-slate-300">{{ t.publicMarketplace }} (3000)</a>
            <span class="text-slate-600">•</span>
            <a href="http://localhost:3002" target="_blank" class="hover:text-amber-400 transition text-slate-300">{{ t.vendorPortal }} (3002)</a>
          </div>

          <!-- Language Switcher -->
          <div class="flex items-center bg-slate-800 border border-slate-700 rounded-xl p-1 text-xs font-bold">
            <button
              @click="setLang('fr')"
              :class="currentLang === 'fr' ? 'bg-amber-600 text-white' : 'text-slate-400 hover:text-white'"
              class="px-2.5 py-1 rounded-lg transition focus:outline-none focus:ring-1 focus:ring-amber-400"
              aria-label="Français"
            >
              FR
            </button>
            <button
              @click="setLang('ar')"
              :class="currentLang === 'ar' ? 'bg-amber-600 text-white' : 'text-slate-400 hover:text-white'"
              class="px-2.5 py-1 rounded-lg transition focus:outline-none focus:ring-1 focus:ring-amber-400"
              aria-label="العربية"
            >
              العربية
            </button>
          </div>

          <!-- Mobile Menu Button -->
          <button
            @click="isMobileMenuOpen = !isMobileMenuOpen"
            type="button"
            class="lg:hidden p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 focus:outline-none focus:ring-2 focus:ring-amber-400"
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
        <NuxtLink to="/roles" @click="isMobileMenuOpen = false" class="block px-3 py-2 rounded-lg hover:bg-slate-800 text-slate-200 hover:text-white">{{ t.rolesPermissions }}</NuxtLink>
        <NuxtLink to="/products" @click="isMobileMenuOpen = false" class="block px-3 py-2 rounded-lg hover:bg-slate-800 text-slate-200 hover:text-white">{{ t.products }}</NuxtLink>
        <NuxtLink to="/vendors" @click="isMobileMenuOpen = false" class="block px-3 py-2 rounded-lg hover:bg-slate-800 text-slate-200 hover:text-white">{{ t.vendors }}</NuxtLink>
        <NuxtLink to="/subscriptions" @click="isMobileMenuOpen = false" class="block px-3 py-2 rounded-lg hover:bg-slate-800 text-slate-200 hover:text-white">{{ t.subscriptions }}</NuxtLink>
        <NuxtLink to="/orders" @click="isMobileMenuOpen = false" class="block px-3 py-2 rounded-lg hover:bg-slate-800 text-slate-200 hover:text-white">{{ t.orders }}</NuxtLink>
        <NuxtLink to="/finances" @click="isMobileMenuOpen = false" class="block px-3 py-2 rounded-lg hover:bg-slate-800 text-slate-200 hover:text-white">{{ t.finances }}</NuxtLink>
        <NuxtLink to="/marketing" @click="isMobileMenuOpen = false" class="block px-3 py-2 rounded-lg hover:bg-slate-800 text-slate-200 hover:text-white">{{ t.adsBanners }}</NuxtLink>
        <NuxtLink to="/delivery" @click="isMobileMenuOpen = false" class="block px-3 py-2 rounded-lg hover:bg-slate-800 text-slate-200 hover:text-white">{{ t.deliveryCompanies }}</NuxtLink>
        <NuxtLink to="/reviews" @click="isMobileMenuOpen = false" class="block px-3 py-2 rounded-lg hover:bg-slate-800 text-slate-200 hover:text-white">{{ t.reviews }}</NuxtLink>
        <NuxtLink to="/wilayas" @click="isMobileMenuOpen = false" class="block px-3 py-2 rounded-lg hover:bg-slate-800 text-slate-200 hover:text-white">{{ t.wilayas }}</NuxtLink>
        <NuxtLink to="/logs" @click="isMobileMenuOpen = false" class="block px-3 py-2 rounded-lg hover:bg-slate-800 text-slate-200 hover:text-white">{{ t.logsBackup }}</NuxtLink>
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
const isImpersonating = ref(false);
const impersonatedUserEmail = ref('');
const impersonatedUserRole = ref('');

const dict = {
  fr: {
    dashboard: 'Dashboard',
    rolesPermissions: 'Rôles & Accès',
    products: 'Produits',
    vendors: 'Boutiques',
    subscriptions: 'Abonnements',
    orders: 'Commandes',
    finances: 'Solde & Finances',
    adsBanners: 'Publicités',
    deliveryCompanies: 'Livraisons',
    reviews: 'Avis Clients',
    wilayas: 'Tarifs Wilayas',
    cmsPages: 'Pages CMS',
    logsBackup: 'Journaux & Backup',
    aiAssistant: 'Assistant IA',
    platformSwitcher: 'Plateformes',
    publicMarketplace: 'Marketplace',
    vendorPortal: 'Vendeurs',
    impersonationBanner: 'Mode assistance active : vous visualisez le compte de',
    exitAssistance: 'Quitter assistance',
    footerText: "Panel d'Administration MBA — MA BOUTIQUE ALGÉRIENNE",
  },
  ar: {
    dashboard: 'لوحة التحكم',
    rolesPermissions: 'الأدوار والصلاحيات',
    products: 'المنتجات',
    vendors: 'المتاجر',
    subscriptions: 'الاشتراكات',
    orders: 'الطلبات',
    finances: 'المالية والرصيد',
    adsBanners: 'الإعلانات',
    deliveryCompanies: 'شركات التوصيل',
    reviews: 'التقييمات',
    wilayas: 'أسعار الولايات',
    cmsPages: 'صفحات الموقع',
    logsBackup: 'السجلات والنسخ',
    aiAssistant: 'المساعد الذكي',
    platformSwitcher: 'المنصات',
    publicMarketplace: 'السوق',
    vendorPortal: 'البائعون',
    impersonationBanner: 'وضع المساعدة المباشر نشط لحساب',
    exitAssistance: 'إنهاء المساعدة',
    footerText: 'لوحة التحكم والإدارة — متجري الجزائري MBA',
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

function exitImpersonation() {
  if (typeof localStorage !== 'undefined') {
    const backupToken = localStorage.getItem('admin_original_token');
    if (backupToken) {
      localStorage.setItem('token', backupToken);
      localStorage.removeItem('admin_original_token');
    }
  }
  isImpersonating.value = false;
  window.location.reload();
}

onMounted(() => {
  if (typeof localStorage !== 'undefined') {
    const saved = localStorage.getItem('admin_lang');
    if (saved === 'ar' || saved === 'fr') {
      currentLang.value = saved;
    }

    const backupToken = localStorage.getItem('admin_original_token');
    if (backupToken) {
      isImpersonating.value = true;
      impersonatedUserEmail.value = localStorage.getItem('impersonated_email') || 'utilisateur@mba.dz';
      impersonatedUserRole.value = localStorage.getItem('impersonated_role') || 'SELLER';
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
