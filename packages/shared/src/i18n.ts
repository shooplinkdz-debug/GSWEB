export type SupportedLanguage = 'fr' | 'ar';

export interface Translations {
  nav: {
    home: string;
    catalog: string;
    vendors: string;
    tracking: string;
    cart: string;
    vendorSpace: string;
    dashboard: string;
    products: string;
    orders: string;
    wilayas: string;
    cmsPages: string;
    logsBackup: string;
    aiAssistant: string;
  };
  reassurance: {
    delivery58: string;
    delivery58Desc: string;
    cod: string;
    codDesc: string;
    verifiedVendors: string;
    verifiedVendorsDesc: string;
    currency: string;
  };
  common: {
    search: string;
    viewProduct: string;
    visitStore: string;
    addToCart: string;
    checkout: string;
    save: string;
    cancel: string;
    status: string;
    language: string;
    onlineSystem: string;
    allRightsReserved: string;
    inStock: string;
    outOfStock: string;
    shipped24h: string;
    totalRevenue: string;
    validatedOrders: string;
    activeStores: string;
    catalogProducts: string;
    lowStockAlert: string;
    recentActivity: string;
  };
}

export const translations: Record<SupportedLanguage, Translations> = {
  fr: {
    nav: {
      home: 'Accueil',
      catalog: 'Catalogue',
      vendors: 'Boutiques',
      tracking: 'Suivi',
      cart: 'Panier',
      vendorSpace: 'Espace Vendeur',
      dashboard: 'Dashboard',
      products: 'Produits & Stocks',
      orders: 'Commandes',
      wilayas: 'Tarifs Wilayas',
      cmsPages: 'Pages CMS',
      logsBackup: 'Journaux & Backup',
      aiAssistant: 'Assistant IA',
    },
    reassurance: {
      delivery58: 'Livraison 58 Wilayas',
      delivery58Desc: "Expédition rapide et suivie dans toutes les communes d'Algérie.",
      cod: 'Paiement à la Livraison',
      codDesc: 'Réglez votre commande en espèces (DZD) à la réception du colis.',
      verifiedVendors: 'Boutiques Vérifiées',
      verifiedVendorsDesc: 'Vendeurs indépendants et commerçants algériens certifiés.',
      currency: 'Dinars Algériens (DZD)',
    },
    common: {
      search: 'Rechercher',
      viewProduct: 'Voir le produit',
      visitStore: 'Visiter la boutique',
      addToCart: 'Ajouter au panier',
      checkout: 'Commander',
      save: 'Enregistrer',
      cancel: 'Annuler',
      status: 'Statut',
      language: 'Langue',
      onlineSystem: 'Système En Ligne',
      allRightsReserved: 'Tous droits réservés',
      inStock: 'En stock',
      outOfStock: 'Rupture',
      shipped24h: 'Expédié sous 24h',
      totalRevenue: "Chiffre d'Affaires",
      validatedOrders: 'Commandes Validées',
      activeStores: 'Boutiques Actives',
      catalogProducts: 'Produits au Catalogue',
      lowStockAlert: 'Alerte Stock Bas',
      recentActivity: "Aperçu de l'Activité Récente",
    },
  },
  ar: {
    nav: {
      home: 'الرئيسية',
      catalog: 'الكتالوج',
      vendors: 'المتاجر',
      tracking: 'تتبع الطلب',
      cart: 'السلة',
      vendorSpace: 'فضاء البائع',
      dashboard: 'لوحة التحكم',
      products: 'المنتجات والمخزون',
      orders: 'الطلبات',
      wilayas: 'أسعار الولايات',
      cmsPages: 'صفحات الموقع',
      logsBackup: 'السجلات والنسخ الاحتياطي',
      aiAssistant: 'المساعد الذكي',
    },
    reassurance: {
      delivery58: 'التوصيل لـ 58 ولاية',
      delivery58Desc: 'شحن سريع ومتبع إلى جميع بلديات الجزائر.',
      cod: 'الدفع عند الاستلام',
      codDesc: 'ادفع ثمن طلبيتك نقداً (د.ج) عند استلام الطرد.',
      verifiedVendors: 'متاجر معتمدة',
      verifiedVendorsDesc: 'بائعون مستقلون وتجار جزائريون موثوقون.',
      currency: 'دينار جزائري (د.ج)',
    },
    common: {
      search: 'بحث',
      viewProduct: 'عرض المنتج',
      visitStore: 'زيارة المتجر',
      addToCart: 'أضف إلى السلة',
      checkout: 'إتمام الطلب',
      save: 'حفظ',
      cancel: 'إلغاء',
      status: 'الحالة',
      language: 'اللغة',
      onlineSystem: 'النظام متصل',
      allRightsReserved: 'جميع الحقوق محفوظة',
      inStock: 'متوفر في المخزون',
      outOfStock: 'غير متوفر',
      shipped24h: 'الشحن خلال 24 ساعة',
      totalRevenue: 'رقم الأعمال الإجمالي',
      validatedOrders: 'الطلبات المؤكدة',
      activeStores: 'المتاجر النشطة',
      catalogProducts: 'المنتجات المسجلة',
      lowStockAlert: 'تنبيه مخزون منخفض',
      recentActivity: 'نظرة عامة على النشاط الحديث',
    },
  },
};

export function getLocaleDir(lang: SupportedLanguage): 'ltr' | 'rtl' {
  return lang === 'ar' ? 'rtl' : 'ltr';
}
