// AfriCart - Site-Aware Content Scraper
// Intelligently extracts product information from global e-commerce platforms

// Import global stores database
// Note: In production, this would be loaded from stores-database.js
// For now, we'll include the comprehensive list here

// Global Store Configuration Map - COMPREHENSIVE DATABASE
// All major e-commerce platforms: Africa, Europe, USA
const AFRICAN_STORES = {
  // ============================================
  // AFRICA - COMPREHENSIVE COVERAGE
  // ============================================
  
  // NIGERIA 🇳🇬
  'jumia.com.ng': {
    name: 'Jumia Nigeria',
    country: 'Nigeria',
    region: 'West Africa',
    currency: 'NGN',
    flag: '🇳🇬',
    selectors: {
      title: 'h1[data-name], h1.-fs20, .product-title, h1',
      price: '[data-price], .price, .-b, .-fs24',
      originalPrice: '.old-price, .was-price, s, del',
      image: '.image-gallery img, .product-image img, img[data-src]',
      description: '.product-description, .markup, .description'
    },
    searchUrl: 'https://www.jumia.com.ng/catalog/?q=',
    affiliateParam: 'utm_source=africart'
  },
  'konga.com': {
    name: 'Konga',
    country: 'Nigeria',
    region: 'West Africa',
    currency: 'NGN',
    flag: '🇳🇬',
    selectors: {
      title: 'h1.product-name, .product-title, h1',
      price: '.product-price, .price, [data-price]',
      originalPrice: '.old-price, .was-price, s, del',
      image: '.product-image img, .main-image img',
      description: '.product-description, .description'
    },
    searchUrl: 'https://www.konga.com/search?search=',
    affiliateParam: 'utm_source=africart'
  },
  'slot.ng': {
    name: 'Slot',
    country: 'Nigeria',
    region: 'West Africa',
    currency: 'NGN',
    flag: '🇳🇬',
    selectors: {
      title: 'h1.product-name, .product-title, h1, .page-title',
      price: '.price, [data-price], .product-price, .price-box',
      originalPrice: '.old-price, .was-price, s, del',
      image: '.product-image img, .main-image img, .product-photo img',
      description: '.product-description, .description, .short-description'
    },
    searchUrl: 'https://slot.ng/catalogsearch/result/?q=',
    affiliateParam: 'utm_source=africart'
  },
  'payporte.com': {
    name: 'PayPorte',
    country: 'Nigeria',
    region: 'West Africa',
    currency: 'NGN',
    flag: '🇳🇬',
    selectors: {
      title: 'h1.product-name, .product-title, h1',
      price: '.price, [data-price], .product-price',
      originalPrice: '.old-price, .was-price, s, del',
      image: '.product-image img, .main-image img',
      description: '.product-description, .description'
    },
    searchUrl: 'https://www.payporte.com/catalogsearch/result/?q=',
    affiliateParam: 'utm_source=africart'
  },
  
  // SOUTH AFRICA 🇿🇦
  'takealot.com': {
    name: 'Takealot',
    country: 'South Africa',
    region: 'Southern Africa',
    currency: 'ZAR',
    flag: '🇿🇦',
    selectors: {
      title: 'h1.product-title, h1, .product-name',
      price: '.currency, .price, [data-price]',
      originalPrice: '.was-price, .old-price, s, del',
      image: '.product-image img, .main-image img',
      description: '.product-description, .description'
    },
    searchUrl: 'https://www.takealot.com/all?qsearch=',
    affiliateParam: 'utm_source=africart'
  },
  'zando.co.za': {
    name: 'Zando',
    country: 'South Africa',
    region: 'Southern Africa',
    currency: 'ZAR',
    flag: '🇿🇦',
    selectors: {
      title: 'h1.product-name, h1, .product-title',
      price: '.price, [data-price], .product-price',
      originalPrice: '.was-price, .old-price, s, del',
      image: '.product-image img, img[data-src]',
      description: '.product-description'
    },
    searchUrl: 'https://www.zando.co.za/catalog/?q=',
    affiliateParam: 'utm_source=africart'
  },
  'superbalist.com': {
    name: 'Superbalist',
    country: 'South Africa',
    region: 'Southern Africa',
    currency: 'ZAR',
    flag: '🇿🇦',
    selectors: {
      title: 'h1.product-name, h1, .product-title, .product-header h1',
      price: '.price, [data-price], .product-price, .price-value',
      originalPrice: '.was-price, .old-price, s, del',
      image: '.product-image img, .main-image img, .product-photo img',
      description: '.product-description, .description'
    },
    searchUrl: 'https://superbalist.com/search?q=',
    affiliateParam: 'utm_source=africart'
  },
  'amazon.co.za': {
    name: 'Amazon South Africa',
    country: 'South Africa',
    region: 'Southern Africa',
    currency: 'ZAR',
    flag: '🇿🇦',
    selectors: {
      title: '#productTitle, h1.a-size-large, h1',
      price: '.a-price .a-offscreen, .a-price-whole, .price',
      originalPrice: '.a-price-was, .a-text-strike, s, del',
      image: '#landingImage, #imgBlkFront, .a-dynamic-image',
      description: '#productDescription, #feature-bullets'
    },
    searchUrl: 'https://www.amazon.co.za/s?k=',
    affiliateParam: 'tag=africart-20'
  },
  'makro.co.za': {
    name: 'Makro',
    country: 'South Africa',
    region: 'Southern Africa',
    currency: 'ZAR',
    flag: '🇿🇦',
    selectors: {
      title: 'h1.product-title, h1, .product-name',
      price: '.price, [data-price], .product-price',
      originalPrice: '.was-price, .old-price, s, del',
      image: '.product-image img, .main-image img',
      description: '.product-description, .description'
    },
    searchUrl: 'https://www.makro.co.za/search?q=',
    affiliateParam: 'utm_source=africart'
  },
  'checkers.co.za': {
    name: 'Checkers Sixty60',
    country: 'South Africa',
    region: 'Southern Africa',
    currency: 'ZAR',
    flag: '🇿🇦',
    selectors: {
      title: 'h1.product-title, h1, .product-name',
      price: '.price, [data-price], .product-price',
      originalPrice: '.was-price, .old-price, s, del',
      image: '.product-image img, .main-image img',
      description: '.product-description, .description'
    },
    searchUrl: 'https://www.checkers.co.za/search?q=',
    affiliateParam: 'utm_source=africart'
  },
  
  // KENYA 🇰🇪
  'jumia.co.ke': {
    name: 'Jumia Kenya',
    country: 'Kenya',
    region: 'East Africa',
    currency: 'KES',
    flag: '🇰🇪',
    selectors: {
      title: 'h1[data-name], h1.-fs20, .product-title, h1',
      price: '[data-price], .price, .-b, .-fs24',
      originalPrice: '.old-price, .was-price, s, del',
      image: '.image-gallery img, .product-image img',
      description: '.product-description, .markup'
    },
    searchUrl: 'https://www.jumia.co.ke/catalog/?q=',
    affiliateParam: 'utm_source=africart'
  },
  'kilimall.com': {
    name: 'Kilimall',
    country: 'Kenya',
    region: 'East Africa',
    currency: 'KES',
    flag: '🇰🇪',
    selectors: {
      title: 'h1.product-title, h1, .product-name',
      price: '.price, [data-price], .product-price',
      originalPrice: '.old-price, .was-price, s, del',
      image: '.product-image img, .main-image img',
      description: '.product-description'
    },
    searchUrl: 'https://www.kilimall.co.ke/new/search?q=',
    affiliateParam: 'utm_source=africart'
  },
  'amanbo.co.ke': {
    name: 'Amanbo',
    country: 'Kenya',
    region: 'East Africa',
    currency: 'KES',
    flag: '🇰🇪',
    selectors: {
      title: 'h1.product-title, h1, .product-name, .product-header h1',
      price: '.price, [data-price], .product-price',
      originalPrice: '.old-price, .was-price, s, del',
      image: '.product-image img, .main-image img',
      description: '.product-description, .description'
    },
    searchUrl: 'https://www.amanbo.co.ke/search/?q=',
    affiliateParam: 'utm_source=africart'
  },
  'copia.co.ke': {
    name: 'Copia',
    country: 'Kenya',
    region: 'East Africa',
    currency: 'KES',
    flag: '🇰🇪',
    selectors: {
      title: 'h1.product-title, h1, .product-name',
      price: '.price, [data-price]',
      originalPrice: '.old-price, .was-price, s, del',
      image: '.product-image img',
      description: '.product-description'
    },
    searchUrl: 'https://www.copia.co.ke/search?q=',
    affiliateParam: 'utm_source=africart'
  },
  'skygarden.co.ke': {
    name: 'Skygarden',
    country: 'Kenya',
    region: 'East Africa',
    currency: 'KES',
    flag: '🇰🇪',
    selectors: {
      title: 'h1.product-title, h1, .product-name',
      price: '.price, [data-price], .product-price',
      originalPrice: '.old-price, .was-price, s, del',
      image: '.product-image img, .main-image img',
      description: '.product-description, .description'
    },
    searchUrl: 'https://www.skygarden.co.ke/search?q=',
    affiliateParam: 'utm_source=africart'
  },
  'masoko.com': {
    name: 'Masoko',
    country: 'Kenya',
    region: 'East Africa',
    currency: 'KES',
    flag: '🇰🇪',
    selectors: {
      title: 'h1.product-title, h1, .product-name',
      price: '.price, [data-price], .product-price',
      originalPrice: '.old-price, .was-price, s, del',
      image: '.product-image img, .main-image img',
      description: '.product-description, .description'
    },
    searchUrl: 'https://www.masoko.com/search?q=',
    affiliateParam: 'utm_source=africart'
  },
  'avechi.com': {
    name: 'Avechi',
    country: 'Kenya',
    region: 'East Africa',
    currency: 'KES',
    flag: '🇰🇪',
    selectors: {
      title: 'h1.product-title, h1, .product-name',
      price: '.price, [data-price], .product-price',
      originalPrice: '.old-price, .was-price, s, del',
      image: '.product-image img, .main-image img',
      description: '.product-description, .description'
    },
    searchUrl: 'https://www.avechi.com/search?q=',
    affiliateParam: 'utm_source=africart'
  },
  'buytec.co.ke': {
    name: 'Buytec',
    country: 'Kenya',
    region: 'East Africa',
    currency: 'KES',
    flag: '🇰🇪',
    selectors: {
      title: 'h1.product-title, h1, .product-name',
      price: '.price, [data-price], .product-price',
      originalPrice: '.old-price, .was-price, s, del',
      image: '.product-image img, .main-image img',
      description: '.product-description, .description'
    },
    searchUrl: 'https://www.buytec.co.ke/search?q=',
    affiliateParam: 'utm_source=africart'
  },
  'jiji.co.ke': {
    name: 'Jiji Kenya',
    country: 'Kenya',
    region: 'East Africa',
    currency: 'KES',
    flag: '🇰🇪',
    selectors: {
      title: 'h1.product-title, h1, .product-name, .ad-title',
      price: '.price, [data-price], .product-price, .ad-price',
      originalPrice: '.old-price, .was-price, s, del',
      image: '.product-image img, .main-image img, .ad-image img',
      description: '.product-description, .description, .ad-description'
    },
    searchUrl: 'https://jiji.co.ke/search?query=',
    affiliateParam: 'utm_source=africart'
  },
  'pigiame.co.ke': {
    name: 'Pigiame',
    country: 'Kenya',
    region: 'East Africa',
    currency: 'KES',
    flag: '🇰🇪',
    selectors: {
      title: 'h1.product-title, h1, .product-name, .listing-title',
      price: '.price, [data-price], .product-price, .listing-price',
      originalPrice: '.old-price, .was-price, s, del',
      image: '.product-image img, .main-image img, .listing-image img',
      description: '.product-description, .description, .listing-description'
    },
    searchUrl: 'https://www.pigiame.co.ke/search?q=',
    affiliateParam: 'utm_source=africart'
  },
  'kasha.co': {
    name: 'Kasha',
    country: 'Kenya',
    region: 'East Africa',
    currency: 'KES',
    flag: '🇰🇪',
    selectors: {
      title: 'h1.product-title, h1, .product-name',
      price: '.price, [data-price], .product-price',
      originalPrice: '.old-price, .was-price, s, del',
      image: '.product-image img, .main-image img',
      description: '.product-description, .description'
    },
    searchUrl: 'https://www.kasha.co/search?q=',
    affiliateParam: 'utm_source=africart'
  },
  'shopzetu.com': {
    name: 'Shop Zetu',
    country: 'Kenya',
    region: 'East Africa',
    currency: 'KES',
    flag: '🇰🇪',
    selectors: {
      title: 'h1.product-title, h1, .product-name',
      price: '.price, [data-price], .product-price',
      originalPrice: '.old-price, .was-price, s, del',
      image: '.product-image img, .main-image img',
      description: '.product-description, .description'
    },
    searchUrl: 'https://www.shopzetu.com/search?q=',
    affiliateParam: 'utm_source=africart'
  },
  
  // EGYPT 🇪🇬
  'jumia.com.eg': {
    name: 'Jumia Egypt',
    country: 'Egypt',
    region: 'North Africa',
    currency: 'EGP',
    flag: '🇪🇬',
    selectors: {
      title: 'h1[data-name], h1.-fs20, .product-title, h1',
      price: '[data-price], .price, .-b, .-fs24',
      originalPrice: '.old-price, .was-price, s, del',
      image: '.image-gallery img, .product-image img',
      description: '.product-description, .markup'
    },
    searchUrl: 'https://www.jumia.com.eg/catalog/?q=',
    affiliateParam: 'utm_source=africart'
  },
  'amazon.eg': {
    name: 'Amazon Egypt',
    country: 'Egypt',
    region: 'North Africa',
    currency: 'EGP',
    flag: '🇪🇬',
    selectors: {
      title: '#productTitle, h1.a-size-large, h1',
      price: '.a-price .a-offscreen, .a-price-whole',
      originalPrice: '.a-price-was, .a-text-strike, s, del',
      image: '#landingImage, #imgBlkFront',
      description: '#productDescription, #feature-bullets'
    },
    searchUrl: 'https://www.amazon.eg/s?k=',
    affiliateParam: 'tag=africart-20'
  },
  'noon.com': {
    name: 'Noon',
    country: 'Egypt',
    region: 'North Africa',
    currency: 'EGP',
    flag: '🇪🇬',
    selectors: {
      title: 'h1.productTitle, h1, .product-name',
      price: '.priceNow, .price, [data-price]',
      originalPrice: '.priceWas, .old-price, s, del',
      image: '.productImage img, .main-image img',
      description: '.productDescription'
    },
    searchUrl: 'https://www.noon.com/egypt-en/search/?q=',
    affiliateParam: 'utm_source=africart'
  },
  
  // GHANA 🇬🇭
  'jumia.com.gh': {
    name: 'Jumia Ghana',
    country: 'Ghana',
    region: 'West Africa',
    currency: 'GHS',
    flag: '🇬🇭',
    selectors: {
      title: 'h1[data-name], h1.-fs20, .product-title, h1',
      price: '[data-price], .price, .-b, .-fs24',
      originalPrice: '.old-price, .was-price, s, del',
      image: '.image-gallery img, .product-image img',
      description: '.product-description, .markup'
    },
    searchUrl: 'https://www.jumia.com.gh/catalog/?q=',
    affiliateParam: 'utm_source=africart'
  },
  'tospino.com': {
    name: 'Tospino',
    country: 'Ghana',
    region: 'West Africa',
    currency: 'GHS',
    flag: '🇬🇭',
    selectors: {
      title: 'h1.product-title, h1, .product-name',
      price: '.price, [data-price], .product-price',
      originalPrice: '.old-price, .was-price, s, del',
      image: '.product-image img, .main-image img',
      description: '.product-description, .description'
    },
    searchUrl: 'https://www.tospino.com/search?q=',
    affiliateParam: 'utm_source=africart'
  },
  
  // TANZANIA 🇹🇿
  'jumia.co.tz': {
    name: 'Jumia Tanzania',
    country: 'Tanzania',
    region: 'East Africa',
    currency: 'TZS',
    flag: '🇹🇿',
    selectors: {
      title: 'h1[data-name], h1.-fs20, .product-title, h1',
      price: '[data-price], .price, .-b, .-fs24',
      originalPrice: '.old-price, .was-price, s, del',
      image: '.image-gallery img, .product-image img',
      description: '.product-description, .markup'
    },
    searchUrl: 'https://www.jumia.co.tz/catalog/?q=',
    affiliateParam: 'utm_source=africart'
  },
  
  // UGANDA 🇺🇬
  'jumia.co.ug': {
    name: 'Jumia Uganda',
    country: 'Uganda',
    region: 'East Africa',
    currency: 'UGX',
    flag: '🇺🇬',
    selectors: {
      title: 'h1[data-name], h1.-fs20, .product-title, h1',
      price: '[data-price], .price, .-b, .-fs24',
      originalPrice: '.old-price, .was-price, s, del',
      image: '.image-gallery img, .product-image img',
      description: '.product-description, .markup'
    },
    searchUrl: 'https://www.jumia.co.ug/catalog/?q=',
    affiliateParam: 'utm_source=africart'
  },
  
  // MOROCCO 🇲🇦
  'jumia.ma': {
    name: 'Jumia Morocco',
    country: 'Morocco',
    region: 'North Africa',
    currency: 'MAD',
    flag: '🇲🇦',
    selectors: {
      title: 'h1[data-name], h1.-fs20, .product-title, h1',
      price: '[data-price], .price, .-b, .-fs24',
      originalPrice: '.old-price, .was-price, s, del',
      image: '.image-gallery img, .product-image img',
      description: '.product-description, .markup'
    },
    searchUrl: 'https://www.jumia.ma/catalog/?q=',
    affiliateParam: 'utm_source=africart'
  },
  
  // ALGERIA 🇩🇿
  'jumia.dz': {
    name: 'Jumia Algeria',
    country: 'Algeria',
    region: 'North Africa',
    currency: 'DZD',
    flag: '🇩🇿',
    selectors: {
      title: 'h1[data-name], h1.-fs20, .product-title, h1',
      price: '[data-price], .price, .-b, .-fs24',
      originalPrice: '.old-price, .was-price, s, del',
      image: '.image-gallery img, .product-image img',
      description: '.product-description, .markup'
    },
    searchUrl: 'https://www.jumia.dz/catalog/?q=',
    affiliateParam: 'utm_source=africart'
  },
  
  // IVORY COAST 🇨🇮
  'jumia.ci': {
    name: 'Jumia Côte d\'Ivoire',
    country: 'Ivory Coast',
    region: 'West Africa',
    currency: 'XOF',
    flag: '🇨🇮',
    selectors: {
      title: 'h1[data-name], h1.-fs20, .product-title, h1',
      price: '[data-price], .price, .-b, .-fs24',
      originalPrice: '.old-price, .was-price, s, del',
      image: '.image-gallery img, .product-image img',
      description: '.product-description, .markup'
    },
    searchUrl: 'https://www.jumia.ci/catalog/?q=',
    affiliateParam: 'utm_source=africart'
  },
  
  // SENEGAL 🇸🇳
  'jumia.sn': {
    name: 'Jumia Senegal',
    country: 'Senegal',
    region: 'West Africa',
    currency: 'XOF',
    flag: '🇸🇳',
    selectors: {
      title: 'h1[data-name], h1.-fs20, .product-title, h1',
      price: '[data-price], .price, .-b, .-fs24',
      originalPrice: '.old-price, .was-price, s, del',
      image: '.image-gallery img, .product-image img',
      description: '.product-description, .markup'
    },
    searchUrl: 'https://www.jumia.sn/catalog/?q=',
    affiliateParam: 'utm_source=africart'
  },
  
  // ============================================
  // EUROPE - MAJOR E-COMMERCE PLATFORMS
  // ============================================
  
  // UNITED KINGDOM 🇬🇧
  'amazon.co.uk': {
    name: 'Amazon UK',
    country: 'United Kingdom',
    region: 'Europe',
    currency: 'GBP',
    flag: '🇬🇧',
    selectors: {
      title: '#productTitle, h1.a-size-large, h1',
      price: '.a-price .a-offscreen, .a-price-whole, .price',
      originalPrice: '.a-price-was, .a-text-strike, s, del',
      image: '#landingImage, #imgBlkFront, .a-dynamic-image',
      description: '#productDescription, #feature-bullets'
    },
    searchUrl: 'https://www.amazon.co.uk/s?k=',
    affiliateParam: 'tag=africart-21'
  },
  'ebay.co.uk': {
    name: 'eBay UK',
    country: 'United Kingdom',
    region: 'Europe',
    currency: 'GBP',
    flag: '🇬🇧',
    selectors: {
      title: 'h1#x-item-title-label, h1, .product-title',
      price: '.notranslate, .price, [data-price]',
      originalPrice: '.was-price, .old-price, s, del',
      image: '.img-wrap img, .product-image img',
      description: '.product-description, .description'
    },
    searchUrl: 'https://www.ebay.co.uk/sch/i.html?_nkw=',
    affiliateParam: 'utm_source=africart'
  },
  'argos.co.uk': {
    name: 'Argos',
    country: 'United Kingdom',
    region: 'Europe',
    currency: 'GBP',
    flag: '🇬🇧',
    selectors: {
      title: 'h1.product-title, h1, .product-name',
      price: '.price, [data-price], .product-price',
      originalPrice: '.was-price, .old-price, s, del',
      image: '.product-image img, .main-image img',
      description: '.product-description, .description'
    },
    searchUrl: 'https://www.argos.co.uk/search/',
    affiliateParam: 'utm_source=africart'
  },
  'asos.com': {
    name: 'ASOS',
    country: 'United Kingdom',
    region: 'Europe',
    currency: 'GBP',
    flag: '🇬🇧',
    selectors: {
      title: 'h1.product-title, h1, .product-name',
      price: '.price, [data-price], .product-price',
      originalPrice: '.was-price, .old-price, s, del',
      image: '.product-image img, .main-image img',
      description: '.product-description, .description'
    },
    searchUrl: 'https://www.asos.com/search/?q=',
    affiliateParam: 'utm_source=africart'
  },
  
  // GERMANY 🇩🇪
  'amazon.de': {
    name: 'Amazon Germany',
    country: 'Germany',
    region: 'Europe',
    currency: 'EUR',
    flag: '🇩🇪',
    selectors: {
      title: '#productTitle, h1.a-size-large, h1',
      price: '.a-price .a-offscreen, .a-price-whole, .price',
      originalPrice: '.a-price-was, .a-text-strike, s, del',
      image: '#landingImage, #imgBlkFront, .a-dynamic-image',
      description: '#productDescription, #feature-bullets'
    },
    searchUrl: 'https://www.amazon.de/s?k=',
    affiliateParam: 'tag=africart-22'
  },
  'zalando.de': {
    name: 'Zalando',
    country: 'Germany',
    region: 'Europe',
    currency: 'EUR',
    flag: '🇩🇪',
    selectors: {
      title: 'h1.product-title, h1, .product-name',
      price: '.price, [data-price], .product-price',
      originalPrice: '.was-price, .old-price, s, del',
      image: '.product-image img, .main-image img',
      description: '.product-description, .description'
    },
    searchUrl: 'https://www.zalando.de/catalog/?q=',
    affiliateParam: 'utm_source=africart'
  },
  'otto.de': {
    name: 'OTTO',
    country: 'Germany',
    region: 'Europe',
    currency: 'EUR',
    flag: '🇩🇪',
    selectors: {
      title: 'h1.product-title, h1, .product-name',
      price: '.price, [data-price], .product-price',
      originalPrice: '.was-price, .old-price, s, del',
      image: '.product-image img, .main-image img',
      description: '.product-description, .description'
    },
    searchUrl: 'https://www.otto.de/suche/',
    affiliateParam: 'utm_source=africart'
  },
  
  // FRANCE 🇫🇷
  'amazon.fr': {
    name: 'Amazon France',
    country: 'France',
    region: 'Europe',
    currency: 'EUR',
    flag: '🇫🇷',
    selectors: {
      title: '#productTitle, h1.a-size-large, h1',
      price: '.a-price .a-offscreen, .a-price-whole, .price',
      originalPrice: '.a-price-was, .a-text-strike, s, del',
      image: '#landingImage, #imgBlkFront, .a-dynamic-image',
      description: '#productDescription, #feature-bullets'
    },
    searchUrl: 'https://www.amazon.fr/s?k=',
    affiliateParam: 'tag=africart-23'
  },
  'cdiscount.com': {
    name: 'Cdiscount',
    country: 'France',
    region: 'Europe',
    currency: 'EUR',
    flag: '🇫🇷',
    selectors: {
      title: 'h1.product-title, h1, .product-name',
      price: '.price, [data-price], .product-price',
      originalPrice: '.was-price, .old-price, s, del',
      image: '.product-image img, .main-image img',
      description: '.product-description, .description'
    },
    searchUrl: 'https://www.cdiscount.com/search/10/',
    affiliateParam: 'utm_source=africart'
  },
  'fnac.com': {
    name: 'Fnac',
    country: 'France',
    region: 'Europe',
    currency: 'EUR',
    flag: '🇫🇷',
    selectors: {
      title: 'h1.product-title, h1, .product-name',
      price: '.price, [data-price], .product-price',
      originalPrice: '.was-price, .old-price, s, del',
      image: '.product-image img, .main-image img',
      description: '.product-description, .description'
    },
    searchUrl: 'https://www.fnac.com/SearchResult/ResultList.aspx?SCat=0&Search=',
    affiliateParam: 'utm_source=africart'
  },
  
  // SPAIN 🇪🇸
  'amazon.es': {
    name: 'Amazon Spain',
    country: 'Spain',
    region: 'Europe',
    currency: 'EUR',
    flag: '🇪🇸',
    selectors: {
      title: '#productTitle, h1.a-size-large, h1',
      price: '.a-price .a-offscreen, .a-price-whole, .price',
      originalPrice: '.a-price-was, .a-text-strike, s, del',
      image: '#landingImage, #imgBlkFront, .a-dynamic-image',
      description: '#productDescription, #feature-bullets'
    },
    searchUrl: 'https://www.amazon.es/s?k=',
    affiliateParam: 'tag=africart-24'
  },
  'elcorteingles.es': {
    name: 'El Corte Inglés',
    country: 'Spain',
    region: 'Europe',
    currency: 'EUR',
    flag: '🇪🇸',
    selectors: {
      title: 'h1.product-title, h1, .product-name',
      price: '.price, [data-price], .product-price',
      originalPrice: '.was-price, .old-price, s, del',
      image: '.product-image img, .main-image img',
      description: '.product-description, .description'
    },
    searchUrl: 'https://www.elcorteingles.es/busqueda/?term=',
    affiliateParam: 'utm_source=africart'
  },
  
  // ITALY 🇮🇹
  'amazon.it': {
    name: 'Amazon Italy',
    country: 'Italy',
    region: 'Europe',
    currency: 'EUR',
    flag: '🇮🇹',
    selectors: {
      title: '#productTitle, h1.a-size-large, h1',
      price: '.a-price .a-offscreen, .a-price-whole, .price',
      originalPrice: '.a-price-was, .a-text-strike, s, del',
      image: '#landingImage, #imgBlkFront, .a-dynamic-image',
      description: '#productDescription, #feature-bullets'
    },
    searchUrl: 'https://www.amazon.it/s?k=',
    affiliateParam: 'tag=africart-25'
  },
  
  // NETHERLANDS 🇳🇱
  'amazon.nl': {
    name: 'Amazon Netherlands',
    country: 'Netherlands',
    region: 'Europe',
    currency: 'EUR',
    flag: '🇳🇱',
    selectors: {
      title: '#productTitle, h1.a-size-large, h1',
      price: '.a-price .a-offscreen, .a-price-whole, .price',
      originalPrice: '.a-price-was, .a-text-strike, s, del',
      image: '#landingImage, #imgBlkFront, .a-dynamic-image',
      description: '#productDescription, #feature-bullets'
    },
    searchUrl: 'https://www.amazon.nl/s?k=',
    affiliateParam: 'tag=africart-26'
  },
  'bol.com': {
    name: 'Bol.com',
    country: 'Netherlands',
    region: 'Europe',
    currency: 'EUR',
    flag: '🇳🇱',
    selectors: {
      title: 'h1.product-title, h1, .product-name',
      price: '.price, [data-price], .product-price',
      originalPrice: '.was-price, .old-price, s, del',
      image: '.product-image img, .main-image img',
      description: '.product-description, .description'
    },
    searchUrl: 'https://www.bol.com/nl/s/',
    affiliateParam: 'utm_source=africart'
  },
  
  // POLAND 🇵🇱
  'allegro.pl': {
    name: 'Allegro',
    country: 'Poland',
    region: 'Europe',
    currency: 'PLN',
    flag: '🇵🇱',
    selectors: {
      title: 'h1.product-title, h1, .product-name',
      price: '.price, [data-price], .product-price',
      originalPrice: '.was-price, .old-price, s, del',
      image: '.product-image img, .main-image img',
      description: '.product-description, .description'
    },
    searchUrl: 'https://allegro.pl/listing?string=',
    affiliateParam: 'utm_source=africart'
  },
  'manomano.fr': {
    name: 'ManoMano',
    country: 'France',
    region: 'Europe',
    currency: 'EUR',
    flag: '🇫🇷',
    selectors: {
      title: 'h1.product-title, h1, .product-name',
      price: '.price, [data-price], .product-price',
      originalPrice: '.was-price, .old-price, s, del',
      image: '.product-image img, .main-image img',
      description: '.product-description, .description'
    },
    searchUrl: 'https://www.manomano.fr/search?q=',
    affiliateParam: 'utm_source=africart'
  },
  'kaufland.de': {
    name: 'Kaufland',
    country: 'Germany',
    region: 'Europe',
    currency: 'EUR',
    flag: '🇩🇪',
    selectors: {
      title: 'h1.product-title, h1, .product-name',
      price: '.price, [data-price], .product-price',
      originalPrice: '.was-price, .old-price, s, del',
      image: '.product-image img, .main-image img',
      description: '.product-description, .description'
    },
    searchUrl: 'https://www.kaufland.de/search?q=',
    affiliateParam: 'utm_source=africart'
  },
  'darty.com': {
    name: 'Darty',
    country: 'France',
    region: 'Europe',
    currency: 'EUR',
    flag: '🇫🇷',
    selectors: {
      title: 'h1.product-title, h1, .product-name',
      price: '.price, [data-price], .product-price',
      originalPrice: '.was-price, .old-price, s, del',
      image: '.product-image img, .main-image img',
      description: '.product-description, .description'
    },
    searchUrl: 'https://www.darty.com/nav/recherche?text=',
    affiliateParam: 'utm_source=africart'
  },
  'laredoute.fr': {
    name: 'La Redoute',
    country: 'France',
    region: 'Europe',
    currency: 'EUR',
    flag: '🇫🇷',
    selectors: {
      title: 'h1.product-title, h1, .product-name',
      price: '.price, [data-price], .product-price',
      originalPrice: '.was-price, .old-price, s, del',
      image: '.product-image img, .main-image img',
      description: '.product-description, .description'
    },
    searchUrl: 'https://www.laredoute.fr/psr.aspx?kw=',
    affiliateParam: 'utm_source=africart'
  },
  'emag.ro': {
    name: 'eMAG',
    country: 'Romania',
    region: 'Europe',
    currency: 'RON',
    flag: '🇷🇴',
    selectors: {
      title: 'h1.product-title, h1, .product-name',
      price: '.price, [data-price], .product-price',
      originalPrice: '.was-price, .old-price, s, del',
      image: '.product-image img, .main-image img',
      description: '.product-description, .description'
    },
    searchUrl: 'https://www.emag.ro/search/',
    affiliateParam: 'utm_source=africart'
  },
  'emag.bg': {
    name: 'eMAG Bulgaria',
    country: 'Bulgaria',
    region: 'Europe',
    currency: 'BGN',
    flag: '🇧🇬',
    selectors: {
      title: 'h1.product-title, h1, .product-name',
      price: '.price, [data-price], .product-price',
      originalPrice: '.was-price, .old-price, s, del',
      image: '.product-image img, .main-image img',
      description: '.product-description, .description'
    },
    searchUrl: 'https://www.emag.bg/search/',
    affiliateParam: 'utm_source=africart'
  },
  'emag.hu': {
    name: 'eMAG Hungary',
    country: 'Hungary',
    region: 'Europe',
    currency: 'HUF',
    flag: '🇭🇺',
    selectors: {
      title: 'h1.product-title, h1, .product-name',
      price: '.price, [data-price], .product-price',
      originalPrice: '.was-price, .old-price, s, del',
      image: '.product-image img, .main-image img',
      description: '.product-description, .description'
    },
    searchUrl: 'https://www.emag.hu/search/',
    affiliateParam: 'utm_source=africart'
  },
  
  // ============================================
  // UNITED STATES - MAJOR E-COMMERCE
  // ============================================
  
  'amazon.com': {
    name: 'Amazon',
    country: 'United States',
    region: 'North America',
    currency: 'USD',
    flag: '🇺🇸',
    selectors: {
      title: '#productTitle, h1.a-size-large, h1',
      price: '.a-price .a-offscreen, .a-price-whole, .price',
      originalPrice: '.a-price-was, .a-text-strike, s, del',
      image: '#landingImage, #imgBlkFront, .a-dynamic-image',
      description: '#productDescription, #feature-bullets'
    },
    searchUrl: 'https://www.amazon.com/s?k=',
    affiliateParam: 'tag=africart-20'
  },
  'ebay.com': {
    name: 'eBay',
    country: 'United States',
    region: 'North America',
    currency: 'USD',
    flag: '🇺🇸',
    selectors: {
      title: 'h1#x-item-title-label, h1, .product-title',
      price: '.notranslate, .price, [data-price]',
      originalPrice: '.was-price, .old-price, s, del',
      image: '.img-wrap img, .product-image img',
      description: '.product-description, .description'
    },
    searchUrl: 'https://www.ebay.com/sch/i.html?_nkw=',
    affiliateParam: 'utm_source=africart'
  },
  'walmart.com': {
    name: 'Walmart',
    country: 'United States',
    region: 'North America',
    currency: 'USD',
    flag: '🇺🇸',
    selectors: {
      title: 'h1.prod-ProductTitle, h1, .product-title',
      price: '.price-current, .price, [data-price]',
      originalPrice: '.price-was, .old-price, s, del',
      image: '.prod-hero-image img, .product-image img',
      description: '.product-description, .description'
    },
    searchUrl: 'https://www.walmart.com/search?q=',
    affiliateParam: 'utm_source=africart'
  },
  'target.com': {
    name: 'Target',
    country: 'United States',
    region: 'North America',
    currency: 'USD',
    flag: '🇺🇸',
    selectors: {
      title: 'h1[data-test="product-title"], h1, .product-title',
      price: '[data-test="product-price"], .price, [data-price]',
      originalPrice: '.was-price, .old-price, s, del',
      image: '[data-test="product-image"] img, .product-image img',
      description: '.product-description, .description'
    },
    searchUrl: 'https://www.target.com/s?searchTerm=',
    affiliateParam: 'utm_source=africart'
  },
  'bestbuy.com': {
    name: 'Best Buy',
    country: 'United States',
    region: 'North America',
    currency: 'USD',
    flag: '🇺🇸',
    selectors: {
      title: 'h1.heading-5, h1, .product-title',
      price: '.priceView-customer-price, .price, [data-price]',
      originalPrice: '.priceView-was-price, .old-price, s, del',
      image: '.product-image img, .main-image img',
      description: '.product-description, .description'
    },
    searchUrl: 'https://www.bestbuy.com/site/searchpage.jsp?st=',
    affiliateParam: 'utm_source=africart'
  },
  'costco.com': {
    name: 'Costco',
    country: 'United States',
    region: 'North America',
    currency: 'USD',
    flag: '🇺🇸',
    selectors: {
      title: 'h1.product-title, h1, .product-name',
      price: '.price, [data-price], .product-price',
      originalPrice: '.was-price, .old-price, s, del',
      image: '.product-image img, .main-image img',
      description: '.product-description, .description'
    },
    searchUrl: 'https://www.costco.com/CatalogSearch?dept=All&keyword=',
    affiliateParam: 'utm_source=africart'
  },
  'homedepot.com': {
    name: 'Home Depot',
    country: 'United States',
    region: 'North America',
    currency: 'USD',
    flag: '🇺🇸',
    selectors: {
      title: 'h1.product-title, h1, .product-name',
      price: '.price, [data-price], .product-price',
      originalPrice: '.was-price, .old-price, s, del',
      image: '.product-image img, .main-image img',
      description: '.product-description, .description'
    },
    searchUrl: 'https://www.homedepot.com/s/',
    affiliateParam: 'utm_source=africart'
  },
  'etsy.com': {
    name: 'Etsy',
    country: 'United States',
    region: 'North America',
    currency: 'USD',
    flag: '🇺🇸',
    selectors: {
      title: 'h1.wt-text-body-01, h1, .product-title',
      price: '.wt-text-title-03, .price, [data-price]',
      originalPrice: '.was-price, .old-price, s, del',
      image: '.image-carousel img, .product-image img',
      description: '.product-description, .description'
    },
    searchUrl: 'https://www.etsy.com/search?q=',
    affiliateParam: 'utm_source=africart'
  },
  
  // ============================================
  // GLOBAL STORES
  // ============================================
  
  'temu.com': {
    name: 'Temu',
    country: 'Global',
    region: 'Global',
    currency: 'USD',
    flag: '🌍',
    selectors: {
      title: 'h1.product-title, h1, .product-name, [data-testid="product-title"]',
      price: '.price, [data-price], .product-price, [data-testid="price"]',
      originalPrice: '.was-price, .old-price, s, del',
      image: '.product-image img, .main-image img, [data-testid="product-image"]',
      description: '.product-description, .description'
    },
    searchUrl: 'https://www.temu.com/search_result.html?search_key=',
    affiliateParam: 'utm_source=africart'
  },
  'shein.com': {
    name: 'Shein',
    country: 'Global',
    region: 'Global',
    currency: 'USD',
    flag: '🌍',
    selectors: {
      title: 'h1.product-title, h1, .product-name, .product-intro__head-name',
      price: '.price, [data-price], .product-price, .price-current',
      originalPrice: '.was-price, .old-price, s, del',
      image: '.product-image img, .main-image img, .product-intro__main-img',
      description: '.product-description, .description, .product-intro__head-desc'
    },
    searchUrl: 'https://www.shein.com/pdsearch/?keyword=',
    affiliateParam: 'utm_source=africart'
  },
  'aliexpress.com': {
    name: 'AliExpress',
    country: 'Global',
    region: 'Global',
    currency: 'USD',
    flag: '🌍',
    selectors: {
      title: 'h1.product-title-text, h1, .product-title',
      price: '.price-current, .price, [data-price]',
      originalPrice: '.price-was, .old-price, s, del',
      image: '.images-view-item img, .product-image img',
      description: '.product-description, .description'
    },
    searchUrl: 'https://www.aliexpress.com/wholesale?SearchText=',
    affiliateParam: 'utm_source=africart'
  }
};

