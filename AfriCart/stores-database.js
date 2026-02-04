// AfriCart - Comprehensive Global E-Commerce Store Database
// All major stores across Africa, Europe, and USA

const GLOBAL_STORES = {
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
  'kilimall.co.ke': {
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

// Get user's country based on browser/extension settings
async function getUserCountry() {
  try {
    // Try to get from storage (user preference)
    const settings = await chrome.storage.local.get(['userCountry', 'userRegion']);
    if (settings.userCountry) {
      return {
        country: settings.userCountry,
        region: settings.region
      };
    }
    
    // Try to detect from browser language/timezone
    const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    const language = navigator.language || navigator.userLanguage;
    
    // Basic detection (can be enhanced)
    if (timezone.includes('Africa')) {
      // Try to detect specific African country
      if (timezone.includes('Lagos') || timezone.includes('Lagos')) {
        return { country: 'Nigeria', region: 'West Africa' };
      }
      if (timezone.includes('Johannesburg') || timezone.includes('Cape_Town')) {
        return { country: 'South Africa', region: 'Southern Africa' };
      }
      if (timezone.includes('Nairobi')) {
        return { country: 'Kenya', region: 'East Africa' };
      }
      if (timezone.includes('Cairo')) {
        return { country: 'Egypt', region: 'North Africa' };
      }
    }
    
    // Default to Nigeria if in Africa
    return { country: 'Nigeria', region: 'West Africa' };
  } catch (error) {
    return { country: 'Nigeria', region: 'West Africa' };
  }
}

// Filter stores by country/region
function getStoresForCountry(country, region) {
  const filtered = {};
  
  for (const [domain, store] of Object.entries(GLOBAL_STORES)) {
    // Include stores from same country
    if (store.country === country) {
      filtered[domain] = store;
    }
    // Include stores from same region
    else if (store.region === region) {
      filtered[domain] = store;
    }
    // Include global stores
    else if (store.region === 'Global') {
      filtered[domain] = store;
    }
  }
  
  return filtered;
}

// Export for use in content.js
if (typeof window !== 'undefined') {
  window.GLOBAL_STORES = GLOBAL_STORES;
  window.getUserCountry = getUserCountry;
  window.getStoresForCountry = getStoresForCountry;
}
