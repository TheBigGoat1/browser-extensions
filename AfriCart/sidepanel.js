// AfriCart - Side Panel Orchestrator
// Handles product extraction, price comparison, and link building.
// Best practice: defensive checks, single init flow, no global pollution.

let currentProductData = null;
let currentStoreConfig = null;

/** Safe getElementById – returns null if missing (avoids crashes) */
function getEl(id) {
  if (!id || typeof document === 'undefined') return null;
  return document.getElementById(id);
}

// Country name to 2-letter code (no emoji)
const COUNTRY_CODE = {
  'Nigeria': 'NG', 'South Africa': 'ZA', 'Kenya': 'KE', 'Egypt': 'EG',
  'Ghana': 'GH', 'Tanzania': 'TZ', 'Uganda': 'UG', 'Morocco': 'MA',
  'Algeria': 'DZ', "Côte d'Ivoire": 'CI', 'Senegal': 'SN',
  'United States': 'US', 'United Kingdom': 'UK', 'Germany': 'DE',
  'France': 'FR', 'Spain': 'ES', 'Italy': 'IT', 'Netherlands': 'NL',
  'Poland': 'PL', 'Romania': 'RO', 'Bulgaria': 'BG', 'Hungary': 'HU',
  'Global': '—'
};
function getCountryCode(store) {
  if (!store) return '—';
  if (store.countryCode) return store.countryCode;
  if (typeof store.flag === 'string' && store.flag.length === 2 && /^[A-Z]{2}$/i.test(store.flag)) return store.flag.toUpperCase();
  return COUNTRY_CODE[store.country] || (store.country ? store.country.slice(0, 2).toUpperCase() : '—');
}

/** Apply current language to UI (run after initI18n) */
function applyI18n() {
  if (typeof t !== 'function') return;
  const set = (id, key) => { const el = getEl(id); if (el) el.textContent = t(key); };
  set('taglineText', 'tagline');
  const sectionTitle = document.querySelector('#comparisonSection .section-title-simple');
  if (sectionTitle) sectionTitle.textContent = t('comparePrices');
  const sectionSub = document.querySelector('#comparisonSection .section-subtitle');
  if (sectionSub) sectionSub.textContent = t('compareSubtitle');
  const refreshBtn = getEl('refreshBtn');
  if (refreshBtn) { const span = refreshBtn.querySelector('.action-btn-text'); if (span) span.textContent = t('refresh'); }
  const copyBtn = getEl('copyLinkBtn');
  if (copyBtn) { const span = copyBtn.querySelector('.action-btn-text'); if (span) span.textContent = t('copyLink'); }
  const storeBadgeLabel = document.querySelector('.store-badge-label');
  if (storeBadgeLabel) storeBadgeLabel.textContent = t('currentStore');
}

// Initialize AfriCart (single entry, error-safe)
async function init() {
  try {
    if (typeof initI18n === 'function') await initI18n();
    applyI18n();
    setupEventListeners();
    await loadProductInfo();
  } catch (err) {
    console.error('[AfriCart] Init error:', err);
    const notSupported = getEl('notSupportedCard');
    if (notSupported) {
      notSupported.style.display = 'block';
      const desc = notSupported.querySelector('.info-description');
      if (desc) desc.textContent = 'Something went wrong. Try refreshing the page or reopening the panel.';
    }
  }
}

// Setup all event listeners (defensive: only attach when element exists)
function setupEventListeners() {
  const on = (id, event, fn) => {
    const el = getEl(id);
    if (el && typeof fn === 'function') el.addEventListener(event, fn);
  };

  on('refreshBtn', 'click', () => loadProductInfo());
  on('copyLinkBtn', 'click', () => copyProductLink());
  on('settingsBtn', 'click', () => { try { chrome.runtime.openOptionsPage(); } catch (e) {} });
  on('helpBtn', 'click', showHelp);
  on('statsBtn', 'click', showStats);
  on('wishlistBtn', 'click', () => toggleWishlist());
  on('currencyConverterBtn', 'click', () => toggleCurrencyConverter());
  on('priceHistoryBtn', 'click', () => togglePriceHistory());
  on('addToCompareBtn', 'click', () => addToMultiCompare());

  const closeHistory = getEl('closeHistoryBtn');
  if (closeHistory) closeHistory.addEventListener('click', () => {
    const section = getEl('priceHistorySection');
    if (section) section.style.display = 'none';
  });
  const closeConverter = getEl('closeConverterBtn');
  if (closeConverter) closeConverter.addEventListener('click', () => {
    const section = getEl('currencyConverterSection');
    if (section) section.style.display = 'none';
  });

  const converterAmount = getEl('converterAmount');
  const converterFrom = getEl('converterFrom');
  const converterTo = getEl('converterTo');
  if (converterAmount && converterFrom && converterTo) {
    converterAmount.addEventListener('input', convertCurrency);
    converterFrom.addEventListener('change', convertCurrency);
    converterTo.addEventListener('change', convertCurrency);
  }

  loadWishlist();
  loadMultiCompare();
}

// Load product information from current page
async function loadProductInfo() {
  showLoading();
  
  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    
    if (!tab || !tab.url) {
      showNotSupported('No active tab found');
      hideLoading();
      return;
    }
    
    // Check if URL is supported
    const isSupported = checkIfSupportedSite(tab.url);
    if (!isSupported) {
      showNotSupported('This site is not supported. Please navigate to a supported e-commerce site.');
      hideLoading();
      return;
    }
    
    // Wait for content script to be ready (with retry)
    let response = null;
    let retries = 3;
    
    // First, check if content script is ready with a ping
    let contentScriptReady = false;
    for (let i = 0; i < 3; i++) {
      try {
        const pingResponse = await chrome.tabs.sendMessage(tab.id, { action: 'ping' });
        if (pingResponse && pingResponse.ready) {
          contentScriptReady = true;
          break;
        }
      } catch (error) {
        // Content script not ready yet
      }
      
      if (!contentScriptReady && i < 2) {
        await new Promise(resolve => setTimeout(resolve, 200));
      }
    }
    
    // If content script not ready, try to inject it
    if (!contentScriptReady) {
      try {
        // Check if we have scripting permission
        await chrome.scripting.executeScript({
          target: { tabId: tab.id },
          files: ['parser.js', 'storage.js', 'content.js']
        });
        
        // Wait for script to initialize
        await new Promise(resolve => setTimeout(resolve, 500));
        
        // Verify it's ready
        try {
          const pingResponse = await chrome.tabs.sendMessage(tab.id, { action: 'ping' });
          contentScriptReady = pingResponse && pingResponse.ready;
        } catch (error) {
          contentScriptReady = false;
        }
      } catch (injectError) {
        console.error('[AfriCart] Failed to inject content script:', injectError);
        // Continue anyway - might work on retry
      }
    }
    
    // Now try to get product info with retries
    while (retries > 0) {
      try {
        response = await chrome.tabs.sendMessage(tab.id, { action: 'getProductInfo' });
        break; // Success, exit retry loop
      } catch (error) {
        retries--;
        
        if (retries === 0) {
          // All retries failed
          throw new Error('Could not establish connection to content script');
        } else {
          // Wait before retry
          await new Promise(resolve => setTimeout(resolve, 300));
        }
      }
    }
    
    if (response && response.success && response.data) {
      currentProductData = response.data;
      currentStoreConfig = response.data.currentStore;
      
      await displayProductInfo(response.data);
    } else {
      showNotSupported(response?.error || 'Product information not available. Please make sure you are on a product page.');
    }
  } catch (error) {
    console.error('[AfriCart] Error loading product info:', error);
    
    // More specific error messages
    if (error.message.includes('Receiving end does not exist')) {
      showNotSupported('Content script not loaded. Please refresh the page and try again.');
    } else if (error.message.includes('Could not establish connection')) {
      showNotSupported('Unable to connect to the page. Please refresh and try again.');
    } else {
      showNotSupported('Error extracting product information. Please refresh the page and try again.');
    }
  } finally {
    hideLoading();
  }
}

