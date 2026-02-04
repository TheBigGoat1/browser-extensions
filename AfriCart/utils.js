// AfriCart - Utility Functions
// Currency conversion, price formatting, and helper functions

// Currency Exchange Rates (Updated periodically - in production, fetch from API)
const CURRENCY_RATES = {
  NGN: { base: 1, symbol: '₦' },
  ZAR: { base: 0.012, symbol: 'R' }, // 1 NGN ≈ 0.012 ZAR
  KES: { base: 0.28, symbol: 'KSh' }, // 1 NGN ≈ 0.28 KES
  EGP: { base: 0.022, symbol: 'E£' }, // 1 NGN ≈ 0.022 EGP
  USD: { base: 0.00067, symbol: '$' } // 1 NGN ≈ 0.00067 USD
};

// Convert price between currencies
function convertCurrency(amount, fromCurrency, toCurrency) {
  if (!amount || isNaN(amount)) return null;
  if (fromCurrency === toCurrency) return amount;
  
  const fromRate = CURRENCY_RATES[fromCurrency]?.base || 1;
  const toRate = CURRENCY_RATES[toCurrency]?.base || 1;
  
  // Convert to base (NGN), then to target currency
  const baseAmount = amount / fromRate;
  const convertedAmount = baseAmount * toRate;
  
  return Math.round(convertedAmount * 100) / 100;
}

// Format price with currency symbol
function formatPrice(amount, currency) {
  if (!amount || isNaN(amount)) return '--';
  
  const currencyInfo = CURRENCY_RATES[currency] || { symbol: currency };
  const formatted = parseFloat(amount).toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });
  
  return `${currencyInfo.symbol}${formatted}`;
}

// Parse price from string (removes currency symbols, commas, etc.)
function parsePrice(priceString) {
  if (!priceString) return null;
  
  // Remove currency symbols, commas, and whitespace
  const cleaned = priceString.toString()
    .replace(/[^\d.,]/g, '')
    .replace(/,/g, '');
  
  const parsed = parseFloat(cleaned);
  return isNaN(parsed) ? null : parsed;
}

// Calculate shipping estimate (placeholder - in production, use real APIs)
function estimateShipping(store, country, price) {
  // Basic shipping estimates based on store and country
  const shippingRates = {
    'Nigeria': {
      'Jumia Nigeria': price * 0.05, // 5% of product price
      'Konga': price * 0.06,
      'Slot': price * 0.04
    },
    'South Africa': {
      'Takealot': price * 0.08,
      'Zando': price * 0.07,
      'Amazon South Africa': price * 0.09
    },
    'Kenya': {
      'Jumia Kenya': price * 0.05,
      'Kilimall': price * 0.06,
      'Amanbo': price * 0.05
    },
    'Egypt': {
      'Jumia Egypt': price * 0.05,
      'Amazon Egypt': price * 0.08,
      'Noon': price * 0.06
    }
  };
  
  const countryRates = shippingRates[country] || {};
  const shipping = countryRates[store] || price * 0.06; // Default 6%
  
  return Math.round(shipping * 100) / 100;
}

// Generate product ID from URL and title
function generateProductId(url, title) {
  const urlHash = btoa(url).substring(0, 16);
  const titleHash = btoa(title).substring(0, 16);
  return `${urlHash}_${titleHash}`;
}

// Check if price dropped
function checkPriceDrop(currentPrice, previousPrice) {
  if (!currentPrice || !previousPrice) return null;
  
  const current = parsePrice(currentPrice);
  const previous = parsePrice(previousPrice);
  
  if (!current || !previous) return null;
  
  const difference = previous - current;
  const percentage = ((difference / previous) * 100).toFixed(2);
  
  return {
    dropped: difference > 0,
    amount: difference,
    percentage: Math.abs(percentage)
  };
}

// Export functions globally for use in other files
if (typeof window !== 'undefined') {
  window.convertCurrency = convertCurrency;
  window.formatPrice = formatPrice;
  window.parsePrice = parsePrice;
  window.estimateShipping = estimateShipping;
  window.generateProductId = generateProductId;
  window.checkPriceDrop = checkPriceDrop;
  window.CURRENCY_RATES = CURRENCY_RATES;
}

// Also support CommonJS for Node.js environments
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    convertCurrency,
    formatPrice,
    parsePrice,
    estimateShipping,
    generateProductId,
    checkPriceDrop,
    CURRENCY_RATES
  };
}