// Detect current store
function detectStore() {
  const hostname = window.location.hostname;
  
  // Remove www. prefix
  const cleanHost = hostname.replace(/^www\./, '');
  
  // Check for exact match first
  if (AFRICAN_STORES[cleanHost]) {
    return AFRICAN_STORES[cleanHost];
  }
  
  // Check for partial matches (e.g., jumia.com.ng variations)
  for (const [domain, config] of Object.entries(AFRICAN_STORES)) {
    if (hostname.includes(domain) || cleanHost.includes(domain)) {
      return config;
    }
  }
  
  return null;
}

// Extract product information
function extractProductInfo(storeConfig) {
  if (!storeConfig) return null;
  
  const info = {
    store: storeConfig.name,
    country: storeConfig.country,
    currency: storeConfig.currency,
    flag: storeConfig.flag,
    title: '',
    price: '',
    originalPrice: '',
    discount: '',
    image: '',
    description: '',
    url: window.location.href
  };
  
  // Extract title - improved detection with validation
  let titleFound = false;
  for (const selector of storeConfig.selectors.title.split(',')) {
    const element = document.querySelector(selector.trim());
    if (element) {
      const titleText = element.textContent.trim();
      // Validate: title should be meaningful (not empty, not too short, not generic)
      if (titleText && titleText.length > 5 && 
          !titleText.toLowerCase().includes('loading') &&
          !titleText.toLowerCase().includes('error') &&
          titleText !== 'Product Title' &&
          titleText !== 'Product') {
        info.title = titleText;
        titleFound = true;
        break;
      }
    }
  }
  
  // Fallback: try to find any meaningful h1 if selectors failed
  if (!titleFound) {
    const h1Elements = document.querySelectorAll('h1');
    for (const h1 of h1Elements) {
      const text = h1.textContent.trim();
      if (text && text.length > 5 && 
          !text.toLowerCase().includes('loading') &&
          !text.toLowerCase().includes('error')) {
        info.title = text;
        break;
      }
    }
  }
  
  // Extract price - look for both original (strikethrough) and current price
  // First, try to find original price (usually has strikethrough, line-through, or old-price class)
  const originalPriceSelectors = [
    '.old-price', '.original-price', '.was-price', '.previous-price',
    '[class*="old"]', '[class*="original"]', '[class*="was"]',
    's', 'del', 'strike', '[style*="text-decoration: line-through"]',
    '.price-old', '.price-was', '.price-original'
  ];
  
  for (const selector of originalPriceSelectors) {
    const element = document.querySelector(selector);
    if (element) {
      const originalText = element.textContent.trim();
      info.originalPrice = originalText.replace(/[^\d.,]/g, '').trim();
      break;
    }
  }
  
  // Extract current/discounted price - improved validation
  for (const selector of storeConfig.selectors.price.split(',')) {
    const element = document.querySelector(selector.trim());
    if (element) {
      const priceText = element.textContent.trim();
      // Clean price text (remove currency symbols, keep numbers)
      const cleanedPrice = priceText.replace(/[^\d.,]/g, '').trim();
      
      // Validate: price should be a valid number
      const priceNum = parseFloat(cleanedPrice.replace(/,/g, ''));
      if (!isNaN(priceNum) && priceNum > 0) {
        // If we found an original price, this is the discounted price
        if (info.originalPrice && cleanedPrice !== info.originalPrice) {
          info.price = cleanedPrice;
        } else if (!info.originalPrice) {
          // No original price found, this is the regular price
          info.price = cleanedPrice;
        }
        break;
      }
    }
  }
  
  // Fallback: look for price in data attributes
  if (!info.price) {
    const priceElements = document.querySelectorAll('[data-price], [data-price-value], [data-amount]');
    for (const el of priceElements) {
      const priceValue = el.getAttribute('data-price') || el.getAttribute('data-price-value') || el.getAttribute('data-amount');
      if (priceValue) {
        const cleaned = priceValue.replace(/[^\d.,]/g, '').trim();
        const priceNum = parseFloat(cleaned.replace(/,/g, ''));
        if (!isNaN(priceNum) && priceNum > 0) {
          info.price = cleaned;
          break;
        }
      }
    }
  }
  
  // Calculate discount if we have both prices
  if (info.originalPrice && info.price) {
    const original = parseFloat(info.originalPrice.replace(/,/g, ''));
    const current = parseFloat(info.price.replace(/,/g, ''));
    if (!isNaN(original) && !isNaN(current) && original > current) {
      const discountAmount = original - current;
      const discountPercent = ((discountAmount / original) * 100).toFixed(0);
      info.discount = `${discountPercent}% OFF`;
    }
  }
  
  // Extract image
  for (const selector of storeConfig.selectors.image.split(',')) {
    const element = document.querySelector(selector.trim());
    if (element) {
      info.image = element.src || element.getAttribute('data-src') || element.getAttribute('srcset')?.split(',')[0]?.trim();
      break;
    }
  }
  
  // Extract description (first 200 chars)
  for (const selector of storeConfig.selectors.description.split(',')) {
    const element = document.querySelector(selector.trim());
    if (element) {
      info.description = element.textContent.trim().substring(0, 200);
      break;
    }
  }
  
  return info;
}

