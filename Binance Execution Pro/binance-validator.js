// Binance Execution Pro - Pre-flight Validation
// Production-Grade Input Validation and Exchange Info Caching

/**
 * Validator Module
 * 
 * This module provides:
 * - Symbol validation (tick size, lot size)
 * - Quantity/price rounding
 * - Exchange info caching
 * - Pre-flight order validation
 * - Error prevention before API calls
 */

// Exchange info cache (spot)
let exchangeInfoCache = {
  data: null,
  timestamp: 0,
  expiry: 3600000 // 1 hour cache
};

// Futures exchange info cache
let futuresExchangeInfoCache = { data: null, timestamp: 0, expiry: 3600000 };
let leverageBracketCache = { data: null, timestamp: 0, expiry: 3600000 };

// Symbol filters cache
let symbolFiltersCache = {};

/**
 * Get exchange info from Binance API
 * @param {string} environment - 'testnet' or 'mainnet'
 * @returns {Promise<Object>} Exchange info
 */
async function fetchExchangeInfo(environment = 'testnet') {
  try {
    const baseUrl = environment === 'testnet'
      ? 'https://testnet.binance.vision'
      : 'https://api.binance.com';

    const response = await fetch(`${baseUrl}/api/v3/exchangeInfo`);
    if (!response.ok) {
      throw new Error(`Failed to fetch exchange info: ${response.status}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('[Validator] Exchange info fetch error:', error);
    throw error;
  }
}

/**
 * Get exchange info (cached)
 * @param {string} environment - 'testnet' or 'mainnet'
 * @param {boolean} forceRefresh - Force refresh cache
 * @returns {Promise<Object>} Exchange info
 */
async function getExchangeInfo(environment = 'testnet', forceRefresh = false) {
  const now = Date.now();
  const cache = exchangeInfoCache;

  // Return cached data if valid
  if (!forceRefresh && cache.data && (now - cache.timestamp) < cache.expiry) {
    return cache.data;
  }

  // Fetch fresh data
  const data = await fetchExchangeInfo(environment);
  
  // Update cache
  exchangeInfoCache = {
    data: data,
    timestamp: now,
    expiry: 3600000
  };

  // Build symbol filters cache
  if (data.symbols) {
    symbolFiltersCache = {};
    data.symbols.forEach(symbol => {
      symbolFiltersCache[symbol.symbol] = {
        filters: symbol.filters,
        baseAsset: symbol.baseAsset,
        quoteAsset: symbol.quoteAsset,
        status: symbol.status
      };
    });
  }

  return data;
}

/**
 * Get symbol filters
 * @param {string} symbol - Trading symbol (e.g., 'BTCUSDT')
 * @param {string} environment - 'testnet' or 'mainnet'
 * @returns {Promise<Object>} Symbol filters
 */
async function getSymbolFilters(symbol, environment = 'testnet') {
  await getExchangeInfo(environment);
  return symbolFiltersCache[symbol] || null;
}

/**
 * Get tick size for symbol
 * @param {string} symbol - Trading symbol
 * @param {string} environment - 'testnet' or 'mainnet'
 * @returns {Promise<number>} Tick size
 */
async function getTickSize(symbol, environment = 'testnet') {
  const filters = await getSymbolFilters(symbol, environment);
  if (!filters) {
    throw new Error(`Symbol ${symbol} not found`);
  }

  const priceFilter = filters.filters.find(f => f.filterType === 'PRICE_FILTER');
  return priceFilter ? parseFloat(priceFilter.tickSize) : 0.01;
}

/**
 * Get lot size for symbol
 * @param {string} symbol - Trading symbol
 * @param {string} environment - 'testnet' or 'mainnet'
 * @returns {Promise<number>} Lot size (step size)
 */
async function getLotSize(symbol, environment = 'testnet') {
  const filters = await getSymbolFilters(symbol, environment);
  if (!filters) {
    throw new Error(`Symbol ${symbol} not found`);
  }

  const lotSizeFilter = filters.filters.find(f => f.filterType === 'LOT_SIZE');
  return lotSizeFilter ? parseFloat(lotSizeFilter.stepSize) : 0.001;
}

/**
 * Get min notional for symbol
 * @param {string} symbol - Trading symbol
 * @param {string} environment - 'testnet' or 'mainnet'
 * @returns {Promise<number>} Minimum notional
 */
async function getMinNotional(symbol, environment = 'testnet') {
  const filters = await getSymbolFilters(symbol, environment);
  if (!filters) {
    throw new Error(`Symbol ${symbol} not found`);
  }

  const notionalFilter = filters.filters.find(f => f.filterType === 'MIN_NOTIONAL');
  return notionalFilter ? parseFloat(notionalFilter.minNotional) : 5.0;
}

/**
 * Round price to tick size
 * @param {number} price - Price to round
 * @param {number} tickSize - Tick size
 * @returns {number} Rounded price
 */
function roundToTickSize(price, tickSize) {
  if (tickSize === 0) return price;
  
  const precision = Math.abs(Math.log10(tickSize));
  const factor = Math.pow(10, precision);
  return Math.floor(price / tickSize) * tickSize;
}

/**
 * Round quantity to lot size
 * @param {number} quantity - Quantity to round
 * @param {number} lotSize - Lot size (step size)
 * @returns {number} Rounded quantity
 */
function roundToLotSize(quantity, lotSize) {
  if (lotSize === 0) return quantity;
  
  const precision = Math.abs(Math.log10(lotSize));
  const factor = Math.pow(10, precision);
  return Math.floor(quantity / lotSize) * lotSize;
}

/**
 * Validate and round order parameters
 * @param {Object} orderParams - Order parameters
 * @param {string} environment - 'testnet' or 'mainnet'
 * @returns {Promise<Object>} Validated and rounded parameters
 */
async function validateAndRoundOrder(orderParams, environment = 'testnet') {
  const symbol = orderParams.symbol;
  if (!symbol) {
    throw new Error('Symbol is required');
  }

  // Get symbol filters
  const filters = await getSymbolFilters(symbol, environment);
  if (!filters) {
    throw new Error(`Symbol ${symbol} not found or not trading`);
  }

  if (filters.status !== 'TRADING') {
    throw new Error(`Symbol ${symbol} is not trading (status: ${filters.status})`);
  }

  const validated = { ...orderParams };

  // Get filter values
  const priceFilter = filters.filters.find(f => f.filterType === 'PRICE_FILTER');
  const lotSizeFilter = filters.filters.find(f => f.filterType === 'LOT_SIZE');
  const notionalFilter = filters.filters.find(f => f.filterType === 'MIN_NOTIONAL');

  const tickSize = priceFilter ? parseFloat(priceFilter.tickSize) : 0.01;
  const lotSize = lotSizeFilter ? parseFloat(lotSizeFilter.stepSize) : 0.001;
  const minNotional = notionalFilter ? parseFloat(notionalFilter.minNotional) : 5.0;
  const minPrice = priceFilter ? parseFloat(priceFilter.minPrice) : 0;
  const maxPrice = priceFilter ? parseFloat(priceFilter.maxPrice) : Infinity;
  const minQty = lotSizeFilter ? parseFloat(lotSizeFilter.minQty) : 0;
  const maxQty = lotSizeFilter ? parseFloat(lotSizeFilter.maxQty) : Infinity;

  // Validate and round price (for LIMIT orders)
  if (validated.type === 'LIMIT' && validated.price) {
    validated.price = roundToTickSize(parseFloat(validated.price), tickSize);
    
    if (validated.price < minPrice || validated.price > maxPrice) {
      throw new Error(`Price ${validated.price} is outside allowed range [${minPrice}, ${maxPrice}]`);
    }
  }

  // Validate and round quantity
  if (validated.quantity) {
    validated.quantity = roundToLotSize(parseFloat(validated.quantity), lotSize);
    
    if (validated.quantity < minQty || validated.quantity > maxQty) {
      throw new Error(`Quantity ${validated.quantity} is outside allowed range [${minQty}, ${maxQty}]`);
    }
  }

  // Validate notional (for MARKET orders with quoteOrderQty)
  if (validated.type === 'MARKET' && validated.quoteOrderQty) {
    const notional = parseFloat(validated.quoteOrderQty);
    if (notional < minNotional) {
      throw new Error(`Notional ${notional} is below minimum ${minNotional}`);
    }
  }

  // Validate notional (for MARKET orders with quantity)
  if (validated.type === 'MARKET' && validated.quantity && !validated.quoteOrderQty) {
    // We need current price to calculate notional
    // This will be validated server-side
    console.warn('[Validator] Cannot validate notional without current price');
  }

  return validated;
}

/**
 * Fetch futures exchange info
 * @param {string} environment - 'testnet' or 'mainnet'
 * @returns {Promise<Object>} Exchange info
 */
async function fetchFuturesExchangeInfo(environment = 'testnet') {
  const baseUrl = environment === 'testnet'
    ? 'https://testnet.binancefuture.com'
    : 'https://fapi.binance.com';
  const response = await fetch(`${baseUrl}/fapi/v1/exchangeInfo`);
  if (!response.ok) throw new Error(`Futures exchangeInfo failed: ${response.status}`);
  return response.json();
}

/**
 * Fetch leverage brackets (futures)
 * @param {string} environment - 'testnet' or 'mainnet'
 * @returns {Promise<Array>} Leverage brackets
 */
async function fetchLeverageBrackets(environment = 'testnet') {
  const baseUrl = environment === 'testnet'
    ? 'https://testnet.binancefuture.com'
    : 'https://fapi.binance.com';
  const response = await fetch(`${baseUrl}/fapi/v1/leverageBracket`);
  if (!response.ok) throw new Error(`Leverage bracket failed: ${response.status}`);
  const data = await response.json();
  return data;
}

/**
 * Get futures exchange info (cached)
 */
async function getFuturesExchangeInfo(environment = 'testnet', forceRefresh = false) {
  const now = Date.now();
  const cache = futuresExchangeInfoCache;
  if (!forceRefresh && cache.data && (now - cache.timestamp) < cache.expiry) {
    return cache.data;
  }
  const data = await fetchFuturesExchangeInfo(environment);
  futuresExchangeInfoCache = { data, timestamp: now, expiry: 3600000 };
  return data;
}

/**
 * Get max leverage for symbol (futures)
 * @param {string} symbol - e.g. BTCUSDT
 * @param {string} environment - 'testnet' or 'mainnet'
 * @returns {Promise<number>} Max leverage (e.g. 125)
 */
async function getMaxLeverageForSymbol(symbol, environment = 'testnet') {
  const now = Date.now();
  let data = leverageBracketCache.data;
  if (!data || (now - leverageBracketCache.timestamp) > leverageBracketCache.expiry) {
    const raw = await fetchLeverageBrackets(environment);
    leverageBracketCache = { data: raw, timestamp: now, expiry: 3600000 };
    data = raw;
  }
  // Response is array of { symbol, brackets: [ { initialLeverage, ... } ] }
  const item = Array.isArray(data) ? data.find(b => b.symbol === symbol) : null;
  if (!item || !item.brackets || !item.brackets.length) return 125;
  const maxLev = Math.max(...item.brackets.map(b => parseInt(b.initialLeverage, 10)));
  return maxLev;
}

/**
 * Check if symbol is a valid trading pair (async)
 * @param {string} symbol - Symbol to validate
 * @param {string} environment - 'testnet' or 'mainnet'
 * @param {string} market - 'spot' or 'futures'
 * @returns {Promise<{ valid: boolean, error?: string }>}
 */
async function isValidTradingPair(symbol, environment = 'testnet', market = 'futures') {
  if (!symbol || typeof symbol !== 'string') {
    return { valid: false, error: 'Symbol is required' };
  }
  const s = symbol.toUpperCase();
  if (!/^[A-Z]{6,12}$/.test(s)) {
    return { valid: false, error: 'Invalid symbol format (e.g. BTCUSDT)' };
  }
  try {
    if (market === 'futures') {
      const info = await getFuturesExchangeInfo(environment);
      const sym = (info.symbols || []).find(x => x.symbol === s);
      if (!sym) return { valid: false, error: `Symbol ${s} not found` };
      if (sym.status !== 'TRADING') return { valid: false, error: `Symbol ${s} is not trading` };
      return { valid: true };
    }
    await getExchangeInfo(environment);
    const filters = symbolFiltersCache[s];
    if (!filters) return { valid: false, error: `Symbol ${s} not found` };
    if (filters.status !== 'TRADING') return { valid: false, error: `Symbol ${s} is not trading` };
    return { valid: true };
  } catch (e) {
    return { valid: false, error: e.message || 'Failed to validate symbol' };
  }
}

/**
 * Validate symbol format
 * @param {string} symbol - Symbol to validate
 * @returns {boolean} Validation result
 */
function validateSymbolFormat(symbol) {
  if (!symbol || typeof symbol !== 'string') {
    return false;
  }
  
  // Binance symbols are typically 6-12 characters, uppercase
  return /^[A-Z]{6,12}$/.test(symbol);
}

/**
 * Validate leverage (for futures)
 * @param {number} leverage - Leverage value
 * @param {number} maxLeverage - Maximum allowed leverage
 * @returns {boolean} Validation result
 */
function validateLeverage(leverage, maxLeverage = 125) {
  const lev = parseFloat(leverage);
  return lev >= 1 && lev <= maxLeverage && Number.isInteger(lev);
}

/**
 * Validate stop loss percentage
 * @param {number} stopLoss - Stop loss percentage
 * @returns {boolean} Validation result
 */
function validateStopLoss(stopLoss) {
  const sl = parseFloat(stopLoss);
  return sl >= 0.1 && sl <= 100;
}

/**
 * Validate callback rate (for trailing stop) — Binance accepts only 0.1% increments
 * @param {number} callbackRate - Callback rate percentage
 * @returns {{ valid: boolean, rounded?: number, error?: string }}
 */
function validateCallbackRate(callbackRate) {
  const cr = parseFloat(callbackRate);
  if (isNaN(cr) || cr < 0.1 || cr > 100) {
    return { valid: false, error: 'Callback rate must be between 0.1 and 100' };
  }
  const rounded = Math.round(cr * 10) / 10; // round to 0.1
  if (Math.abs(cr - rounded) > 0.001) {
    return { valid: false, rounded, error: 'Binance accepts only 0.1% increments (e.g. 0.1, 0.2, 0.3). Use 0.1 or 0.2 instead of 0.15.' };
  }
  return { valid: true, rounded };
}

/**
 * Pre-flight validation for order
 * @param {Object} orderParams - Order parameters
 * @param {string} environment - 'testnet' or 'mainnet'
 * @returns {Promise<Object>} Validation result
 */
async function preflightOrderValidation(orderParams, environment = 'testnet') {
  const errors = [];
  const warnings = [];

  try {
    // Validate symbol format
    if (!validateSymbolFormat(orderParams.symbol)) {
      errors.push('Invalid symbol format');
    }

    // Validate order type
    const validTypes = ['MARKET', 'LIMIT', 'STOP_MARKET', 'STOP_LIMIT', 'TAKE_PROFIT_MARKET', 'TAKE_PROFIT_LIMIT'];
    if (!validTypes.includes(orderParams.type)) {
      errors.push(`Invalid order type: ${orderParams.type}`);
    }

    // Validate side
    if (!['BUY', 'SELL'].includes(orderParams.side)) {
      errors.push(`Invalid side: ${orderParams.side}`);
    }

    // Validate and round parameters
    const validated = await validateAndRoundOrder(orderParams, environment);

    return {
      valid: errors.length === 0,
      errors: errors,
      warnings: warnings,
      validated: validated
    };
  } catch (error) {
    errors.push(error.message);
    return {
      valid: false,
      errors: errors,
      warnings: warnings,
      validated: null
    };
  }
}

// Export functions
if (typeof window !== 'undefined') {
  window.binanceValidator = {
    getExchangeInfo,
    getFuturesExchangeInfo,
    getSymbolFilters,
    getTickSize,
    getLotSize,
    getMinNotional,
    getMaxLeverageForSymbol,
    isValidTradingPair,
    roundToTickSize,
    roundToLotSize,
    validateAndRoundOrder,
    validateSymbolFormat,
    validateLeverage,
    validateStopLoss,
    validateCallbackRate,
    preflightOrderValidation
  };
}

// Export for service worker context
if (typeof self !== 'undefined' && typeof importScripts !== 'undefined') {
  self.binanceValidator = {
    getExchangeInfo,
    getFuturesExchangeInfo,
    getSymbolFilters,
    getTickSize,
    getLotSize,
    getMinNotional,
    getMaxLeverageForSymbol,
    isValidTradingPair,
    roundToTickSize,
    roundToLotSize,
    validateAndRoundOrder,
    validateSymbolFormat,
    validateLeverage,
    validateStopLoss,
    validateCallbackRate,
    preflightOrderValidation
  };
}
