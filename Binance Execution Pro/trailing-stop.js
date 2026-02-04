// Binance Execution Pro - Advanced Stop Loss (ASL) Logic
// Production-Grade Dynamic Trailing Stop Loss System

/**
 * Trailing Stop Loss Module
 * 
 * This module provides:
 * - Dynamic trailing stop loss (Levels 1-3)
 * - Atomic CANCEL_REPLACE operations
 * - Safety stop fallback
 * - Real-time position monitoring
 * - Profit-based callback rate adjustment
 */

// Position tracking
let activePositions = new Map();
let trailingStopTimers = new Map();
let safetyStopCheckInterval = null;

// ASL Configuration
const ASL_LEVELS = {
  LEVEL_1: {
    profitThreshold: 0.01, // 1% profit
    callbackRate: 0.02 // 2% callback
  },
  LEVEL_2: {
    profitThreshold: 0.02, // 2% profit
    callbackRate: 0.015 // 1.5% callback
  },
  LEVEL_3: {
    profitThreshold: 0.04, // 4% profit
    callbackRate: 0.01 // 1% callback
  }
};

const SAFETY_STOP_PERCENTAGE = -0.10; // -10% safety stop
const SAFETY_STOP_CHECK_INTERVAL = 500; // Check every 500ms

/**
 * Initialize trailing stop for a position
 * @param {Object} position - Position data
 * @param {Object} credentials - API credentials
 * @param {Function} executeCancelReplace - Function to execute CANCEL_REPLACE
 * @param {string} stopLossOrderId - Initial stop loss order ID (from Phase 1)
 */
function initializeTrailingStop(position, credentials, executeCancelReplace, stopLossOrderId = null) {
  const positionId = `${position.symbol}_${position.side}`;
  
  // Store position with atomic update tracking
  activePositions.set(positionId, {
    ...position,
    credentials: credentials,
    executeCancelReplace: executeCancelReplace,
    currentLevel: 0,
    lastCheckTime: Date.now(),
    stopLossOrderId: stopLossOrderId || position.stopLossOrderId,
    updating: false, // Prevents concurrent updates
    lastUpdateTime: Date.now()
  });

  // Start monitoring
  startTrailingStopMonitoring(positionId);
  
  // Start safety stop check
  if (!safetyStopCheckInterval) {
    startSafetyStopCheck();
  }

  console.log(`[ASL] ✅ Trailing stop initialized for ${positionId}. Stop Loss Order ID: ${stopLossOrderId || 'Pending'}`);
}

/**
 * Start trailing stop monitoring for a position
 * @param {string} positionId - Position identifier
 */
function startTrailingStopMonitoring(positionId) {
  // Clear existing timer if any
  if (trailingStopTimers.has(positionId)) {
    clearInterval(trailingStopTimers.get(positionId));
  }

  // Check position every second
  const timer = setInterval(() => {
    checkTrailingStop(positionId);
  }, 1000);

  trailingStopTimers.set(positionId, timer);
}

/**
 * Check and update trailing stop for a position
 * @param {string} positionId - Position identifier
 */
async function checkTrailingStop(positionId) {
  const position = activePositions.get(positionId);
  if (!position) {
    return;
  }

  try {
    // Get current mark price (from WebSocket stream)
    const currentPrice = await getCurrentMarkPrice(position.symbol);
    if (!currentPrice) {
      console.warn(`[ASL] No price data for ${position.symbol}`);
      return;
    }

    // Calculate profit percentage
    const entryPrice = parseFloat(position.entryPrice);
    const profitPct = position.side === 'LONG' 
      ? (currentPrice - entryPrice) / entryPrice
      : (entryPrice - currentPrice) / entryPrice;

    // Determine which level to apply
    let targetLevel = 0;
    let targetCallbackRate = null;

    if (profitPct >= ASL_LEVELS.LEVEL_3.profitThreshold) {
      targetLevel = 3;
      targetCallbackRate = ASL_LEVELS.LEVEL_3.callbackRate;
    } else if (profitPct >= ASL_LEVELS.LEVEL_2.profitThreshold) {
      targetLevel = 2;
      targetCallbackRate = ASL_LEVELS.LEVEL_2.callbackRate;
    } else if (profitPct >= ASL_LEVELS.LEVEL_1.profitThreshold) {
      targetLevel = 1;
      targetCallbackRate = ASL_LEVELS.LEVEL_1.callbackRate;
    }

    // Update trailing stop if level changed
    if (targetLevel > position.currentLevel && targetCallbackRate) {
      await updateTrailingStop(positionId, targetCallbackRate, currentPrice);
      position.currentLevel = targetLevel;
    }

    // Update position data
    position.currentPrice = currentPrice;
    position.profitPct = profitPct;
    position.lastCheckTime = Date.now();

  } catch (error) {
    console.error(`[ASL] Error checking trailing stop for ${positionId}:`, error);
  }
}