// Check if current URL is a supported site
function checkIfSupportedSite(url) {
  if (!url) return false;
  
  const supportedDomains = [
    'jumia', 'konga', 'slot', 'takealot', 'zando', 'superbalist',
    'kilimall', 'amanbo', 'copia', 'amazon', 'ebay', 'walmart',
    'target', 'bestbuy', 'costco', 'homedepot', 'etsy', 'wayfair',
    'vinted', 'lowes', 'kroger', 'poshmark', 'stockx', 'argos',
    'asos', 'zalando', 'otto', 'cdiscount', 'fnac', 'elcorteingles',
    'bol.com', 'allegro', 'temu', 'shein', 'aliexpress', 'noon',
    'makro', 'checkers', 'tospino', 'payporte', 'skygarden', 'masoko',
    'avechi', 'buytec', 'jiji', 'pigiame', 'kasha', 'shopzetu',
    'manomano', 'kaufland', 'darty', 'laredoute', 'emag'
  ];
  
  const urlLower = url.toLowerCase();
  return supportedDomains.some(domain => urlLower.includes(domain));
}

// Display product information
async function displayProductInfo(data) {
  const product = data.product;
  const store = data.currentStore;
  
  // Update store badge (country code, no emoji)
  const storeFlag = getEl('storeFlag');
  const storeNameEl = getEl('storeName');
  if (storeFlag) storeFlag.textContent = getCountryCode(store);
  if (storeNameEl) storeNameEl.textContent = store.name || '';
  
  // Update product info
  const productTitleEl = getEl('productTitle');
  const productPriceEl = getEl('productPrice');
  const productCurrencyEl = getEl('productCurrency');
  if (productTitleEl) productTitleEl.textContent = product.title || 'Product Title';
  if (productPriceEl) productPriceEl.textContent = product.price || '--';
  if (productCurrencyEl) productCurrencyEl.textContent = product.currency || 'NGN';

  const originalWrapper = getEl('originalPriceWrapper');
  const originalPriceEl = getEl('productOriginalPrice');
  const discountBadge = getEl('discountBadge');
  if (product.originalPrice && product.originalPrice !== product.price && originalWrapper) {
    if (originalPriceEl) originalPriceEl.textContent = `${product.currency || ''} ${product.originalPrice}`;
    if (discountBadge && product.discount) discountBadge.textContent = product.discount;
    originalWrapper.style.display = 'flex';
  } else if (originalWrapper) {
    originalWrapper.style.display = 'none';
  }
  
  // Update product image only (main product image – nothing else)
  const img = getEl('productImage');
  if (!img) return;
  if (product.image && /^https?:\/\//i.test(product.image)) {
    img.src = product.image;
    img.alt = product.title ? String(product.title).substring(0, 100) : 'Product';
    img.style.display = 'block';
    img.onerror = () => { img.style.display = 'none'; };
  } else {
    img.removeAttribute('src');
    img.alt = 'No product image';
    img.style.display = 'none';
  }
  
  // Advanced: Display price trend (CamelCamelCamel logic)
  if (data.priceTrend) {
    displayPriceTrend(data.priceTrend, product);
  }
  
  // Advanced: Display detected coupons
  if (data.coupons && data.coupons.length > 0) {
    displayCoupons(data.coupons, store.name);
  }
  
  // Country switcher removed - integrated into comparison section
  
  // v1.5: Track price history and check for price drops
  await trackPriceHistory(product, store);
  await checkPriceDrop(product);
  
  // v1.5: Check if product is in wishlist
  await updateWishlistButton(product);
  
  // v1.5: Calculate and display shipping
  await calculateShipping(product, store);
  
  const productCard = getEl('productCard');
  const notSupported = getEl('notSupportedCard');
  const comparisonSection = getEl('comparisonSection');
  if (productCard) productCard.style.display = 'block';
  if (notSupported) notSupported.style.display = 'none';
  if (comparisonSection) comparisonSection.style.display = 'block';
  
  // Display comparison stores with recommendations
  await displayComparisonStores(data);
}

