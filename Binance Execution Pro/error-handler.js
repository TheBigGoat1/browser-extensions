// Binance Execution Pro - Error Handler
// Production-Grade Error Handling and Recovery

(function () {
/**
 * Error Handler Module
 * 
 * This module provides:
 * - Binance API error parsing
 * - Automatic error recovery
 * - Time synchronization
 * - Rate limiting
 * - User-friendly error messages
 */

// Error code mappings
const ERROR_CODES = {
  '-1021': {
    name: 'INVALID_TIMESTAMP',
    message: 'Timestamp outside recvWindow',
    recoverable: true,
    action: 'syncTime'
  },
  '-1003': {
    name: 'TOO_MANY_REQUESTS',
    message: 'Too many requests',
    recoverable: true,
    action: 'rateLimit'
  },
  '-1111': {
    name: 'INVALID_SYMBOL',
    message: 'Invalid symbol',
    recoverable: false,
    action: 'validateSymbol'
  },
  '-2010': {
    name: 'NEW_ORDER_REJECTED',
    message: 'New order rejected',
    recoverable: false,
    action: 'checkOrder'
  },
  '-2011': {
    name: 'CANCEL_REJECTED',
    message: 'Cancel order rejected',
    recoverable: false,
    action: 'checkOrder'
  },
  '-2013': {
    name: 'NO_SUCH_ORDER',
    message: 'Order does not exist',
    recoverable: false,
    action: 'checkOrder'
  },
  '-2015': {
    name: 'INVALID_API_KEY',
    message: 'Invalid API key',
    recoverable: false,
    action: 'checkCredentials'
  },
  '-2016': {
    name: 'INVALID_SIGNATURE',
    message: 'Invalid signature',
    recoverable: false,
    action: 'checkCredentials'
  },
  'FILTER_FAILURE': {
    name: 'FILTER_FAILURE',
    message: 'Order filter validation failed',
    recoverable: true,
    action: 'validateOrder'
  }
};

// Time sync state
let serverTimeOffset = 0;
let lastSyncTime = 0;
const SYNC_INTERVAL = 300000; // 5 minutes

/**
 * Parse Binance API error
 * @param {Object} error - Error object
 * @returns {Object} Parsed error
 */
function parseError(error) {
  let errorCode = null;
  let errorMessage = 'Unknown error';
  let errorData = null;

  // Handle different error formats
  if (error.code) {
    errorCode = error.code.toString();
    errorMessage = error.msg || error.message || 'Unknown error';
    errorData = error;
  } else if (error.error) {
    errorCode = error.error.code?.toString() || null;
    errorMessage = error.error.msg || error.error.message || 'Unknown error';
    errorData = error.error;
  } else if (typeof error === 'string') {
    // Try to parse JSON error string
    try {
      const parsed = JSON.parse(error);
      return parseError(parsed);
    } catch (e) {
      errorMessage = error;
    }
  } else {
    errorMessage = error.message || error.toString();
  }

  // Get error info from mapping
  const errorInfo = errorCode ? ERROR_CODES[errorCode] : null;

  return {
    code: errorCode,
    message: errorMessage,
    recoverable: errorInfo?.recoverable || false,
    action: errorInfo?.action || null,
    data: errorData,
    original: error
  };
}

/**
 * Handle error with recovery
 * @param {Object} error - Error object
 * @param {Function} retryFunction - Function to retry
 * @returns {Promise<Object>} Recovery result
 */
async function handleError(error, retryFunction) {
  const parsed = parseError(error);

  console.error('[Error Handler] Error:', parsed);

  // Check if recoverable
  if (!parsed.recoverable) {
    return {
      success: false,
      error: parsed,
      message: getUserFriendlyMessage(parsed)
    };
  }

  // Attempt recovery based on action
  try {
    switch (parsed.action) {
      case 'syncTime':
        await syncBinanceServerTime();
        // Retry after sync
        if (retryFunction) {
          return await retryFunction();
        }
        break;

      case 'rateLimit':
        // Wait and retry
        await delay(1000);
        if (retryFunction) {
          return await retryFunction();
        }
        break;

      case 'validateOrder':
        // Return error for user to fix
        return {
          success: false,
          error: parsed,
          message: getUserFriendlyMessage(parsed),
          needsUserAction: true
        };

      case 'insufficientMargin':
        // Return error with UI feedback needed
        return {
          success: false,
          error: parsed,
          message: getUserFriendlyMessage(parsed),
          needsUserAction: true,
          uiAction: 'highlightNotional'
        };

      case 'rateLimit':
        // Return error with cooldown timer
        return {
          success: false,
          error: parsed,
          message: getUserFriendlyMessage(parsed),
          needsUserAction: true,
          uiAction: 'showCooldown',
          cooldownSeconds: 60
        };

      default:
        return {
          success: false,
          error: parsed,
          message: getUserFriendlyMessage(parsed)
        };
    }
  } catch (recoveryError) {
    console.error('[Error Handler] Recovery failed:', recoveryError);
    return {
      success: false,
      error: parsed,
      message: getUserFriendlyMessage(parsed),
      recoveryFailed: true
    };
  }

  return {
    success: true,
    recovered: true
  };
}

/**
 * Get user-friendly error message
 * @param {Object} parsedError - Parsed error object
 * @returns {string} User-friendly message
 */
function getUserFriendlyMessage(parsedError) {
  const code = parsedError.code;
  const message = parsedError.message;

  // Custom messages for common errors
  if (code === '-1021') {
    return 'Time synchronization issue. Please try again.';
  } else if (code === '-1003') {
    return 'Too many requests. Please wait a moment and try again.';
  } else if (code === '-1111') {
    return 'Invalid trading symbol. Please check the symbol format.';
  } else if (code === '-2010') {
    return `Order rejected: ${message}`;
  } else if (code === '-2019') {
    return `Insufficient margin. Please reduce quantity or add more funds.`;
  } else if (code === '-1003') {
    return `Rate limit exceeded. Please wait before trying again.`;
  } else if (code === 'FILTER_FAILURE') {
    return `Order validation failed: ${message}. Please check quantity and price.`;
  } else if (code === '-2015' || code === '-2016') {
    return 'API credentials invalid. Please check your API keys.';
  }

  return message || 'An error occurred. Please try again.';
}

/**
 * Sync Binance server time
 * @param {string} environment - 'testnet' or 'mainnet'
 * @returns {Promise<number>} Time offset
 */
async function syncBinanceServerTime(environment = 'testnet') {
  try {
    const baseUrl = environment === 'testnet'
      ? 'https://testnet.binance.vision'
      : 'https://api.binance.com';

    const startTime = Date.now();
    const response = await fetch(`${baseUrl}/api/v3/time`);
    const endTime = Date.now();
    
    if (!response.ok) {
      throw new Error(`Failed to fetch server time: ${response.status}`);
    }

    const data = await response.json();
    const serverTime = data.serverTime;
    const networkLatency = (endTime - startTime) / 2;
    
    // Calculate offset
    const offset = serverTime - endTime + networkLatency;
    
    // Update offset
    serverTimeOffset = offset;
    lastSyncTime = Date.now();

    // Update signer if available
    if (typeof binanceSigner !== 'undefined') {
      binanceSigner.setServerTimeOffset(offset);
    }

    console.log('[Error Handler] Server time synced. Offset:', offset, 'ms');
    
    return offset;
  } catch (error) {
    console.error('[Error Handler] Time sync error:', error);
    throw error;
  }
}

/**
 * Auto-sync time if needed
 * @param {string} environment - 'testnet' or 'mainnet'
 * @returns {Promise<void>}
 */
async function autoSyncTimeIfNeeded(environment = 'testnet') {
  const now = Date.now();
  if (now - lastSyncTime > SYNC_INTERVAL) {
    await syncBinanceServerTime(environment);
  }
}

/**
 * Delay function
 * @param {number} ms - Milliseconds to delay
 * @returns {Promise<void>}
 */
function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Rate limiter
 */
class RateLimiter {
  constructor(maxRequests = 10, windowMs = 1000) {
    this.maxRequests = maxRequests;
    this.windowMs = windowMs;
    this.requests = [];
  }

  /**
   * Check if request is allowed
   * @returns {boolean} Allowed status
   */
  isAllowed() {
    const now = Date.now();
    
    // Remove old requests
    this.requests = this.requests.filter(time => now - time < this.windowMs);
    
    // Check if under limit
    if (this.requests.length < this.maxRequests) {
      this.requests.push(now);
      return true;
    }
    
    return false;
  }

  /**
   * Wait until request is allowed
   * @returns {Promise<void>}
   */
  async waitUntilAllowed() {
    while (!this.isAllowed()) {
      const oldestRequest = this.requests[0];
      const waitTime = this.windowMs - (Date.now() - oldestRequest);
      if (waitTime > 0) {
        await delay(waitTime);
      }
    }
  }
}

// Global rate limiter
const rateLimiter = new RateLimiter(10, 1000); // 10 requests per second

/**
 * Get rate limiter
 * @returns {RateLimiter} Rate limiter instance
 */
function getRateLimiter() {
  return rateLimiter;
}

// Export functions
if (typeof window !== 'undefined') {
  window.binanceErrorHandler = {
    parseError,
    handleError,
    getUserFriendlyMessage,
    syncBinanceServerTime,
    autoSyncTimeIfNeeded,
    getRateLimiter
  };
}

// Export for service worker context
if (typeof self !== 'undefined' && typeof importScripts !== 'undefined') {
  self.binanceErrorHandler = {
    parseError,
    handleError,
    getUserFriendlyMessage,
    syncBinanceServerTime,
    autoSyncTimeIfNeeded,
    getRateLimiter
  };
}

})();