// Get all available stores for comparison (location-aware)
async function getComparisonStores(currentStore, userCountry = null, userRegion = null) {
  const stores = [];
  const seenDomains = new Set();
  
  // If user country is provided, prioritize same country stores
  let priorityStores = [];
  let sameRegionStores = [];
  let otherStores = [];
  
  for (const [domain, config] of Object.entries(AFRICAN_STORES)) {
    // Skip current store and duplicates
    if (domain === currentStore || seenDomains.has(domain)) continue;
    seenDomains.add(domain);
    
    const storeData = {
      domain: domain,
      ...config
    };
    
    // Prioritize: Same country > Same region > Global > Others
    if (userCountry && config.country === userCountry) {
      priorityStores.push(storeData);
    } else if (userRegion && config.region === userRegion) {
      sameRegionStores.push(storeData);
    } else if (config.region === 'Global') {
      otherStores.push(storeData);
    } else {
      otherStores.push(storeData);
    }
  }
  
  // Return prioritized list: same country first, then region, then others
  return [...priorityStores, ...sameRegionStores, ...otherStores];
}

// Main extraction function (async for location detection + smart parsing)
async function extractProductData() {
  const hostname = window.location.hostname;
  const storeConfig = detectStore();
  
  if (!storeConfig) {
    return {
      success: false,
      error: 'Not on a supported e-commerce site',
      data: null
    };
  }
  
  // Use smart parser if available, otherwise fallback to basic extraction
  let productInfo;
  if (typeof africartParser !== 'undefined') {
    const parsed = africartParser.parse(hostname, document);
    productInfo = {
      store: parsed.store || storeConfig.name,
      country: storeConfig.country,
      region: storeConfig.region,
      currency: storeConfig.currency,
      flag: storeConfig.flag,
      title: parsed.title || '',
      price: parsed.price || '',
      originalPrice: parsed.originalPrice || '',
      image: parsed.image || '',
      description: parsed.description || '',
      availability: parsed.availability || 'unknown',
      rating: parsed.rating || null,
      url: window.location.href
    };
  } else {
    productInfo = extractProductInfo(storeConfig);
  }
  
  // Detect coupons on page
  let coupons = [];
  if (typeof africartParser !== 'undefined') {
    coupons = africartParser.detectCoupons(document);
    // Save coupons to storage
    if (coupons.length > 0 && typeof africartStorage !== 'undefined') {
      coupons.forEach(coupon => {
        africartStorage.saveCoupon(storeConfig.name, coupon.code, null);
      });
    }
  }
  
  // Save price history
  if (typeof africartStorage !== 'undefined') {
    await africartStorage.savePriceHistory(window.location.href, productInfo);
  }
  
  // Get user's location for tailored recommendations
  let userCountry = null;
  let userRegion = null;
  
  try {
    const userLocation = await getUserLocation();
    userCountry = userLocation.country;
    userRegion = userLocation.region;
  } catch (error) {
    // Fallback: use store's country as default
    userCountry = storeConfig.country;
    userRegion = storeConfig.region;
  }
  
  const comparisonStores = await getComparisonStores(
    window.location.hostname.replace(/^www\./, ''),
    userCountry,
    userRegion
  );
  
  // Get price history trend
  let priceTrend = null;
  if (typeof africartStorage !== 'undefined') {
    priceTrend = await africartStorage.getPriceTrend(window.location.href);
  }
  
  return {
    success: true,
    data: {
      currentStore: {
        domain: window.location.hostname.replace(/^www\./, ''),
        ...storeConfig
      },
      product: productInfo,
      comparisonStores: comparisonStores,
      userLocation: {
        country: userCountry,
        region: userRegion
      },
      coupons: coupons,
      priceTrend: priceTrend
    }
  };
}