/**
 * Update trailing stop loss (ATOMIC - ensures old SL is canceled before new one is placed)
 * @param {string} positionId - Position identifier
 * @param {number} callbackRate - New callback rate
 * @param {number} currentPrice - Current mark price
 */
async function updateTrailingStop(positionId, callbackRate, currentPrice) {
  const position = activePositions.get(positionId);
  if (!position || !position.executeCancelReplace) {
    return;
  }

  // Prevent concurrent updates
  if (position.updating) {
    console.log(`[ASL] Update already in progress for ${positionId}, skipping`);
    return;
  }

  position.updating = true;

  try {
    // Calculate new stop loss price
    const entryPrice = parseFloat(position.entryPrice);
    let newStopPrice;

    if (position.side === 'LONG') {
      // For LONG: stop price = current price * (1 - callbackRate)
      newStopPrice = currentPrice * (1 - callbackRate);
    } else {
      // For SHORT: stop price = current price * (1 + callbackRate)
      newStopPrice = currentPrice * (1 + callbackRate);
    }

    // Round to appropriate precision
    newStopPrice = roundToPrecision(newStopPrice, 2);

    console.log(`[ASL] Updating trailing stop for ${positionId}: ${callbackRate * 100}% callback, stop price: ${newStopPrice}`);

    // ATOMIC OPERATION: Cancel old stop loss and place new one in single transaction
    // Binance CANCEL_REPLACE ensures atomicity - old order is only canceled if new one is accepted
    const cancelReplaceParams = {
      symbol: position.symbol,
      cancelOrderId: position.stopLossOrderId,
      side: position.side === 'LONG' ? 'SELL' : 'BUY',
      type: 'STOP_MARKET',
      stopPrice: newStopPrice,
      quantity: position.quantity,
      closePosition: false
    };

    // Execute CANCEL_REPLACE (atomic operation)
    const result = await position.executeCancelReplace(cancelReplaceParams);

    // Verify the operation succeeded
    if (!result || result.code) {
      throw new Error(`Cancel/replace failed: ${result?.msg || 'Unknown error'}`);
    }

    // Only update position state after successful confirmation
    // This ensures we never lose track of the stop loss
    position.stopLossOrderId = result.newOrderId || result.orderId;
    position.stopLossPrice = newStopPrice;
    position.callbackRate = callbackRate;
    position.lastUpdateTime = Date.now();

    console.log(`[ASL] ✅ Trailing stop updated atomically for ${positionId}. New order ID: ${position.stopLossOrderId}`);

  } catch (error) {
    console.error(`[ASL] Error updating trailing stop for ${positionId}:`, error);
    
    // If update failed, ensure we still have a stop loss
    if (!position.stopLossOrderId) {
      console.warn(`[ASL] ⚠️ No stop loss found after failed update, placing safety stop`);
      await placeSafetyStop(positionId);
    }
    
    throw error;
  } finally {
    position.updating = false;
  }
}

/**
 * Start safety stop check (runs periodically)
 */
