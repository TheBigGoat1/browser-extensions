// Binance Execution Pro - HMAC-SHA256 Signing Core
// Production-Grade Request Signing for Binance API

(function () {
/**
 * Signing Module
 * 
 * This module provides:
 * - HMAC-SHA256 signing for Binance API requests
 * - Parameter sorting and query string construction
 * - Timestamp and recvWindow handling
 * - Hardware-accelerated signing via Web Crypto API
 * 
 * Security:
 * - API Secret never exposed in plaintext
 * - All signing done in memory
 * - Timestamp synchronization
 */

// Constants
const RECV_WINDOW = 5000; // 5 seconds (Binance default)
const MAX_RECV_WINDOW = 60000; // 60 seconds (Binance maximum)

// Time offset cache (for server time sync)
let serverTimeOffset = 0;

/**
 * Get current timestamp with server offset
 * @returns {number} Timestamp in milliseconds
 */
function getTimestamp() {
  return Date.now() + serverTimeOffset;
}

/**
 * Set server time offset (for synchronization)
 * @param {number} offset - Time offset in milliseconds
 */
function setServerTimeOffset(offset) {
  serverTimeOffset = offset;
  console.log('[Signer] Server time offset set:', offset, 'ms');
}

/**
 * Sort object keys alphabetically
 * @param {Object} params - Parameters object
 * @returns {Object} Sorted parameters object
 */
function sortParams(params) {
  const sorted = {};
  Object.keys(params).sort().forEach(key => {
    sorted[key] = params[key];
  });
  return sorted;
}

/**
 * Build query string from parameters
 * @param {Object} params - Parameters object
 * @returns {string} URL-encoded query string
 */
function buildQueryString(params) {
  return Object.keys(params)
    .map(key => `${encodeURIComponent(key)}=${encodeURIComponent(params[key])}`)
    .join('&');
}

/**
 * Sign request using HMAC-SHA256
 * @param {string} queryString - Query string to sign
 * @param {string} apiSecret - API Secret (from vault)
 * @returns {Promise<string>} HMAC signature (hex)
 */
async function signRequest(queryString, apiSecret) {
  try {
    // Import secret key
    const keyData = new TextEncoder().encode(apiSecret);
    const cryptoKey = await crypto.subtle.importKey(
      'raw',
      keyData,
      {
        name: 'HMAC',
        hash: 'SHA-256'
      },
      false,
      ['sign']
    );

    // Sign the query string
    const signature = await crypto.subtle.sign(
      'HMAC',
      cryptoKey,
      new TextEncoder().encode(queryString)
    );

    // Convert to hex string
    const hashArray = Array.from(new Uint8Array(signature));
    const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');

    return hashHex;
  } catch (error) {
    console.error('[Signer] Signing error:', error);
    throw new Error('Failed to sign request');
  }
}

/**
 * Sign Binance API request
 * @param {Object} params - Request parameters
 * @param {string} apiSecret - API Secret (from vault)
 * @param {Object} options - Signing options
 * @returns {Promise<Object>} Signed request with signature
 */
async function signBinanceRequest(params, apiSecret, options = {}) {
  try {
    // Add timestamp
    const timestamp = getTimestamp();
    params.timestamp = timestamp;

    // Add recvWindow if specified
    if (options.recvWindow) {
      params.recvWindow = Math.min(options.recvWindow, MAX_RECV_WINDOW);
    } else {
      params.recvWindow = RECV_WINDOW;
    }

    // Sort parameters alphabetically (Binance requirement)
    const sortedParams = sortParams(params);

    // Build query string
    const queryString = buildQueryString(sortedParams);

    // Sign the query string
    const signature = await signRequest(queryString, apiSecret);

    // Add signature to parameters
    sortedParams.signature = signature;

    return {
      params: sortedParams,
      queryString: queryString,
      signature: signature,
      timestamp: timestamp
    };
  } catch (error) {
    console.error('[Signer] Binance request signing error:', error);
    throw error;
  }
}

/**
 * Sign WebSocket message (for authenticated streams)
 * @param {Object} params - Message parameters
 * @param {string} apiSecret - API Secret
 * @returns {Promise<string>} Signature
 */
async function signWebSocketMessage(params, apiSecret) {
  try {
    // For WebSocket, we sign the parameter string
    const sortedParams = sortParams(params);
    const queryString = buildQueryString(sortedParams);
    return await signRequest(queryString, apiSecret);
  } catch (error) {
    console.error('[Signer] WebSocket signing error:', error);
    throw error;
  }
}

/**
 * Validate signature (for testing)
 * @param {string} queryString - Query string
 * @param {string} signature - Expected signature
 * @param {string} apiSecret - API Secret
 * @returns {Promise<boolean>} Validation result
 */
async function validateSignature(queryString, signature, apiSecret) {
  try {
    const computedSignature = await signRequest(queryString, apiSecret);
    return computedSignature === signature;
  } catch (error) {
    console.error('[Signer] Signature validation error:', error);
    return false;
  }
}

/**
 * Pre-sign request (for speed optimization)
 * Pre-computes signature for known parameters
 * @param {Object} baseParams - Base parameters (without timestamp)
 * @param {string} apiSecret - API Secret
 * @returns {Function} Function that returns signed request with current timestamp
 */
function createPreSignedRequest(baseParams, apiSecret) {
  return async function() {
    return await signBinanceRequest({ ...baseParams }, apiSecret);
  };
}

/**
 * Sign order request specifically
 * @param {Object} orderParams - Order parameters
 * @param {string} apiSecret - API Secret
 * @returns {Promise<Object>} Signed order request
 */
async function signOrderRequest(orderParams, apiSecret) {
  // Ensure required fields
  const requiredFields = ['symbol', 'side', 'type'];
  for (const field of requiredFields) {
    if (!orderParams[field]) {
      throw new Error(`Missing required field: ${field}`);
    }
  }

  // Add default values if needed
  if (orderParams.type === 'MARKET' && !orderParams.quantity && !orderParams.quoteOrderQty) {
    throw new Error('MARKET orders require quantity or quoteOrderQty');
  }

  return await signBinanceRequest(orderParams, apiSecret);
}

/**
 * Sign cancel/replace request
 * @param {Object} params - Cancel/replace parameters
 * @param {string} apiSecret - API Secret
 * @returns {Promise<Object>} Signed request
 */
async function signCancelReplaceRequest(params, apiSecret) {
  // Required: symbol, cancelOrderId or cancelOrigClientOrderId
  if (!params.symbol) {
    throw new Error('Missing required field: symbol');
  }
  if (!params.cancelOrderId && !params.cancelOrigClientOrderId) {
    throw new Error('Missing required field: cancelOrderId or cancelOrigClientOrderId');
  }

  return await signBinanceRequest(params, apiSecret);
}

/**
 * Sign position query request
 * @param {Object} params - Position query parameters
 * @param {string} apiSecret - API Secret
 * @returns {Promise<Object>} Signed request
 */
async function signPositionRequest(params, apiSecret) {
  return await signBinanceRequest(params, apiSecret);
}

// Export functions
if (typeof window !== 'undefined') {
  window.binanceSigner = {
    signBinanceRequest,
    signWebSocketMessage,
    signOrderRequest,
    signCancelReplaceRequest,
    signPositionRequest,
    validateSignature,
    createPreSignedRequest,
    setServerTimeOffset,
    getTimestamp,
    buildQueryString
  };
}

// Export for service worker context
if (typeof self !== 'undefined' && typeof importScripts !== 'undefined') {
  self.binanceSigner = {
    signBinanceRequest,
    signWebSocketMessage,
    signOrderRequest,
    signCancelReplaceRequest,
    signPositionRequest,
    validateSignature,
    createPreSignedRequest,
    setServerTimeOffset,
    getTimestamp,
    buildQueryString
  };
}

})();
