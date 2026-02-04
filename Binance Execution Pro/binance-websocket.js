// Binance Execution Pro - WebSocket Connection Manager
// Production-Grade Persistent WebSocket with Auto-Reconnect

(function () {

/**
 * WebSocket Manager
 * 
 * This module provides:
 * - Persistent WebSocket connection to Binance
 * - Auto-reconnect with exponential backoff
 * - Heartbeat/keep-alive mechanism
 * - Message queue for reconnection
 * - Connection state management
 * - Authenticated stream support
 */

// Connection state
let wsConnection = null;
let wsUrl = null;
let wsReconnectAttempts = 0;
let wsReconnectTimer = null;
let wsHeartbeatInterval = null;
let wsMessageQueue = [];
let wsConnectionStatus = 'disconnected';
let wsListeners = new Map();
let wsCredentials = null;

// Constants
const MAX_RECONNECT_ATTEMPTS = 10;
const INITIAL_RECONNECT_DELAY = 1000; // 1 second
const MAX_RECONNECT_DELAY = 60000; // 60 seconds
const HEARTBEAT_INTERVAL = 30000; // 30 seconds
const PING_INTERVAL = 20000; // 20 seconds

/**
 * Get WebSocket URL based on environment
 * @param {string} environment - 'testnet' or 'mainnet'
 * @param {string} streamType - 'spot', 'futures', or 'delivery'
 * @param {boolean} trading - If true, use trading WebSocket API
 * @returns {string} WebSocket URL
 */
function getWebSocketUrl(environment = 'testnet', streamType = 'futures', trading = false) {
  if (trading) {
    // Trading WebSocket API for order placement
    if (environment === 'testnet') {
      return 'wss://testnet.binance.vision/ws-fapi/v1';
    } else {
      if (streamType === 'futures') {
        return 'wss://ws-fapi.binance.com';
      } else {
        return 'wss://ws-api.binance.com:443/ws-api/v3';
      }
    }
  } else {
    // Standard stream WebSocket
    if (environment === 'testnet') {
      if (streamType === 'spot') {
        return 'wss://testnet.binance.vision/ws';
      } else if (streamType === 'futures') {
        return 'wss://stream.binancefuture.com/ws';
      } else {
        return 'wss://testnet.binance.vision/ws';
      }
    } else {
      if (streamType === 'spot') {
        return 'wss://stream.binance.com:9443/ws';
      } else if (streamType === 'futures') {
        return 'wss://fstream.binance.com/ws';
      } else {
        return 'wss://fstream.binance.com/ws';
      }
    }
  }
}

/**
 * Connect to Binance WebSocket
 * @param {Object} credentials - API credentials {apiKey, apiSecret, environment}
 * @param {string} streamType - 'spot', 'futures', or 'delivery'
 * @param {boolean} trading - If true, connect to trading WebSocket API
 * @returns {Promise<WebSocket>} WebSocket connection
 */
async function connectWebSocket(credentials, streamType = 'futures', trading = false) {
  return new Promise((resolve, reject) => {
    try {
      // Store credentials
      wsCredentials = credentials;

      // Get WebSocket URL
      wsUrl = getWebSocketUrl(credentials.environment, streamType, trading);

      // Close existing connection if any
      if (wsConnection && wsConnection.readyState === WebSocket.OPEN) {
        wsConnection.close();
      }

      // Create new connection
      wsConnection = new WebSocket(wsUrl);

      // Connection opened
      wsConnection.onopen = async () => {
        console.log('[WebSocket] Connected to Binance', trading ? '(Trading API)' : '(Stream API)');
        wsConnectionStatus = 'connected';
        wsReconnectAttempts = 0;
        
        // Clear reconnect timer
        if (wsReconnectTimer) {
          clearTimeout(wsReconnectTimer);
          wsReconnectTimer = null;
        }

        // For trading WebSocket, authenticate first
        if (trading && credentials.apiKey && credentials.apiSecret) {
          try {
            await authenticateTradingWebSocket(credentials);
          } catch (error) {
            console.error('[WebSocket] Trading authentication failed:', error);
            reject(error);
            return;
          }
        }

        // Start heartbeat
        startHeartbeat();

        // Process queued messages
        processMessageQueue();

        // Notify listeners
        notifyListeners('open', { status: 'connected', trading: trading });

        resolve(wsConnection);
      };

      // Message received
      wsConnection.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          handleWebSocketMessage(data);
        } catch (error) {
          console.error('[WebSocket] Message parse error:', error);
        }
      };

      // Connection error
      wsConnection.onerror = (error) => {
        console.error('[WebSocket] Connection error:', error);
        wsConnectionStatus = 'error';
        notifyListeners('error', { error: error });
      };

      // Connection closed
      wsConnection.onclose = (event) => {
        console.log('[WebSocket] Connection closed:', event.code, event.reason);
        wsConnectionStatus = 'disconnected';
        
        // Stop heartbeat
        stopHeartbeat();

        // Notify listeners
        notifyListeners('close', { code: event.code, reason: event.reason });

        // Attempt reconnect if not intentional
        if (event.code !== 1000) { // 1000 = normal closure
          attemptReconnect(credentials, streamType);
        }
      };

      // Connection timeout
      setTimeout(() => {
        if (wsConnection && wsConnection.readyState !== WebSocket.OPEN) {
          wsConnection.close();
          reject(new Error('WebSocket connection timeout'));
        }
      }, 10000); // 10 second timeout

    } catch (error) {
      console.error('[WebSocket] Connection error:', error);
      reject(error);
    }
  });
}