// Display comparison stores - same product niche, with best price suggestion
async function displayComparisonStores(data) {
  const grid = document.getElementById('comparisonGrid');
  const bestPriceEl = document.getElementById('bestPriceSuggestion');
  grid.innerHTML = '';
  if (bestPriceEl) bestPriceEl.innerHTML = '';

  if (!data.comparisonStores || data.comparisonStores.length === 0) {
    const msg = typeof t === 'function' ? t('noStores') : 'No other stores available';
    grid.innerHTML = `<p class="no-stores">${msg}</p>`;
    return;
  }

  const userLocation = data.userLocation || {};
  const currentStore = data.currentStore;
  const product = data.product || {};

  const uniqueStores = [];
  const seenDomains = new Set();
  data.comparisonStores.forEach(store => {
    if (!seenDomains.has(store.domain) && store.domain !== currentStore.domain) {
      seenDomains.add(store.domain);
      uniqueStores.push(store);
    }
  });

  // Best price suggestion – same product comparison
  const currentPrice = (window.parsePrice || parsePriceUtil)(product.price);
  if (currentPrice && currentPrice > 0 && uniqueStores.length > 0 && bestPriceEl) {
    const bestDeal = await calculateBestDeal(uniqueStores, currentPrice, product, userLocation);
    if (bestDeal && bestDeal.store) {
      const card = createRecommendationCard(bestDeal, product.title || '');
      bestPriceEl.appendChild(card);
    }
  }

  const localStores = [];
  const globalStores = [];
  const otherStores = [];
  uniqueStores.forEach(store => {
    if (userLocation.country && store.country === userLocation.country) {
      localStores.push(store);
    } else if (store.region === 'Global') {
      globalStores.push(store);
    } else {
      otherStores.push(store);
    }
  });

  const storesLabel = typeof t === 'function' ? t('stores') : 'stores';
  const storesInLabel = typeof t === 'function' ? t('storesIn') : 'Stores in';
  const worldwideLabel = typeof t === 'function' ? t('worldwideStores') : 'Worldwide';
  const otherCountriesLabel = typeof t === 'function' ? t('otherCountries') : 'Other Countries';
  const viewMoreLabel = typeof t === 'function' ? t('viewMoreStores') : 'View more stores';

  if (localStores.length > 0 && userLocation.country) {
    const localHeader = document.createElement('div');
    localHeader.className = 'local-stores-header';
    localHeader.innerHTML = `
      <span class="local-flag store-country-code-simple">${getCountryCode(localStores[0])}</span>
      <span class="local-title">${storesInLabel} ${userLocation.country}</span>
      <span class="local-badge">${localStores.length} ${storesLabel}</span>
    `;
    grid.appendChild(localHeader);
    localStores.forEach(store => {
      const button = createStoreButtonSimple(store, data.product.title);
      button.classList.add('local-store-button');
      grid.appendChild(button);
    });
  }

  if (globalStores.length > 0) {
    const worldHeader = document.createElement('div');
    worldHeader.className = 'other-stores-header worldwide-header';
    worldHeader.innerHTML = `
      <span class="other-title">${worldwideLabel}</span>
      <span class="other-count">${globalStores.length} ${storesLabel}</span>
    `;
    grid.appendChild(worldHeader);
    globalStores.slice(0, 6).forEach(store => {
      grid.appendChild(createStoreButtonSimple(store, data.product.title));
    });
    if (globalStores.length > 6) {
      const viewMoreBtn = document.createElement('button');
      viewMoreBtn.className = 'view-more-btn';
      viewMoreBtn.textContent = `${viewMoreLabel} (${globalStores.length - 6})`;
      viewMoreBtn.onclick = () => {
        viewMoreBtn.remove();
        globalStores.slice(6).forEach(store => {
          grid.appendChild(createStoreButtonSimple(store, data.product.title));
        });
      };
      grid.appendChild(viewMoreBtn);
    }
  }
  
  if (otherStores.length > 0) {
    const otherHeader = document.createElement('div');
    otherHeader.className = 'other-stores-header';
    otherHeader.innerHTML = `
      <span class="other-title">${otherCountriesLabel}</span>
      <span class="other-count">${otherStores.length} ${storesLabel}</span>
    `;
    grid.appendChild(otherHeader);
    const storesByCountry = {};
    otherStores.forEach(store => {
      if (!storesByCountry[store.country]) storesByCountry[store.country] = [];
      storesByCountry[store.country].push(store);
    });
    let shownCount = 0;
    Object.entries(storesByCountry).forEach(([country, stores]) => {
      if (shownCount >= 3) return;
      stores.slice(0, 2).forEach(store => {
        if (shownCount < 3) {
          grid.appendChild(createStoreButtonSimple(store, data.product.title));
          shownCount++;
        }
      });
    });
    if (otherStores.length > 3) {
      const viewMoreBtn = document.createElement('button');
      viewMoreBtn.className = 'view-more-btn';
      viewMoreBtn.textContent = `${viewMoreLabel} (${otherStores.length - 3})`;
      viewMoreBtn.onclick = () => {
        viewMoreBtn.remove();
        otherStores.slice(3).forEach(store => {
          grid.appendChild(createStoreButtonSimple(store, data.product.title));
        });
      };
      grid.appendChild(viewMoreBtn);
    }
  }
}

// Create simple store button (compact)
function createStoreButtonSimple(store, productTitle) {
  const button = document.createElement('button');
  button.className = 'store-button-simple';
  button.innerHTML = `
    <span class="store-flag-simple store-country-code-simple">${getCountryCode(store)}</span>
    <span class="store-name-simple">${store.name}</span>
    <svg class="store-arrow" width="16" height="16" viewBox="0 0 16 16" fill="none">
      <path d="M6 12L10 8L6 4" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
    </svg>
  `;
  
  button.addEventListener('click', () => {
    openStoreSearch(store, productTitle);
  });
  
  return button;
}