function startSafetyStopCheck() {
  if (safetyStopCheckInterval) {
    return; // Already running
  }

  safetyStopCheckInterval = setInterval(() => {
    checkSafetyStops();
  }, SAFETY_STOP_CHECK_INTERVAL);
}

/**
 * Check all positions for safety stops
 */
async function checkSafetyStops() {
  for (const [positionId, position] of activePositions.entries()) {
    try {
      // Check if position has a stop loss
      if (!position.stopLossOrderId) {
        // No stop loss found - place safety stop
        await placeSafetyStop(positionId);
      }
    } catch (error) {
      console.error(`[ASL] Safety stop check error for ${positionId}:`, error);
    }
  }
}

/**
 * Place safety stop for a position
 * @param {string} positionId - Position identifier
 */
async function placeSafetyStop(positionId) {
  const position = activePositions.get(positionId);
  if (!position) {
    return;
  }

  try {
    const entryPrice = parseFloat(position.entryPrice);
    const safetyStopPrice = entryPrice * (1 + SAFETY_STOP_PERCENTAGE);

    console.warn(`[ASL] No stop loss found for ${positionId}, placing safety stop at ${safetyStopPrice}`);

    // Place safety stop order
    // This will be handled by the order execution module
    if (position.executeCancelReplace) {
      await position.executeCancelReplace({
        symbol: position.symbol,
        side: position.side === 'LONG' ? 'SELL' : 'BUY',
        type: 'STOP_MARKET',
        stopPrice: safetyStopPrice,
        quantity: position.quantity,
        isSafetyStop: true
      });
    }

  } catch (error) {
    console.error(`[ASL] Error placing safety stop for ${positionId}:`, error);
  }
}

/**
 * Remove trailing stop for a position
 * @param {string} positionId - Position identifier
 */
function removeTrailingStop(positionId) {
  // Clear timer
  if (trailingStopTimers.has(positionId)) {
    clearInterval(trailingStopTimers.get(positionId));
    trailingStopTimers.delete(positionId);
  }

  // Remove position
  activePositions.delete(positionId);

  // Stop safety check if no positions
  if (activePositions.size === 0 && safetyStopCheckInterval) {
    clearInterval(safetyStopCheckInterval);
    safetyStopCheckInterval = null;
  }
}

/**
 * Get current mark price (from WebSocket stream or API)
 * @param {string} symbol - Trading symbol
 * @returns {Promise<number|null>} Current mark price
 */
async function getCurrentMarkPrice(symbol) {
  // This will be populated by WebSocket stream
  // For now, return null (will be implemented in integration)
  return null;
}

/**
 * Set mark price (called by WebSocket stream)
 * @param {string} symbol - Trading symbol
 * @param {number} price - Mark price
 */
function setMarkPrice(symbol, price) {
  // Update all positions for this symbol
  for (const [positionId, position] of activePositions.entries()) {
    if (position.symbol === symbol) {
      position.currentPrice = price;
    }
  }
}

/**
 * Round number to precision
 * @param {number} value - Value to round
 * @param {number} decimals - Number of decimals
 * @returns {number} Rounded value
 */
function roundToPrecision(value, decimals) {
  const factor = Math.pow(10, decimals);
  return Math.round(value * factor) / factor;
}

/**
 * Get active positions
 * @returns {Array} List of active positions
 */
function getActivePositions() {
  return Array.from(activePositions.values());
}

/**
 * Get position by ID
 * @param {string} positionId - Position identifier
 * @returns {Object|null} Position data
 */
function getPosition(positionId) {
  return activePositions.get(positionId) || null;
}

// Export functions
if (typeof window !== 'undefined') {
  window.trailingStop = {
    initializeTrailingStop,
    removeTrailingStop,
    setMarkPrice,
    getActivePositions,
    getPosition,
    checkTrailingStop
  };
}

// Export for service worker context
if (typeof self !== 'undefined' && typeof importScripts !== 'undefined') {
  self.trailingStop = {
    initializeTrailingStop,
    removeTrailingStop,
    setMarkPrice,
    getActivePositions,
    getPosition,
    checkTrailingStop
  };
}