// Get user location (simplified - can be enhanced with IP geolocation)
async function getUserLocation() {
  try {
    // Check if user has set preference
    const settings = await chrome.storage.local.get(['userCountry', 'userRegion']);
    if (settings.userCountry) {
      return {
        country: settings.userCountry,
        region: settings.userRegion || 'West Africa'
      };
    }
    
    // Try to detect from current store
    const storeConfig = detectStore();
    if (storeConfig) {
      return {
        country: storeConfig.country,
        region: storeConfig.region
      };
    }
    
    // Default fallback
    return {
      country: 'Nigeria',
      region: 'West Africa'
    };
  } catch (error) {
    return {
      country: 'Nigeria',
      region: 'West Africa'
    };
  }
}

// Listen for messages from side panel
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  // Handle ping to check if content script is ready
  if (request.action === 'ping') {
    sendResponse({ success: true, ready: true });
    return false;
  }
  
  if (request.action === 'getProductInfo') {
    // Make async handler
    extractProductData().then(result => {
      sendResponse(result);
    }).catch(error => {
      console.error('[AfriCart Content] Error extracting product data:', error);
      sendResponse({
        success: false,
        error: error.message || 'Failed to extract product information',
        data: null
      });
    });
    return true; // Keep channel open for async response
  }
  
  if (request.action === 'getStoreConfig') {
    const storeConfig = detectStore();
    sendResponse({ success: !!storeConfig, data: storeConfig });
    return false;
  }
  
  if (request.action === 'getUserLocation') {
    getUserLocation().then(location => {
      sendResponse({ success: true, data: location });
    }).catch(error => {
      sendResponse({ success: false, data: null });
    });
    return true; // Keep channel open for async response
  }
  
  return false;
});

// Notify that content script is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    notifyContentScriptReady();
  });
} else {
  notifyContentScriptReady();
}

function notifyContentScriptReady() {
  // Send ready signal to background
  try {
    chrome.runtime.sendMessage({
      action: 'contentScriptReady',
      url: window.location.href,
      hostname: window.location.hostname
    }).catch(() => {
      // Background might not be listening, that's okay
    });
  } catch (error) {
    // Ignore errors
  }
}

// Auto-extract when page loads
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    // Page loaded
  });
} else {
  // Page already loaded
}

// Re-extract on navigation (for SPAs)
let lastUrl = location.href;
new MutationObserver(() => {
  const url = location.href;
  if (url !== lastUrl) {
    lastUrl = url;
    // Notify side panel of page change
    chrome.runtime.sendMessage({
      action: 'pageChanged',
      url: url
    }).catch(() => {});
  }
}).observe(document, { subtree: true, childList: true });