// Calculate best deal based on price and ratings (location-aware)
async function calculateBestDeal(stores, currentPrice, product, userLocation = {}) {
  if (!stores || stores.length === 0) return null;
  
  // Simulate ratings (in production, fetch from APIs)
  const storeRatings = {
    // Africa
    'Jumia Nigeria': 4.5, 'Konga': 4.3, 'Slot': 4.2, 'PayPorte': 4.1,
    'Takealot': 4.6, 'Zando': 4.4, 'Superbalist': 4.3, 'Amazon South Africa': 4.7,
    'Makro': 4.5, 'Checkers Sixty60': 4.2,
    'Jumia Kenya': 4.4, 'Kilimall': 4.1, 'Amanbo': 4.0, 'Copia': 3.9,
    'Skygarden': 4.2, 'Masoko': 4.0, 'Avechi': 4.3, 'Buytec': 4.1,
    'Jiji Kenya': 4.0, 'Pigiame': 3.9, 'Kasha': 4.2, 'Shop Zetu': 4.1,
    'Jumia Egypt': 4.4, 'Amazon Egypt': 4.6, 'Noon': 4.2,
    'Jumia Ghana': 4.3, 'Tospino': 4.0,
    'Jumia Tanzania': 4.2, 'Jumia Uganda': 4.1,
    'Jumia Morocco': 4.3, 'Jumia Algeria': 4.2,
    'Jumia Côte d\'Ivoire': 4.1, 'Jumia Senegal': 4.0,
    // USA
    'Amazon': 4.8, 'eBay': 4.5, 'Walmart': 4.6, 'Target': 4.5,
    'Best Buy': 4.7, 'Costco': 4.6, 'Home Depot': 4.5, 'Etsy': 4.4,
    'Wayfair': 4.5, 'Vinted': 4.2, 'Lowe\'s': 4.4, 'Kroger': 4.3,
    'Poshmark': 4.1, 'StockX': 4.3,
    // Europe
    'Amazon UK': 4.7, 'eBay UK': 4.4, 'Argos': 4.3, 'ASOS': 4.4,
    'Amazon Germany': 4.7, 'Zalando': 4.5, 'OTTO': 4.4,
    'Amazon France': 4.7, 'Cdiscount': 4.4, 'Fnac': 4.5, 'Darty': 4.4,
    'ManoMano': 4.3, 'La Redoute': 4.2,
    'Amazon Spain': 4.6, 'El Corte Inglés': 4.4,
    'Amazon Italy': 4.6, 'Amazon Netherlands': 4.6, 'Bol.com': 4.5,
    'Allegro': 4.4, 'Kaufland': 4.3,
    'eMAG': 4.3, 'eMAG Bulgaria': 4.2, 'eMAG Hungary': 4.2,
    // Global
    'Temu': 4.0, 'Shein': 4.1, 'AliExpress': 4.2
  };
  
  // Score stores: lower price = better, higher rating = better, location bonus
  const scoredStores = stores.map(store => {
    const rating = storeRatings[store.name] || 4.0;
    // Estimate price (in production, fetch actual prices)
    const estimatedPrice = currentPrice * (0.85 + Math.random() * 0.3); // 85-115% of current
    const priceScore = (currentPrice - estimatedPrice) / currentPrice; // Positive if cheaper
    const ratingScore = (rating - 3.5) / 1.5; // Normalize rating
    
    // Location bonus: same country gets +0.2, same region gets +0.1
    let locationBonus = 0;
    if (userLocation.country && store.country === userLocation.country) {
      locationBonus = 0.2;
    } else if (userLocation.region && store.region === userLocation.region) {
      locationBonus = 0.1;
    }
    
    const totalScore = (priceScore * 0.5) + (ratingScore * 0.3) + locationBonus; // 50% price, 30% rating, 20% location
    
    // Add product category bonus (electronics stores for electronics, fashion for fashion, etc.)
    const productTitle = (product.title || '').toLowerCase();
    let categoryBonus = 0;
    if (productTitle.includes('phone') || productTitle.includes('laptop') || productTitle.includes('tablet') || productTitle.includes('camera') || productTitle.includes('headphone') || productTitle.includes('speaker')) {
      if (store.name.includes('Best Buy') || store.name.includes('Buytec') || store.name.includes('Avechi') || store.name.includes('Fnac') || store.name.includes('Darty')) {
        categoryBonus = 0.1;
      }
    } else if (productTitle.includes('dress') || productTitle.includes('shirt') || productTitle.includes('shoes') || productTitle.includes('fashion') || productTitle.includes('clothing') || productTitle.includes('bag')) {
      if (store.name.includes('Zalando') || store.name.includes('ASOS') || store.name.includes('Shein') || store.name.includes('Poshmark') || store.name.includes('Vinted') || store.name.includes('La Redoute')) {
        categoryBonus = 0.1;
      }
    } else if (productTitle.includes('furniture') || productTitle.includes('home') || productTitle.includes('decor') || productTitle.includes('kitchen') || productTitle.includes('garden')) {
      if (store.name.includes('Wayfair') || store.name.includes('ManoMano') || store.name.includes('Home Depot') || store.name.includes('Lowe') || store.name.includes('IKEA')) {
        categoryBonus = 0.1;
      }
    } else if (productTitle.includes('grocery') || productTitle.includes('food') || productTitle.includes('beverage')) {
      if (store.name.includes('Kroger') || store.name.includes('Checkers')) {
        categoryBonus = 0.1;
      }
    }
    
    const finalScore = totalScore + categoryBonus;
    
    return {
      store,
      estimatedPrice,
      rating,
      score: finalScore
    };
  });
  
  // Sort by score (highest = best deal)
  scoredStores.sort((a, b) => b.score - a.score);
  const best = scoredStores[0];
  
  if (best && best.score > 0) {
    return {
      store: best.store,
      estimatedPrice: best.estimatedPrice,
      rating: best.rating,
      savings: currentPrice - best.estimatedPrice,
      savingsPercent: ((currentPrice - best.estimatedPrice) / currentPrice * 100).toFixed(1)
    };
  }
  
  return null;
}