/**
 * Disconnect WebSocket
 */
function disconnectWebSocket() {
  if (wsConnection) {
    wsConnection.close(1000, 'User requested disconnect');
    wsConnection = null;
  }
  
  wsConnectionStatus = 'disconnected';
  stopHeartbeat();
  
  if (wsReconnectTimer) {
    clearTimeout(wsReconnectTimer);
    wsReconnectTimer = null;
  }
  
  wsMessageQueue = [];
  notifyListeners('disconnect', {});
}

/**
 * Attempt to reconnect with exponential backoff
 * @param {Object} credentials - API credentials
 * @param {string} streamType - Stream type
 */
function attemptReconnect(credentials, streamType) {
  if (wsReconnectAttempts >= MAX_RECONNECT_ATTEMPTS) {
    console.error('[WebSocket] Max reconnect attempts reached');
    wsConnectionStatus = 'failed';
    notifyListeners('failed', { message: 'Max reconnect attempts reached' });
    return;
  }

  wsReconnectAttempts++;
  const delay = Math.min(
    INITIAL_RECONNECT_DELAY * Math.pow(2, wsReconnectAttempts - 1),
    MAX_RECONNECT_DELAY
  );

  console.log(`[WebSocket] Reconnecting in ${delay}ms (attempt ${wsReconnectAttempts}/${MAX_RECONNECT_ATTEMPTS})`);

  wsConnectionStatus = 'reconnecting';
  notifyListeners('reconnecting', { attempt: wsReconnectAttempts, delay: delay });

  wsReconnectTimer = setTimeout(() => {
    connectWebSocket(credentials, streamType)
      .catch(error => {
        console.error('[WebSocket] Reconnect failed:', error);
      });
  }, delay);
}

/**
 * Send message via WebSocket
 * @param {Object} message - Message to send
 * @returns {Promise<boolean>} Success status
 */
function sendWebSocketMessage(message) {
  return new Promise((resolve, reject) => {
    if (!wsConnection || wsConnection.readyState !== WebSocket.OPEN) {
      // Queue message for later
      wsMessageQueue.push({ message, resolve, reject });
      console.warn('[WebSocket] Connection not ready, message queued');
      return;
    }

    try {
      const jsonMessage = JSON.stringify(message);
      wsConnection.send(jsonMessage);
      resolve(true);
    } catch (error) {
      console.error('[WebSocket] Send error:', error);
      reject(error);
    }
  });
}

/**
 * Process queued messages
 */
function processMessageQueue() {
  while (wsMessageQueue.length > 0) {
    const { message, resolve, reject } = wsMessageQueue.shift();
    sendWebSocketMessage(message)
      .then(resolve)
      .catch(reject);
  }
}

/**
 * Handle incoming WebSocket messages
 * @param {Object} data - Message data
 */
function handleWebSocketMessage(data) {
  // Handle different message types
  if (data.result !== undefined) {
    // Response to request
    notifyListeners('response', data);
  } else if (data.e) {
    // Stream data (price updates, order updates, etc.)
    notifyListeners('stream', data);
    
    // Specific stream handlers
    if (data.e === 'markPriceUpdate') {
      notifyListeners('markPrice', data);
    } else if (data.e === 'ORDER_TRADE_UPDATE') {
      notifyListeners('orderUpdate', data);
    } else if (data.e === 'ACCOUNT_UPDATE') {
      notifyListeners('accountUpdate', data);
    }
  } else if (data.ping) {
    // Ping - respond with pong
    sendWebSocketMessage({ pong: data.ping });
  } else {
    // Unknown message type
    notifyListeners('message', data);
  }
}

