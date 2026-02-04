// Binance Execution Pro - Session Audit Log
// Production-Grade Request/Response Logging for Debugging

/**
 * Audit Log Module
 * 
 * This module provides:
 * - 100-line session log
 * - Request/response tracking
 * - Error logging
 * - Sanitized data (no API secrets)
 * - Storage in chrome.storage.local
 */

// Constants
const MAX_LOG_ENTRIES = 100;
const MAX_TRADING_HISTORY = 500;
const STORAGE_KEY = 'binance_audit_log';
const TRADING_HISTORY_KEY = 'binance_trading_history';

// Log entries
let auditLog = [];
let tradingHistory = [];

/**
 * Initialize audit log and trading history
 */
async function initializeAuditLog() {
  try {
    const result = await chrome.storage.local.get([STORAGE_KEY, TRADING_HISTORY_KEY]);
    auditLog = result[STORAGE_KEY] || [];
    tradingHistory = result[TRADING_HISTORY_KEY] || [];
    if (auditLog.length > MAX_LOG_ENTRIES) {
      auditLog = auditLog.slice(-MAX_LOG_ENTRIES);
      await saveAuditLog();
    }
    if (tradingHistory.length > MAX_TRADING_HISTORY) {
      tradingHistory = tradingHistory.slice(-MAX_TRADING_HISTORY);
      await saveTradingHistory();
    }
  } catch (error) {
    console.error('[Audit Log] Initialization error:', error);
    auditLog = [];
    tradingHistory = [];
  }
}

async function saveTradingHistory() {
  try {
    await chrome.storage.local.set({ [TRADING_HISTORY_KEY]: tradingHistory });
  } catch (error) {
    console.error('[Audit Log] Save trading history error:', error);
  }
}

/**
 * Log a completed trade for audit/history
 * @param {Object} trade - { symbol, side, notional, orderType, orderId, executedQty, avgPrice, executionTime, timestamp }
 */
async function logTrade(trade) {
  try {
    const entry = {
      timestamp: Date.now(),
      ...sanitizeData(trade)
    };
    tradingHistory.push(entry);
    if (tradingHistory.length > MAX_TRADING_HISTORY) {
      tradingHistory = tradingHistory.slice(-MAX_TRADING_HISTORY);
    }
    await saveTradingHistory();
  } catch (error) {
    console.error('[Audit Log] Log trade error:', error);
  }
}

function getTradingHistory() {
  return [...tradingHistory];
}

/**
 * Save audit log to storage
 */
async function saveAuditLog() {
  try {
    await chrome.storage.local.set({ [STORAGE_KEY]: auditLog });
  } catch (error) {
    console.error('[Audit Log] Save error:', error);
  }
}

/**
 * Sanitize data (remove API secrets)
 * @param {Object} data - Data to sanitize
 * @returns {Object} Sanitized data
 */
function sanitizeData(data) {
  if (!data || typeof data !== 'object') {
    return data;
  }

  const sanitized = { ...data };
  
  // Remove sensitive fields
  const sensitiveFields = ['apiSecret', 'secret', 'signature', 'password', 'key'];
  for (const field of sensitiveFields) {
    if (sanitized[field]) {
      sanitized[field] = '***REDACTED***';
    }
  }

  // Recursively sanitize nested objects
  for (const key in sanitized) {
    if (typeof sanitized[key] === 'object' && sanitized[key] !== null) {
      sanitized[key] = sanitizeData(sanitized[key]);
    }
  }

  return sanitized;
}

/**
 * Add log entry
 * @param {string} type - Log type ('request', 'response', 'error', 'info')
 * @param {Object} data - Log data
 */
async function addLogEntry(type, data) {
  try {
    const entry = {
      timestamp: Date.now(),
      type: type,
      data: sanitizeData(data)
    };

    auditLog.push(entry);

    // Trim to max entries
    if (auditLog.length > MAX_LOG_ENTRIES) {
      auditLog = auditLog.slice(-MAX_LOG_ENTRIES);
    }

    await saveAuditLog();

    // Notify listeners
    notifyLogListeners(entry);
  } catch (error) {
    console.error('[Audit Log] Add entry error:', error);
  }
}

/**
 * Log request
 * @param {Object} request - Request data
 */
async function logRequest(request) {
  await addLogEntry('request', {
    method: request.method || 'POST',
    url: request.url,
    params: request.params,
    timestamp: request.timestamp
  });
}

/**
 * Log response
 * @param {Object} response - Response data
 */
async function logResponse(response) {
  await addLogEntry('response', {
    status: response.status,
    data: response.data,
    executionTime: response.executionTime
  });
}

/**
 * Log error
 * @param {Object} error - Error data
 */
async function logError(error) {
  await addLogEntry('error', {
    code: error.code,
    message: error.message,
    details: error.details
  });
}

/**
 * Log info
 * @param {string} message - Info message
 * @param {Object} data - Additional data
 */
async function logInfo(message, data = {}) {
  await addLogEntry('info', {
    message: message,
    ...data
  });
}

/**
 * Get audit log
 * @returns {Array} Audit log entries
 */
function getAuditLog() {
  return [...auditLog]; // Return copy
}

/**
 * Clear audit log
 */
async function clearAuditLog() {
  auditLog = [];
  await saveAuditLog();
  notifyLogListeners({ type: 'clear' });
}

// Log listeners
let logListeners = [];

/**
 * Subscribe to log updates
 * @param {Function} callback - Callback function
 * @returns {Function} Unsubscribe function
 */
function onLogUpdate(callback) {
  logListeners.push(callback);
  return () => {
    const index = logListeners.indexOf(callback);
    if (index > -1) {
      logListeners.splice(index, 1);
    }
  };
}

/**
 * Notify log listeners
 * @param {Object} entry - Log entry
 */
function notifyLogListeners(entry) {
  logListeners.forEach(callback => {
    try {
      callback(entry);
    } catch (error) {
      console.error('[Audit Log] Listener error:', error);
    }
  });
}

// Initialize on load
if (typeof window !== 'undefined') {
  window.addEventListener('load', initializeAuditLog);
}

// Export functions
if (typeof window !== 'undefined') {
  window.auditLog = {
    initializeAuditLog,
    addLogEntry,
    logRequest,
    logResponse,
    logError,
    logInfo,
    logTrade,
    getAuditLog,
    getTradingHistory,
    clearAuditLog,
    onLogUpdate
  };
}

// Export for service worker context
if (typeof self !== 'undefined' && typeof importScripts !== 'undefined') {
  self.auditLog = {
    initializeAuditLog,
    addLogEntry,
    logRequest,
    logResponse,
    logError,
    logInfo,
    logTrade,
    getAuditLog,
    getTradingHistory,
    clearAuditLog,
    onLogUpdate
  };
  
  // Initialize in service worker
  initializeAuditLog();
}