// Create recommendation card (best price suggestion – same product)
function createRecommendationCard(bestDeal, productTitle) {
  const safeTitle = String(productTitle || '').replace(/"/g, '&quot;').replace(/</g, '&lt;').substring(0, 200);
  const card = document.createElement('div');
  card.className = 'best-deal-card';
  card.setAttribute('aria-label', 'Best price suggestion for this product');
  card.innerHTML = `
    <div class="best-deal-badge">
      <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
        <path d="M10 2L12.09 7.26L18 8.27L14 12.14L14.91 18.02L10 15.77L5.09 18.02L6 12.14L2 8.27L7.91 7.26L10 2Z" fill="currentColor"/>
      </svg>
      <span>BEST PRICE SUGGESTION</span>
    </div>
    <div class="best-deal-content">
      <div class="best-deal-store">
        <span class="best-deal-flag store-country-code-simple">${getCountryCode(bestDeal.store)}</span>
        <div class="best-deal-info">
          <h4 class="best-deal-name">${bestDeal.store.name}</h4>
          <div class="best-deal-rating">
            <span class="rating-stars" aria-label="${bestDeal.rating.toFixed(1)} stars">${bestDeal.rating.toFixed(1)}</span>
            <span class="rating-value">${bestDeal.rating.toFixed(1)}</span>
          </div>
        </div>
      </div>
      <div class="best-deal-price">
        <div class="best-deal-estimated">Est. ${bestDeal.store.currency} ${(bestDeal.estimatedPrice || 0).toFixed(2)}</div>
        <div class="best-deal-savings">Save ~${bestDeal.savingsPercent || 0}%</div>
      </div>
      <button type="button" class="best-deal-button" data-title="${safeTitle}">
        Check price on ${bestDeal.store.name}
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
          <path d="M6 12L10 8L6 4" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
      </button>
      <div class="best-deal-reason">
        <span class="reason-text">Same product – often best value in this category</span>
      </div>
    </div>
  `;

  const btn = card.querySelector('.best-deal-button');
  if (btn) btn.addEventListener('click', () => openStoreSearch(bestDeal.store, productTitle || ''));

  return card;
}

// Create store comparison button
function createStoreButton(store, productTitle, bestDeal) {
  const isBestDeal = bestDeal && bestDeal.store.domain === store.domain;
  const button = document.createElement('button');
  button.className = `store-button ${isBestDeal ? 'best-deal-highlight' : ''}`;
  button.innerHTML = `
    <div class="store-button-content">
      <span class="store-button-flag store-country-code-simple">${getCountryCode(store)}</span>
      <div class="store-button-info">
        <span class="store-button-name">${store.name}${isBestDeal ? ' • Best' : ''}</span>
        <span class="store-button-country">${store.country}</span>
      </div>
      <svg class="store-button-icon" width="16" height="16" viewBox="0 0 16 16" fill="none">
        <path d="M6 12L10 8L6 4" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
      </svg>
    </div>
  `;
  
  button.addEventListener('click', () => {
    openStoreSearch(store, productTitle);
  });
  
  return button;
}

// Open store search in new tab
async function openStoreSearch(store, productTitle) {
  if (!productTitle || !productTitle.trim()) {
    alert('Product title not available. Please refresh the page.');
    return;
  }
  
  // Step 1: Detection - Product title is already extracted
  // Step 2: Cleaning - URL encode the product title (handles spaces, special chars)
  const searchQuery = encodeURIComponent(productTitle.trim());
  
  // Step 3: Hopping - Build the search URL
  let searchUrl = store.searchUrl;
  
  // Handle different URL patterns
  if (store.searchUrl.endsWith('/search/')) {
    // For stores like Amanbo that end with /search/
    searchUrl += '?q=' + searchQuery;
  } else if (store.searchUrl.includes('?')) {
    // URL already has query parameters
    searchUrl += (searchUrl.endsWith('=') ? '' : '&q=') + searchQuery;
  } else {
    // Standard pattern - append query
    searchUrl += searchQuery;
  }
  
  // ALWAYS add affiliate parameter (ready for rewards)
  if (store.affiliateParam) {
    const separator = searchUrl.includes('?') ? '&' : '?';
    searchUrl += separator + store.affiliateParam;
  }
  
  // Track usage for analytics
  chrome.runtime.sendMessage({
    action: 'trackHop',
    store: store.name
  }).catch(() => {});
  
  // Always open in new tab for comparison
  chrome.tabs.create({ url: searchUrl });
}

// Copy product link
async function copyProductLink() {
  if (!currentProductData || !currentProductData.product) {
    alert('No product information available');
    return;
  }
  
  const productUrl = currentProductData.product.url || window.location.href;
  
  try {
    await navigator.clipboard.writeText(productUrl);
    const btn = getEl('copyLinkBtn');
    if (!btn) return;
    const original = btn.innerHTML;
    btn.innerHTML = '<svg class="btn-icon" width="18" height="18" viewBox="0 0 18 18" fill="none"><path d="M6 8L8 10L12 6" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg><span>Copied!</span>';
    setTimeout(() => {
      btn.innerHTML = original;
    }, 2000);
  } catch (error) {
    alert('Failed to copy link');
  }
}

// Show not supported message
function showNotSupported(message) {
  const productCard = getEl('productCard');
  const comparison = getEl('comparisonSection');
  const notSupported = getEl('notSupportedCard');
  if (productCard) productCard.style.display = 'none';
  if (comparison) comparison.style.display = 'none';
  if (notSupported) {
    notSupported.style.display = 'block';
    const infoContent = notSupported.querySelector('.info-content p');
    if (infoContent && message && message !== 'Product information not available') {
      infoContent.textContent = message;
    }
  }
}

// Show loading indicator
function showLoading() {
  const loading = getEl('loadingIndicator');
  const productCard = getEl('productCard');
  const comparison = getEl('comparisonSection');
  const notSupported = getEl('notSupportedCard');
  if (loading) loading.style.display = 'block';
  if (productCard) productCard.style.display = 'none';
  if (comparison) comparison.style.display = 'none';
  if (notSupported) notSupported.style.display = 'none';
}

// Hide loading indicator
function hideLoading() {
  const loading = getEl('loadingIndicator');
  if (loading) loading.style.display = 'none';
}

// Show help
function showHelp() {
  alert('AfriCart Help\n\n' +
    '• Open a product page on a supported e-commerce site (e.g. Kilimall, Jumia, Konga)\n' +
    '• Open AfriCart from the toolbar or press Ctrl+Shift+A\n' +
    '• Click any store button to search the same product on that store (new tab)\n' +
    '• Use Copy Link to share; Refresh to re-read the page\n\n' +
    'Supported: NG Jumia, Konga, Slot · ZA Takealot, Zando · KE Jumia, Kilimall · EG Jumia, Noon\n\n' +
    'Shortcut: Ctrl+Shift+A (Cmd+Shift+A on Mac)');
}

// Show stats
async function showStats() {
  try {
    const stats = await chrome.storage.local.get(['usageStats']);
    const usage = stats.usageStats || { totalHops: 0, hopsByStore: {} };
    
    let message = 'AfriCart Usage Statistics\n\n';
    message += `Total Price Comparisons: ${usage.totalHops}\n\n`;
    
    if (Object.keys(usage.hopsByStore).length > 0) {
      message += 'Comparisons by Store:\n';
      Object.entries(usage.hopsByStore)
        .sort((a, b) => b[1] - a[1])
        .forEach(([store, count]) => {
          message += `• ${store}: ${count}\n`;
        });
    } else {
      message += 'No comparisons yet. Start comparing prices!';
    }
    
    alert(message);
  } catch (error) {
    alert('Error loading statistics');
  }
}

// Listen for page changes
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === 'pageChanged') {
    loadProductInfo();
  }
});

// ============================================
// v1.5 FEATURES IMPLEMENTATION
// ============================================

// Price History Tracking
async function trackPriceHistory(product, store) {
  if (!product.price || !product.title) return;
  
  const productId = generateProductId(product.url, product.title);
  const priceHistory = await chrome.storage.local.get(['priceHistory']);
  const history = priceHistory.priceHistory || {};
  
  if (!history[productId]) {
    history[productId] = {
      title: product.title,
      url: product.url,
      store: store.name,
      prices: []
    };
  }
  
  const parsedPrice = parsePrice(product.price);
  if (parsedPrice) {
    history[productId].prices.push({
      price: parsedPrice,
      currency: product.currency,
      date: Date.now(),
      store: store.name
    });
    
    // Keep only last 30 days of history
    const thirtyDaysAgo = Date.now() - (30 * 24 * 60 * 60 * 1000);
    history[productId].prices = history[productId].prices.filter(
      entry => entry.date > thirtyDaysAgo
    );
    
    await chrome.storage.local.set({ priceHistory: history });
  }
}