/**
 * Start heartbeat mechanism
 */
function startHeartbeat() {
  stopHeartbeat(); // Clear any existing interval

  wsHeartbeatInterval = setInterval(() => {
    if (wsConnection && wsConnection.readyState === WebSocket.OPEN) {
      // Send ping
      sendWebSocketMessage({ method: 'ping' }).catch(error => {
        console.error('[WebSocket] Heartbeat ping failed:', error);
      });
    }
  }, PING_INTERVAL);
}

/**
 * Stop heartbeat mechanism
 */
function stopHeartbeat() {
  if (wsHeartbeatInterval) {
    clearInterval(wsHeartbeatInterval);
    wsHeartbeatInterval = null;
  }
}

/**
 * Subscribe to WebSocket events
 * @param {string} event - Event name
 * @param {Function} callback - Callback function
 * @returns {Function} Unsubscribe function
 */
function onWebSocketEvent(event, callback) {
  if (!wsListeners.has(event)) {
    wsListeners.set(event, []);
  }
  
  wsListeners.get(event).push(callback);
  
  // Return unsubscribe function
  return () => {
    const callbacks = wsListeners.get(event);
    const index = callbacks.indexOf(callback);
    if (index > -1) {
      callbacks.splice(index, 1);
    }
  };
}

/**
 * Notify all listeners of an event
 * @param {string} event - Event name
 * @param {Object} data - Event data
 */
function notifyListeners(event, data) {
  const callbacks = wsListeners.get(event) || [];
  callbacks.forEach(callback => {
    try {
      callback(data);
    } catch (error) {
      console.error(`[WebSocket] Listener error for ${event}:`, error);
    }
  });
}

/**
 * Get connection status
 * @returns {string} Connection status
 */
function getConnectionStatus() {
  return wsConnectionStatus;
}

/**
 * Check if connected
 * @returns {boolean} Connection status
 */
function isConnected() {
  return wsConnectionStatus === 'connected' && 
         wsConnection && 
         wsConnection.readyState === WebSocket.OPEN;
}

/**
 * Subscribe to user data stream (authenticated)
 * @param {string} listenKey - Listen key from Binance
 * @returns {Promise<boolean>} Success status
 */
async function subscribeUserDataStream(listenKey) {
  if (!isConnected()) {
    throw new Error('WebSocket not connected');
  }

  const message = {
    method: 'SUBSCRIBE',
    params: [`${listenKey}@userDataStream`],
    id: Date.now()
  };

  return await sendWebSocketMessage(message);
}

/**
 * Unsubscribe from user data stream
 * @param {string} listenKey - Listen key
 * @returns {Promise<boolean>} Success status
 */
async function unsubscribeUserDataStream(listenKey) {
  if (!isConnected()) {
    throw new Error('WebSocket not connected');
  }

  const message = {
    method: 'UNSUBSCRIBE',
    params: [`${listenKey}@userDataStream`],
    id: Date.now()
  };

  return await sendWebSocketMessage(message);
}

/**
 * Authenticate trading WebSocket connection
 * @param {Object} credentials - API credentials
 * @returns {Promise<boolean>} Success status
 */
async function authenticateTradingWebSocket(credentials) {
  if (typeof binanceSigner === 'undefined') {
    throw new Error('Signer module not loaded');
  }

  // Create authentication message
  const timestamp = Date.now();
  const params = {
    apiKey: credentials.apiKey,
    timestamp: timestamp
  };

  // Sign the message
  const signature = await binanceSigner.signWebSocketMessage(params, credentials.apiSecret);

  const authMessage = {
    method: 'auth',
    params: {
      apiKey: credentials.apiKey,
      signature: signature,
      timestamp: timestamp
    },
    id: Date.now()
  };

  return await sendWebSocketMessage(authMessage);
}

/**
 * Place order via WebSocket trading API
 * @param {Object} orderParams - Order parameters
 * @param {Object} credentials - API credentials
 * @returns {Promise<Object>} Order response
 */