// Check for price drops
async function checkPriceDrop(product) {
  if (!product.price || !product.title) return;
  
  const productId = generateProductId(product.url, product.title);
  const priceHistory = await chrome.storage.local.get(['priceHistory']);
  const history = priceHistory.priceHistory || {};
  
  if (!history[productId] || history[productId].prices.length < 2) return;
  
  const prices = history[productId].prices;
  const currentPrice = parsePrice(product.price);
  const previousPrice = prices[prices.length - 2]?.price;
  
  if (previousPrice && currentPrice) {
    const dropInfo = window.checkPriceDrop ? window.checkPriceDrop(currentPrice, previousPrice) : checkPriceDropUtil(currentPrice, previousPrice);
    
    if (dropInfo && dropInfo.dropped) {
      const badge = document.getElementById('priceDropBadge');
      badge.textContent = `↓ ${dropInfo.percentage}%`;
      badge.style.display = 'inline-block';
      badge.className = 'price-drop-badge drop';
      
      // Send notification
      chrome.runtime.sendMessage({
        action: 'priceDropAlert',
        product: product.title,
        drop: dropInfo
      }).catch(() => {});
    }
  }
}

// Wishlist Functions
async function toggleWishlist() {
  if (!currentProductData || !currentProductData.product) return;
  
  const product = currentProductData.product;
  const productId = generateProductId(product.url, product.title);
  
  const wishlistData = await chrome.storage.local.get(['wishlist']);
  const wishlist = wishlistData.wishlist || [];
  
  const index = wishlist.findIndex(item => item.id === productId);
  
  if (index > -1) {
    // Remove from wishlist
    wishlist.splice(index, 1);
    await chrome.storage.local.set({ wishlist });
    updateWishlistButton(product);
    showNotification('Removed from wishlist', 'success');
  } else {
    // Add to wishlist
    wishlist.push({
      id: productId,
      title: product.title,
      url: product.url,
      price: product.price,
      currency: product.currency,
      image: product.image,
      store: currentProductData.currentStore.name,
      addedAt: Date.now()
    });
    await chrome.storage.local.set({ wishlist });
    updateWishlistButton(product);
    showNotification('Added to wishlist', 'success');
  }
  
  loadWishlist();
}

async function updateWishlistButton(product) {
  if (!product) return;
  
  const productId = generateProductId(product.url, product.title);
  const wishlistData = await chrome.storage.local.get(['wishlist']);
  const wishlist = wishlistData.wishlist || [];
  
  const isInWishlist = wishlist.some(item => item.id === productId);
  const btn = document.getElementById('wishlistBtn');
  
  if (btn) {
    if (isInWishlist) {
      btn.classList.add('active');
      btn.querySelector('svg path').setAttribute('fill', 'currentColor');
    } else {
      btn.classList.remove('active');
      btn.querySelector('svg path').setAttribute('fill', 'none');
    }
  }
}

async function loadWishlist() {
  const wishlistData = await chrome.storage.local.get(['wishlist']);
  const wishlist = wishlistData.wishlist || [];
  const grid = document.getElementById('wishlistGrid');
  
  if (!grid) return;
  
  if (wishlist.length === 0) {
    grid.innerHTML = '<p class="empty-state">Your wishlist is empty</p>';
    document.getElementById('wishlistSection').style.display = 'none';
    return;
  }
  
  grid.innerHTML = '';
  wishlist.forEach(item => {
    const card = document.createElement('div');
    card.className = 'wishlist-item';
    card.innerHTML = `
      <img src="${item.image || ''}" alt="${item.title}" class="wishlist-image">
      <div class="wishlist-info">
        <h4 class="wishlist-title">${item.title.substring(0, 50)}${item.title.length > 50 ? '...' : ''}</h4>
        <div class="wishlist-price">${item.currency} ${item.price}</div>
        <div class="wishlist-store">${item.store}</div>
      </div>
      <button class="wishlist-remove" data-id="${item.id}">×</button>
    `;
    
    card.querySelector('.wishlist-remove').addEventListener('click', async () => {
      const updatedWishlist = wishlist.filter(i => i.id !== item.id);
      await chrome.storage.local.set({ wishlist: updatedWishlist });
      loadWishlist();
    });
    
    grid.appendChild(card);
  });
  
  // Show wishlist section if there are items
  if (wishlist.length > 0) {
    document.getElementById('wishlistSection').style.display = 'block';
  }
}

// Currency Converter
function toggleCurrencyConverter() {
  const section = document.getElementById('currencyConverterSection');
  const isVisible = section.style.display !== 'none';
  
  section.style.display = isVisible ? 'none' : 'block';
  
  if (!isVisible) {
    initializeCurrencyConverter();
  }
}

function initializeCurrencyConverter() {
  const fromSelect = document.getElementById('converterFrom');
  const toSelect = document.getElementById('converterTo');
  const amountInput = document.getElementById('converterAmount');
  if (!fromSelect || !toSelect || !amountInput) return;

  const currencies = ['NGN', 'ZAR', 'KES', 'EGP', 'USD'];
  fromSelect.innerHTML = '';
  toSelect.innerHTML = '';

  currencies.forEach(currency => {
    const option1 = document.createElement('option');
    option1.value = currency;
    option1.textContent = currency;
    fromSelect.appendChild(option1);
    const option2 = document.createElement('option');
    option2.value = currency;
    option2.textContent = currency;
    toSelect.appendChild(option2);
  });

  if (currentProductData && currentProductData.product) {
    const currentCurrency = currentProductData.product.currency || 'NGN';
    fromSelect.value = currentCurrency;
    toSelect.value = currentCurrency === 'NGN' ? 'USD' : 'NGN';
    const currentPrice = parsePrice(currentProductData.product.price);
    if (currentPrice) {
      amountInput.value = currentPrice;
      convertCurrency();
    }
  }
}

function convertCurrency() {
  const amountEl = document.getElementById('converterAmount');
  const fromEl = document.getElementById('converterFrom');
  const toEl = document.getElementById('converterTo');
  const resultInput = document.getElementById('converterResult');
  if (!amountEl || !fromEl || !toEl || !resultInput) return;

  const amount = parseFloat(amountEl.value);
  const from = fromEl.value;
  const to = toEl.value;

  if (!amount || isNaN(amount)) {
    resultInput.value = '';
    return;
  }

  const converted = window.convertCurrency ? window.convertCurrency(amount, from, to) : convertCurrencyUtil(amount, from, to);
  if (converted !== null) {
    const formatted = window.formatPrice ? window.formatPrice(converted, to) : formatPriceUtil(converted, to);
    resultInput.value = formatted;
  }
}

// Fallback if utils.js not loaded
function convertCurrencyUtil(amount, from, to) {
  const rates = { NGN: 1, ZAR: 0.012, KES: 0.28, EGP: 0.022, USD: 0.00067 };
  if (from === to) return amount;
  const baseAmount = amount / (rates[from] || 1);
  return Math.round(baseAmount * (rates[to] || 1) * 100) / 100;
}

function formatPriceUtil(amount, currency) {
  const symbols = { NGN: '₦', ZAR: 'R', KES: 'KSh', EGP: 'E£', USD: '$' };
  return `${symbols[currency] || currency}${parseFloat(amount).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

// Price History Display
async function togglePriceHistory() {
  const section = document.getElementById('priceHistorySection');
  const isVisible = section.style.display !== 'none';
  
  section.style.display = isVisible ? 'none' : 'block';
  
  if (!isVisible && currentProductData) {
    await displayPriceHistory();
  }
}

// Advanced: Display price trend indicator (CamelCamelCamel style)
function displayPriceTrend(trend, product) {
  const indicator = document.getElementById('priceTrendIndicator');
  const trendText = document.getElementById('priceTrendText');
  
  if (!trend || !indicator || !trendText) return;
  
  indicator.style.display = 'flex';
  
  let message = '';
  let className = '';
  
  if (trend.isGoodDeal) {
    message = `✅ Good Deal! This item is ${Math.abs(parseFloat(trend.changePercent))}% ${trend.change < 0 ? 'cheaper' : 'more expensive'} than average. Lowest seen: ${product.currency} ${trend.lowest.toLocaleString()}`;
    className = 'trend-good';
  } else if (trend.change < 0) {
    message = `📉 Price dropped ${Math.abs(parseFloat(trend.changePercent))}% since last visit. It was ${product.currency} ${(trend.current + Math.abs(trend.change)).toLocaleString()} ${trend.daysTracked > 1 ? trend.daysTracked + ' days ago' : 'previously'}.`;
    className = 'trend-drop';
  } else if (trend.change > 0) {
    message = `📈 Price increased ${trend.changePercent}% since last visit. Lowest seen: ${product.currency} ${trend.lowest.toLocaleString()}`;
    className = 'trend-increase';
  } else {
    message = `📊 Price stable. Tracked for ${trend.daysTracked} day${trend.daysTracked > 1 ? 's' : ''}. Average: ${product.currency} ${trend.average.toLocaleString()}`;
    className = 'trend-stable';
  }
  
  trendText.textContent = message;
  indicator.className = `price-trend-indicator ${className}`;
}

// Display coupons - Compact version
function displayCoupons(coupons, storeName) {
  const section = document.getElementById('couponsSection');
  const list = document.getElementById('couponsList');
  
  if (!section || !list || !coupons || coupons.length === 0) return;
  
  section.style.display = 'block';
  list.innerHTML = '';
  
  // Show max 2 coupons (compact)
  coupons.slice(0, 2).forEach(coupon => {
    const couponBadge = document.createElement('div');
    couponBadge.className = 'coupon-badge-compact';
    couponBadge.innerHTML = `
      <span class="coupon-code-compact">${coupon.code}</span>
      <button class="coupon-copy-compact" data-code="${coupon.code}">Copy</button>
    `;
    
    const copyBtn = couponBadge.querySelector('.coupon-copy-compact');
    copyBtn.addEventListener('click', () => {
      navigator.clipboard.writeText(coupon.code).then(() => {
        copyBtn.textContent = '✓';
        setTimeout(() => {
          copyBtn.textContent = 'Copy';
        }, 2000);
      });
    });
    
    list.appendChild(couponBadge);
  });
}

// Advanced: Display country switcher for cross-border shopping
function displayCountrySwitcher(stores, productTitle, userLocation) {
  const switcher = document.getElementById('countrySwitcher');
  if (!switcher) return;
  
  // Group stores by country
  const storesByCountry = {};
  stores.forEach(store => {
    if (!storesByCountry[store.country]) {
      storesByCountry[store.country] = [];
    }
    storesByCountry[store.country].push(store);
  });
  
  switcher.innerHTML = '';
  
  // Show countries with stores
  Object.entries(storesByCountry).forEach(([country, countryStores]) => {
    const countryCard = document.createElement('div');
    countryCard.className = 'country-switcher-card';
    if (userLocation && userLocation.country === country) {
      countryCard.classList.add('current-country');
    }
    
    const flagCode = getCountryCode(countryStores[0]);
    const storeCount = countryStores.length;
    
    countryCard.innerHTML = `
      <div class="country-card-flag store-country-code-simple">${flagCode}</div>
      <div class="country-card-info">
        <div class="country-card-name">${country}</div>
        <div class="country-card-stores">${storeCount} store${storeCount > 1 ? 's' : ''}</div>
      </div>
      <button class="country-card-btn" data-country="${country}">
        Compare
      </button>
    `;
    
    // Handle country switch
    const btn = countryCard.querySelector('.country-card-btn');
    btn.addEventListener('click', () => {
      switchCountry(country, countryStores, productTitle);
    });
    
    switcher.appendChild(countryCard);
  });
}

// Advanced: Switch country and show prices
async function switchCountry(country, stores, productTitle) {
  // Filter stores for selected country
  const countryStores = stores.filter(s => s.country === country);
  
  // Update comparison section to show only this country
  const grid = document.getElementById('comparisonGrid');
  if (!grid) return;
  
  // Clear and show country-specific stores
  const countryHeader = document.createElement('div');
  countryHeader.className = 'country-header';
  countryHeader.innerHTML = `
    <span class="country-flag store-country-code-simple">${getCountryCode(stores[0])}</span>
    <span class="country-name">${country} - ${productTitle.substring(0, 30)}...</span>
  `;
  
  // Create store buttons for this country
  countryStores.forEach(store => {
    const button = createStoreButton(store, productTitle, null);
    grid.appendChild(button);
  });
  
  // Scroll to comparison section
  document.getElementById('comparisonSection')?.scrollIntoView({ behavior: 'smooth' });
}

async function displayPriceHistory() {
  if (!currentProductData || !currentProductData.product) return;
  
  const product = currentProductData.product;
  const productId = generateProductId(product.url, product.title);
  const priceHistory = await chrome.storage.local.get(['priceHistory']);
  const history = priceHistory.priceHistory || {};
  
  const chart = document.getElementById('priceHistoryChart');
  
  if (!history[productId] || !history[productId].prices.length) {
    chart.innerHTML = '<p class="empty-state">No price history available</p>';
    return;
  }
  
  const prices = history[productId].prices;
  const maxPrice = Math.max(...prices.map(p => p.price));
  const minPrice = Math.min(...prices.map(p => p.price));
  const range = maxPrice - minPrice || 1;
  
  chart.innerHTML = '<div class="price-history-bars">';
  
  prices.forEach((entry, index) => {
    const height = ((entry.price - minPrice) / range) * 100;
    const date = new Date(entry.date);
    const dateStr = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    
    chart.querySelector('.price-history-bars').innerHTML += `
      <div class="price-bar" style="height: ${height}%">
        <div class="price-bar-value">${window.formatPrice ? window.formatPrice(entry.price, entry.currency) : formatPriceUtil(entry.price, entry.currency)}</div>
        <div class="price-bar-date">${dateStr}</div>
      </div>
    `;
  });
  
  chart.innerHTML += '</div>';
}

// Shipping Calculator
async function calculateShipping(product, store) {
  if (!product.price) return;
  
  const parsedPrice = parsePrice(product.price);
  if (!parsedPrice) return;
  
  const shipping = window.estimateShipping ? window.estimateShipping(store.name, store.country, parsedPrice) : estimateShippingUtil(store.name, store.country, parsedPrice);
  const total = parsedPrice + shipping;
  
  const section = document.getElementById('shippingSection');
  const results = document.getElementById('shippingResults');
  
  results.innerHTML = `
    <div class="shipping-item">
      <span class="shipping-label">Product Price:</span>
      <span class="shipping-value">${(window.formatPrice || formatPriceUtil)(parsedPrice, product.currency)}</span>
    </div>
    <div class="shipping-item">
      <span class="shipping-label">Estimated Shipping:</span>
      <span class="shipping-value">${(window.formatPrice || formatPriceUtil)(shipping, product.currency)}</span>
    </div>
    <div class="shipping-item total">
      <span class="shipping-label">Total Cost:</span>
      <span class="shipping-value">${(window.formatPrice || formatPriceUtil)(total, product.currency)}</span>
    </div>
  `;
  
  section.style.display = 'block';
}

// Multi-Product Comparison
let comparisonProducts = [];

async function addToMultiCompare() {
  if (!currentProductData || !currentProductData.product) return;
  
  const product = currentProductData.product;
  const productId = generateProductId(product.url, product.title);
  
  if (comparisonProducts.length >= 5) {
    showNotification('Maximum 5 products can be compared', 'error');
    return;
  }
  
  if (comparisonProducts.some(p => p.id === productId)) {
    showNotification('Product already in comparison', 'error');
    return;
  }
  
  comparisonProducts.push({
    id: productId,
    title: product.title,
    price: product.price,
    currency: product.currency,
    image: product.image,
    url: product.url,
    store: currentProductData.currentStore.name
  });
  
  await chrome.storage.local.set({ comparisonProducts });
  loadMultiCompare();
  showNotification('Added to comparison', 'success');
}

async function loadMultiCompare() {
  const stored = await chrome.storage.local.get(['comparisonProducts']);
  comparisonProducts = stored.comparisonProducts || [];
  
  const grid = document.getElementById('multiCompareGrid');
  const section = document.getElementById('multiCompareSection');
  
  if (!grid || !section) return;
  
  if (comparisonProducts.length === 0) {
    section.style.display = 'none';
    return;
  }
  
  section.style.display = 'block';
  grid.innerHTML = '';
  
  comparisonProducts.forEach((product, index) => {
    const card = document.createElement('div');
    card.className = 'compare-item';
    card.innerHTML = `
      <button class="compare-remove" data-index="${index}">×</button>
      <img src="${product.image || ''}" alt="${product.title}" class="compare-image">
      <div class="compare-info">
        <h4 class="compare-title">${product.title.substring(0, 40)}${product.title.length > 40 ? '...' : ''}</h4>
        <div class="compare-price">${product.currency} ${product.price}</div>
        <div class="compare-store">${product.store}</div>
      </div>
    `;
    
    card.querySelector('.compare-remove').addEventListener('click', async () => {
      comparisonProducts.splice(index, 1);
      await chrome.storage.local.set({ comparisonProducts });
      loadMultiCompare();
    });
    
    grid.appendChild(card);
  });
}

// Helper Functions - Fallbacks
function generateProductIdUtil(url, title) {
  const urlHash = btoa(url).substring(0, 16);
  const titleHash = btoa(title).substring(0, 16);
  return `${urlHash}_${titleHash}`;
}

function parsePriceUtil(priceString) {
  if (!priceString) return null;
  const cleaned = priceString.toString().replace(/[^\d.,]/g, '').replace(/,/g, '');
  const parsed = parseFloat(cleaned);
  return isNaN(parsed) ? null : parsed;
}

function estimateShippingUtil(store, country, price) {
  const shippingRates = {
    'Nigeria': { 'Jumia Nigeria': 0.05, 'Konga': 0.06, 'Slot': 0.04 },
    'South Africa': { 'Takealot': 0.08, 'Zando': 0.07, 'Amazon South Africa': 0.09 },
    'Kenya': { 'Jumia Kenya': 0.05, 'Kilimall': 0.06, 'Amanbo': 0.05 },
    'Egypt': { 'Jumia Egypt': 0.05, 'Amazon Egypt': 0.08, 'Noon': 0.06 }
  };
  const countryRates = shippingRates[country] || {};
  const shipping = (countryRates[store] || 0.06) * price;
  return Math.round(shipping * 100) / 100;
}

function checkPriceDropUtil(currentPrice, previousPrice) {
  if (!currentPrice || !previousPrice) return null;
  const difference = previousPrice - currentPrice;
  const percentage = ((difference / previousPrice) * 100).toFixed(2);
  return {
    dropped: difference > 0,
    amount: difference,
    percentage: Math.abs(percentage)
  };
}

function showNotification(message, type = 'info') {
  // Simple notification - can be enhanced with a toast system
  const notification = document.createElement('div');
  notification.className = `notification notification-${type}`;
  notification.textContent = message;
  notification.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    background: ${type === 'success' ? '#32CD32' : type === 'error' ? '#DC143C' : '#FFD700'};
    color: white;
    padding: 12px 20px;
    border-radius: 8px;
    box-shadow: 0 4px 12px rgba(0,0,0,0.15);
    z-index: 10000;
    animation: slideIn 0.3s ease-out;
  `;
  
  document.body.appendChild(notification);
  
  setTimeout(() => {
    notification.style.animation = 'slideOut 0.3s ease-out';
    setTimeout(() => notification.remove(), 300);
  }, 3000);
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