async function placeOrderViaWebSocket(orderParams, credentials) {
  if (!isConnected()) {
    throw new Error('WebSocket not connected');
  }

  // Sign the order request
  if (typeof binanceSigner === 'undefined') {
    throw new Error('Signer module not loaded');
  }

  const signedRequest = await binanceSigner.signOrderRequest(orderParams, credentials.apiSecret);

  // Build WebSocket order message
  const orderMessage = {
    method: 'order.place',
    params: signedRequest.params,
    id: Date.now()
  };

  // Send and wait for response
  return new Promise((resolve, reject) => {
    const requestId = orderMessage.id;
    let responseTimeout;

    // Set up response listener
    const responseHandler = (data) => {
      if (data.id === requestId) {
        clearTimeout(responseTimeout);
        unsubscribe();
        
        if (data.error) {
          reject(new Error(data.error.msg || 'Order placement failed'));
        } else {
          resolve(data.result);
        }
      }
    };

    const unsubscribe = onWebSocketEvent('response', responseHandler);

    // Send order
    sendWebSocketMessage(orderMessage)
      .then(() => {
        // Set timeout (10 seconds)
        responseTimeout = setTimeout(() => {
          unsubscribe();
          reject(new Error('Order placement timeout'));
        }, 10000);
      })
      .catch(reject);
  });
}

/**
 * Cancel order via WebSocket trading API
 * @param {Object} cancelParams - Cancel parameters
 * @param {Object} credentials - API credentials
 * @returns {Promise<Object>} Cancel response
 */
async function cancelOrderViaWebSocket(cancelParams, credentials) {
  if (!isConnected()) {
    throw new Error('WebSocket not connected');
  }

  if (typeof binanceSigner === 'undefined') {
    throw new Error('Signer module not loaded');
  }

  const signedRequest = await binanceSigner.signCancelReplaceRequest(cancelParams, credentials.apiSecret);

  const cancelMessage = {
    method: 'order.cancel',
    params: signedRequest.params,
    id: Date.now()
  };

  return new Promise((resolve, reject) => {
    const requestId = cancelMessage.id;
    let responseTimeout;

    const responseHandler = (data) => {
      if (data.id === requestId) {
        clearTimeout(responseTimeout);
        unsubscribe();
        
        if (data.error) {
          reject(new Error(data.error.msg || 'Order cancellation failed'));
        } else {
          resolve(data.result);
        }
      }
    };

    const unsubscribe = onWebSocketEvent('response', responseHandler);

    sendWebSocketMessage(cancelMessage)
      .then(() => {
        responseTimeout = setTimeout(() => {
          unsubscribe();
          reject(new Error('Order cancellation timeout'));
        }, 10000);
      })
      .catch(reject);
  });
}

/**
 * Cancel and replace order via WebSocket trading API
 * @param {Object} replaceParams - Replace parameters
 * @param {Object} credentials - API credentials
 * @returns {Promise<Object>} Replace response
 */
async function cancelReplaceOrderViaWebSocket(replaceParams, credentials) {
  if (!isConnected()) {
    throw new Error('WebSocket not connected');
  }

  if (typeof binanceSigner === 'undefined') {
    throw new Error('Signer module not loaded');
  }

  const signedRequest = await binanceSigner.signCancelReplaceRequest(replaceParams, credentials.apiSecret);

  const replaceMessage = {
    method: 'order.cancelReplace',
    params: signedRequest.params,
    id: Date.now()
  };

  return new Promise((resolve, reject) => {
    const requestId = replaceMessage.id;
    let responseTimeout;

    const responseHandler = (data) => {
      if (data.id === requestId) {
        clearTimeout(responseTimeout);
        unsubscribe();
        
        if (data.error) {
          reject(new Error(data.error.msg || 'Order cancel/replace failed'));
        } else {
          resolve(data.result);
        }
      }
    };

    const unsubscribe = onWebSocketEvent('response', responseHandler);

    sendWebSocketMessage(replaceMessage)
      .then(() => {
        responseTimeout = setTimeout(() => {
          unsubscribe();
          reject(new Error('Order cancel/replace timeout'));
        }, 10000);
      })
      .catch(reject);
  });
}

// Export functions
if (typeof window !== 'undefined') {
  window.binanceWebSocket = {
    connectWebSocket,
    disconnectWebSocket,
    sendWebSocketMessage,
    onWebSocketEvent,
    getConnectionStatus,
    isConnected,
    subscribeUserDataStream,
    unsubscribeUserDataStream,
    placeOrderViaWebSocket,
    cancelOrderViaWebSocket,
    cancelReplaceOrderViaWebSocket,
    authenticateTradingWebSocket
  };
}

// Export for service worker context
if (typeof self !== 'undefined' && typeof importScripts !== 'undefined') {
  self.binanceWebSocket = {
    connectWebSocket,
    disconnectWebSocket,
    sendWebSocketMessage,
    onWebSocketEvent,
    getConnectionStatus,
    isConnected,
    subscribeUserDataStream,
    unsubscribeUserDataStream,
    placeOrderViaWebSocket,
    cancelOrderViaWebSocket,
    cancelReplaceOrderViaWebSocket,
    authenticateTradingWebSocket
  };
}

})();
