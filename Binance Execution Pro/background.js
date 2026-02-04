// Binance Execution Pro - Background Service Worker
// Handles WebSocket connections, order execution, and secure communication

// Import modules (loaded dynamically in service worker context)
try {
  importScripts(
    'security.js',
    'binance-signer.js',
    'binance-validator.js',
    'binance-websocket.js',
    'trailing-stop.js',
    'error-handler.js',
    'audit-log.js',
    'license-manager.js'
  );
} catch (error) {
  console.error('[Binance Pro] Failed to load modules:', error);
}

// Legacy fallback WebSocket connection state (kept separate from binance-websocket.js globals)
let wsConnectionLegacy = null;
let wsReconnectAttempts = 0;
const MAX_RECONNECT_ATTEMPTS = 10;
const RECONNECT_DELAY = 1000; // Start with 1 second

// Connection status
let connectionStatus = 'disconnected';
let currentProfile = null;
let decryptedCredentials = null; // Stored in memory only during session
let proxyRegistered = false;

async function getProxyBaseUrl() {
  if (typeof licenseManager !== 'undefined' && licenseManager.EXECUTION_PROXY_BASE_URL) {
    return licenseManager.EXECUTION_PROXY_BASE_URL;
  }
  return 'http://localhost:8787';
}

async function getLicenseBearerToken() {
  if (typeof licenseManager === 'undefined') return null;
  const token = await licenseManager.refreshLicenseTokenIfNeeded().catch(() => null);
  return token;
}

async function proxyRegisterSession(profile) {
  const base = await getProxyBaseUrl();
  const url = `${base}/api/session/register`;
  const installId = typeof licenseManager !== 'undefined' ? await licenseManager.getInstallId() : 'unknown';
  const headers = { 'Content-Type': 'application/json' };
  if (profile.environment === 'mainnet') {
    const bearer = await getLicenseBearerToken();
    if (bearer) headers.Authorization = `Bearer ${bearer}`;
  }
  const resp = await fetch(url, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      installId,
      environment: profile.environment,
      apiKey: profile.apiKey,
      apiSecret: profile.apiSecret
    })
  });
  if (!resp.ok) {
    const text = await resp.text().catch(() => '');
    throw new Error(`Proxy register failed (${resp.status}): ${text}`);
  }
  proxyRegistered = true;
}

// Initialize
chrome.runtime.onInstalled.addListener(() => {
  console.log('[Binance Pro] Extension installed');
  initializeExtension();
});

// Open side panel when icon clicked
chrome.action.onClicked.addListener((tab) => {
  chrome.sidePanel.open({ windowId: tab.windowId });
});

// Handle keyboard shortcuts
chrome.commands.onCommand.addListener((command) => {
  if (command === 'execute-buy') {
    chrome.runtime.sendMessage({
      action: 'executeOrder',
      side: 'BUY',
      // Get current order params from storage or use defaults
    }).catch(error => {
      console.error('[Binance Pro] Keyboard shortcut error:', error);
    });
  } else if (command === 'execute-sell') {
    chrome.runtime.sendMessage({
      action: 'executeOrder',
      side: 'SELL',
      // Get current order params from storage or use defaults
    }).catch(error => {
      console.error('[Binance Pro] Keyboard shortcut error:', error);
    });
  }
});

// Handle messages from sidepanel
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'executeOrder') {
    executeOrder(request)
      .then(result => sendResponse(result))
      .catch(error => sendResponse({ success: false, error: error.message }));
    return true; // Keep channel open for async
  } else if (request.action === 'closeAllPositions') {
    closeAllPositions()
      .then(result => sendResponse(result))
      .catch(error => sendResponse({ success: false, error: error.message }));
    return true;
  } else if (request.action === 'getProfiles') {
    if (typeof binanceSecurity === 'undefined') {
      sendResponse({ success: false, error: 'Security module not loaded' });
      return;
    }
    binanceSecurity.getProfiles()
      .then(profiles => sendResponse({ success: true, profiles }))
      .catch(error => sendResponse({ success: false, error: error.message }));
    return true;
  } else if (request.action === 'connectWebSocket') {
    connectWebSocket(request.profile)
      .then(() => {
        console.log('[Binance Pro] WebSocket connection successful');
        sendResponse({ success: true, message: 'Connected successfully' });
      })
      .catch(error => {
        console.error('[Binance Pro] WebSocket connection failed:', error);
        sendResponse({ 
          success: false, 
          error: error.message || 'Connection failed',
          details: error.toString()
        });
      });
    return true; // Keep channel open for async response
  }
});

// Start 60-second time sync heartbeat
function startTimeSyncHeartbeat(environment) {
  stopTimeSyncHeartbeat(); // Clear any existing interval

  // Sync immediately
  if (typeof binanceErrorHandler !== 'undefined') {
    binanceErrorHandler.syncBinanceServerTime(environment).catch(error => {
      console.error('[Binance Pro] Initial time sync failed:', error);
    });
  }

  // Then sync every 60 seconds
  timeSyncInterval = setInterval(() => {
    if (typeof binanceErrorHandler !== 'undefined') {
      binanceErrorHandler.syncBinanceServerTime(environment).catch(error => {
        console.error('[Binance Pro] Time sync heartbeat failed:', error);
      });
    }
  }, 60000); // 60 seconds
}

// Stop time sync heartbeat
function stopTimeSyncHeartbeat() {
  if (timeSyncInterval) {
    clearInterval(timeSyncInterval);
    timeSyncInterval = null;
  }
}

// Initialize extension
async function initializeExtension() {
  // Check if vault is initialized
  if (typeof binanceSecurity !== 'undefined') {
    const isInitialized = await binanceSecurity.isVaultInitialized();
    if (isInitialized) {
      // Load active profile
      const activeProfileId = await binanceSecurity.getActiveProfileId();
      if (activeProfileId) {
        // Note: We can't decrypt here without master password
        // Connection will be established when user unlocks vault
        console.log('[Binance Pro] Vault initialized, waiting for user unlock');
      }
    }
  }
}

// Connect to Binance WebSocket
async function connectWebSocket(profile) {
  if (!profile) {
    throw new Error('No profile selected');
  }

  // Gatekeeper: MAINNET requires a valid paid license token
  if (profile.environment === 'mainnet') {
    if (typeof licenseManager === 'undefined') {
      throw new Error('License manager not loaded. Cannot enable mainnet.');
    }
    await licenseManager.requireMainnetAllowed();
  }

  // Register credentials with server-side execution proxy (authoritative execution layer)
  try {
    await proxyRegisterSession(profile);
  } catch (e) {
    console.warn('[Binance Pro] Proxy register failed; execution may fallback to direct Binance:', e);
    proxyRegistered = false;
  }

  // Store decrypted credentials in memory (session only)
  decryptedCredentials = {
    apiKey: profile.apiKey,
    apiSecret: profile.apiSecret,
    environment: profile.environment
  };

  currentProfile = profile;

  try {
    // Use WebSocket manager if available
    if (typeof binanceWebSocket !== 'undefined') {
      // Sync time before connecting
      if (typeof binanceErrorHandler !== 'undefined') {
        await binanceErrorHandler.autoSyncTimeIfNeeded(profile.environment);
      }

      // Connect to TRADING WebSocket (for order placement)
      tradingWebSocket = await binanceWebSocket.connectWebSocket({
        apiKey: profile.apiKey,
        apiSecret: profile.apiSecret,
        environment: profile.environment
      }, 'futures', true); // true = trading WebSocket

      // Connect to STREAM WebSocket (for price updates, order updates)
      streamWebSocket = await binanceWebSocket.connectWebSocket({
        apiKey: profile.apiKey,
        apiSecret: profile.apiSecret,
        environment: profile.environment
      }, 'futures', false); // false = stream WebSocket

      // Set up event listeners for trading WebSocket
      binanceWebSocket.onWebSocketEvent('open', (data) => {
        if (data.trading) {
          connectionStatus = 'connected';
          wsReconnectAttempts = 0;
          updateConnectionStatus('connected', 'Connected');
          
          // Start 60-second time sync heartbeat
          startTimeSyncHeartbeat(profile.environment);
        }
      });

      binanceWebSocket.onWebSocketEvent('close', (data) => {
        connectionStatus = 'disconnected';
        updateConnectionStatus('disconnected', 'Disconnected');
        stopTimeSyncHeartbeat();
      });

      binanceWebSocket.onWebSocketEvent('error', (data) => {
        connectionStatus = 'error';
        updateConnectionStatus('warning', 'Connection Error');
      });

      binanceWebSocket.onWebSocketEvent('markPrice', (data) => {
        // Update trailing stop with mark price
        if (typeof trailingStop !== 'undefined') {
          trailingStop.setMarkPrice(data.s, parseFloat(data.p));
        }
      });

      binanceWebSocket.onWebSocketEvent('orderUpdate', (data) => {
        handleOrderUpdate(data);
      });

      binanceWebSocket.onWebSocketEvent('accountUpdate', (data) => {
        handleAccountUpdate(data);
      });

    } else {
      // Fallback to basic WebSocket
      const wsUrl = profile.environment === 'testnet' 
        ? 'wss://testnet.binance.vision/ws'
        : 'wss://fstream.binance.com/ws';

      if (wsConnectionLegacy) {
        wsConnectionLegacy.close();
      }

      wsConnectionLegacy = new WebSocket(wsUrl);

      wsConnectionLegacy.onopen = () => {
        console.log('[Binance Pro] WebSocket connected');
        connectionStatus = 'connected';
        wsReconnectAttempts = 0;
        updateConnectionStatus('connected', 'Connected');
      };

      wsConnectionLegacy.onmessage = (event) => {
        handleWebSocketMessage(JSON.parse(event.data));
      };

      wsConnectionLegacy.onerror = (error) => {
        console.error('[Binance Pro] WebSocket error:', error);
        connectionStatus = 'error';
        updateConnectionStatus('warning', 'Connection Error');
      };

      wsConnectionLegacy.onclose = () => {
        console.log('[Binance Pro] WebSocket closed');
        connectionStatus = 'disconnected';
        updateConnectionStatus('disconnected', 'Disconnected');
        
        if (wsReconnectAttempts < MAX_RECONNECT_ATTEMPTS) {
          const delay = RECONNECT_DELAY * Math.pow(2, wsReconnectAttempts);
          wsReconnectAttempts++;
          setTimeout(() => connectWebSocket(profile), delay);
        }
      };
    }
  } catch (error) {
    console.error('[Binance Pro] WebSocket connection failed:', error);
    throw error;
  }
}

// Handle WebSocket messages
function handleWebSocketMessage(data) {
  // Handle different message types
  if (data.e === 'ORDER_TRADE_UPDATE') {
    // Order update received
    handleOrderUpdate(data);
  } else if (data.e === 'ACCOUNT_UPDATE') {
    // Account balance update
    handleAccountUpdate(data);
  }
}

// Execute order
async function executeOrder(params) {
  const startTime = Date.now();

  if (!decryptedCredentials) {
    throw new Error('No profile selected. Please set up API keys in Setup tab.');
  }

  // Gatekeeper: MAINNET order execution requires a valid paid license token
  if (decryptedCredentials.environment === 'mainnet') {
    if (typeof licenseManager === 'undefined') {
      throw new Error('License manager not loaded. Cannot execute mainnet orders.');
    }
    await licenseManager.requireMainnetAllowed();
  }

  // Server-side execution path (preferred): send to execution proxy
  const installId = typeof licenseManager !== 'undefined' ? await licenseManager.getInstallId() : null;
  if (proxyRegistered && installId) {
    const base = await getProxyBaseUrl();
    const url = `${base}/api/order/futures`;
    const headers = { 'Content-Type': 'application/json' };
    if (decryptedCredentials.environment === 'mainnet') {
      const bearer = await getLicenseBearerToken();
      if (!bearer) throw new Error('Paid license token required for mainnet execution');
      headers.Authorization = `Bearer ${bearer}`;
    }

    const orderType = (params.orderType === 'limit') ? 'LIMIT' : 'MARKET';
    const serverParams = {
      symbol: params.symbol.toUpperCase(),
      side: params.side.toUpperCase(),
      type: orderType,
      quoteOrderQty: parseFloat(params.notional),
      reduceOnly: false
    };
    if (orderType === 'LIMIT' && params.limitPrice) {
      serverParams.price = parseFloat(params.limitPrice);
    }
    if (params.stopLoss && typeof params.stopLoss === 'object') {
      serverParams.stopLoss = params.stopLoss;
    }
    if (params.trailingStop && typeof params.trailingStop === 'object') {
      serverParams.trailingStop = params.trailingStop;
    }
    if (params.takeProfitPrice) {
      serverParams.takeProfitPrice = parseFloat(params.takeProfitPrice);
    }
    if (params.leverage) serverParams.leverage = parseInt(params.leverage, 10) || 1;

    // Audit log
    if (typeof auditLog !== 'undefined') {
      await auditLog.logRequest({ method: 'POST', url, params: serverParams, timestamp: Date.now() });
    }

    const resp = await fetch(url, { method: 'POST', headers, body: JSON.stringify({ installId, params: serverParams }) });
    const data = await resp.json().catch(() => ({}));

    if (typeof auditLog !== 'undefined') {
      await auditLog.logResponse({ status: resp.ok ? 'success' : 'error', data, executionTime: Date.now() - startTime });
    }

    if (!resp.ok || !data.ok) {
      const errObj = data.binance || data;
      return { success: false, error: errObj, message: data.message || 'Proxy execution failed' };
    }

    const executionTime = Date.now() - startTime;
    if (typeof auditLog !== 'undefined' && auditLog.logTrade) {
      await auditLog.logTrade({
        symbol: params.symbol,
        side: params.side,
        notional: params.notional,
        orderType: params.orderType || 'market',
        orderId: data.data?.orderId,
        executedQty: data.data?.executedQty,
        avgPrice: data.data?.avgPrice,
        executionTime,
        timestamp: Date.now()
      });
    }
    return { success: true, ...data.data, executionTime, message: 'Order executed via proxy' };
  }

  // Client-side execution fallback (legacy)
  if (typeof binanceWebSocket === 'undefined' || !binanceWebSocket.isConnected()) {
    throw new Error('Not connected to Binance. Please check your connection.');
  }

  try {
    // Rate limiting
    if (typeof binanceErrorHandler !== 'undefined') {
      const rateLimiter = binanceErrorHandler.getRateLimiter();
      await rateLimiter.waitUntilAllowed();
    }

    // Auto-sync time
    if (typeof binanceErrorHandler !== 'undefined') {
      await binanceErrorHandler.autoSyncTimeIfNeeded(decryptedCredentials.environment);
    }

    const orderType = (params.orderType === 'limit') ? 'LIMIT' : 'MARKET';
    let orderParams = {
      symbol: params.symbol.toUpperCase(),
      side: params.side.toUpperCase(),
      type: params.mode === 'spot' ? 'MARKET' : orderType,
      quantity: null,
      quoteOrderQty: null
    };
    if (orderType === 'LIMIT' && params.limitPrice) {
      orderParams.price = parseFloat(params.limitPrice);
    }

    // Determine quantity or notional
    if (params.mode === 'spot') {
      // Spot: use notional (quoteOrderQty)
      orderParams.quoteOrderQty = parseFloat(params.notional);
    } else {
      // Futures: calculate quantity from notional
      // For now, use notional as quoteOrderQty (will be converted by Binance)
      orderParams.quoteOrderQty = parseFloat(params.notional);
    }

    if (params.mode === 'futures') {
      orderParams.leverage = parseInt(params.leverage, 10) || 1;
    }

    // Pre-flight validation
    if (typeof binanceValidator !== 'undefined') {
      const validation = await binanceValidator.preflightOrderValidation(
        orderParams,
        decryptedCredentials.environment
      );

      if (!validation.valid) {
        throw new Error(`Validation failed: ${validation.errors.join(', ')}`);
      }

      orderParams = validation.validated;
    }

    // Sign request
    if (typeof binanceSigner === 'undefined') {
      throw new Error('Signing module not loaded');
    }

    const signedRequest = await binanceSigner.signOrderRequest(
      orderParams,
      decryptedCredentials.apiSecret
    );

    // Build API request
    const baseUrl = decryptedCredentials.environment === 'testnet'
      ? 'https://testnet.binance.vision'
      : 'https://fapi.binance.com';

    const endpoint = params.mode === 'spot'
      ? '/api/v3/order'
      : '/fapi/v1/order';

    // Build query string using signer
    const queryString = typeof binanceSigner !== 'undefined' && binanceSigner.buildQueryString
      ? binanceSigner.buildQueryString(signedRequest.params)
      : Object.keys(signedRequest.params)
          .map(key => `${encodeURIComponent(key)}=${encodeURIComponent(signedRequest.params[key])}`)
          .join('&');
    const url = `${baseUrl}${endpoint}?${queryString}`;

    // Execute order via WebSocket Trading API (sub-250ms execution)
    let result;
    const executionStartTime = Date.now();

    if (typeof binanceWebSocket !== 'undefined' && binanceWebSocket.isConnected() && tradingWebSocket) {
      try {
        // Use WebSocket trading API for faster execution
        result = await binanceWebSocket.placeOrderViaWebSocket(
          orderParams,
          decryptedCredentials
        );
        
        const executionTime = Date.now() - executionStartTime;
        console.log(`[Binance Pro] Order executed via WebSocket in ${executionTime}ms`);
      } catch (wsError) {
        console.warn('[Binance Pro] WebSocket order failed, falling back to REST:', wsError);
        
        // Fallback to REST API
        const response = await fetch(url, {
          method: 'POST',
          headers: {
            'X-MBX-APIKEY': decryptedCredentials.apiKey
          }
        });

        result = await response.json();
      }
    } else {
      // Fallback to REST API if WebSocket not available
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'X-MBX-APIKEY': decryptedCredentials.apiKey
        }
      });

      result = await response.json();
    }

    // Handle errors
    if (!result || result.code) {
      // Log error
      if (typeof auditLog !== 'undefined') {
        await auditLog.logError({
          code: result.code,
          message: result.msg || 'Order execution failed',
          details: result
        });
      }

      if (typeof binanceErrorHandler !== 'undefined') {
        const handled = await binanceErrorHandler.handleError(result, async () => {
          // Retry function
          return await executeOrder(params);
        });

        if (!handled.success) {
          throw new Error(handled.message || 'Order execution failed');
        }

        return handled;
      } else {
        throw new Error(result.msg || 'Order execution failed');
      }
    }

    // Calculate execution time
    const executionTime = Date.now() - startTime;
    console.log(`[Binance Pro] Order executed in ${executionTime}ms`);

    // Initialize trailing stop if configured (Phase 1: Entry + Hard Stop)
    const stopLossInitiation = params.stopLoss && typeof params.stopLoss === 'object'
      ? (params.stopLoss.initiation || 0)
      : (parseFloat(params.stopLoss) || 0);
    if (stopLossInitiation > 0 && typeof trailingStop !== 'undefined') {
      const stopLossParams = { ...params, stopLoss: stopLossInitiation };
      const stopLossOrderId = await placeStopLossOrder(result, stopLossParams, decryptedCredentials);

      if (stopLossOrderId) {
        // Initialize trailing stop monitoring with confirmed stop loss order ID
        trailingStop.initializeTrailingStop({
          symbol: orderParams.symbol,
          side: orderParams.side,
          entryPrice: parseFloat(result.avgPrice || result.price || 0),
          quantity: parseFloat(result.executedQty || orderParams.quantity || 0),
          stopLossOrderId: stopLossOrderId, // Confirmed order ID from Phase 1
          stopLossPrice: null
        }, decryptedCredentials, async (cancelReplaceParams) => {
          // Phase 2: Execute atomic cancel/replace for trailing stop
          return await executeCancelReplace(cancelReplaceParams, decryptedCredentials);
        });
      } else {
        console.warn('[Binance Pro] Stop loss order placement failed, ASL not initialized');
      }
    }

    if (typeof auditLog !== 'undefined' && auditLog.logTrade) {
      await auditLog.logTrade({
        symbol: params.symbol,
        side: params.side,
        notional: params.notional,
        orderType: params.orderType || 'market',
        orderId: result.orderId || result.clientOrderId,
        executedQty: result.executedQty,
        avgPrice: result.avgPrice,
        executionTime,
        timestamp: Date.now()
      });
    }
    return {
      success: true,
      orderId: result.orderId || result.clientOrderId,
      symbol: result.symbol,
      side: result.side,
      executedQty: result.executedQty,
      avgPrice: result.avgPrice,
      status: result.status,
      executionTime,
      message: 'Order executed successfully'
    };

  } catch (error) {
    console.error('[Binance Pro] Order execution error:', error);
    
    // Handle error with recovery
    if (typeof binanceErrorHandler !== 'undefined') {
      const handled = await binanceErrorHandler.handleError(error, async () => {
        return await executeOrder(params);
      });

      if (!handled.success) {
        throw new Error(handled.message || error.message);
      }

      return handled;
    } else {
      throw error;
    }
  }
}

// Place stop loss order
async function placeStopLossOrder(orderResult, params, credentials) {
  try {
    const stopLossPct = parseFloat(params.stopLoss) / 100;
    const entryPrice = parseFloat(orderResult.avgPrice || orderResult.price || 0);
    
    let stopPrice;
    if (orderResult.side === 'BUY' || orderResult.side === 'LONG') {
      stopPrice = entryPrice * (1 - stopLossPct);
    } else {
      stopPrice = entryPrice * (1 + stopLossPct);
    }

    const stopOrderParams = {
      symbol: orderResult.symbol,
      side: orderResult.side === 'BUY' ? 'SELL' : 'BUY',
      type: 'STOP_MARKET',
      stopPrice: stopPrice,
      quantity: orderResult.executedQty || params.quantity,
      closePosition: false
    };

    const signedRequest = await binanceSigner.signOrderRequest(
      stopOrderParams,
      credentials.apiSecret
    );

    const baseUrl = credentials.environment === 'testnet'
      ? 'https://testnet.binance.vision'
      : 'https://fapi.binance.com';

    // Build query string using signer
    const queryString = typeof binanceSigner !== 'undefined' && binanceSigner.buildQueryString
      ? binanceSigner.buildQueryString(signedRequest.params)
      : Object.keys(signedRequest.params)
          .map(key => `${encodeURIComponent(key)}=${encodeURIComponent(signedRequest.params[key])}`)
          .join('&');
    const url = `${baseUrl}/fapi/v1/order?${queryString}`;

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'X-MBX-APIKEY': credentials.apiKey
      }
    });

    const result = await response.json();

    if (!response.ok || result.code) {
      console.error('[Binance Pro] Stop loss order failed:', result);
      return null;
    }

    return result.orderId;

  } catch (error) {
    console.error('[Binance Pro] Stop loss placement error:', error);
    return null;
  }
}

// Execute cancel/replace
async function executeCancelReplace(params, credentials) {
  try {
    const cancelReplaceParams = {
      symbol: params.symbol,
      cancelOrderId: params.cancelOrderId,
      side: params.side,
      type: 'STOP_MARKET',
      stopPrice: params.newStopPrice,
      quantity: params.quantity
    };

    const signedRequest = await binanceSigner.signCancelReplaceRequest(
      cancelReplaceParams,
      credentials.apiSecret
    );

    const baseUrl = credentials.environment === 'testnet'
      ? 'https://testnet.binance.vision'
      : 'https://fapi.binance.com';

    // Build query string using signer
    const queryString = typeof binanceSigner !== 'undefined' && binanceSigner.buildQueryString
      ? binanceSigner.buildQueryString(signedRequest.params)
      : Object.keys(signedRequest.params)
          .map(key => `${encodeURIComponent(key)}=${encodeURIComponent(signedRequest.params[key])}`)
          .join('&');
    const url = `${baseUrl}/fapi/v1/order?${queryString}`;

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'X-MBX-APIKEY': credentials.apiKey
      }
    });

    const result = await response.json();

    if (!response.ok || result.code) {
      throw new Error(result.msg || 'Cancel/replace failed');
    }

    return result;

  } catch (error) {
    console.error('[Binance Pro] Cancel/replace error:', error);
    throw error;
  }
}

// Close all positions (KILL SWITCH - Production Implementation)
async function closeAllPositions() {
  if (!decryptedCredentials) {
    throw new Error('No profile selected');
  }

  if (connectionStatus !== 'connected') {
    throw new Error('Not connected to Binance');
  }

  // Server-side kill switch (preferred)
  const installId = typeof licenseManager !== 'undefined' ? await licenseManager.getInstallId() : null;
  if (proxyRegistered && installId) {
    const base = await getProxyBaseUrl();
    const url = `${base}/api/kill-switch/futures`;
    const headers = { 'Content-Type': 'application/json' };
    if (decryptedCredentials.environment === 'mainnet') {
      const bearer = await getLicenseBearerToken();
      if (!bearer) throw new Error('Paid license token required for mainnet kill switch');
      headers.Authorization = `Bearer ${bearer}`;
    }

    if (typeof auditLog !== 'undefined') {
      await auditLog.logRequest({ method: 'POST', url, params: { installId }, timestamp: Date.now() });
    }

    const resp = await fetch(url, { method: 'POST', headers, body: JSON.stringify({ installId }) });
    const data = await resp.json().catch(() => ({}));

    if (typeof auditLog !== 'undefined') {
      await auditLog.logResponse({ status: resp.ok ? 'success' : 'error', data, executionTime: 0 });
    }

    if (!resp.ok || !data.ok) {
      return { success: false, error: data, message: data.message || 'Kill switch failed (proxy)' };
    }

    return {
      success: true,
      message: 'Kill switch executed via proxy',
      details: data
    };
  }

  try {
    const baseUrl = decryptedCredentials.environment === 'testnet'
      ? 'https://testnet.binance.vision'
      : 'https://fapi.binance.com';

    // Step 1: Fetch all open positions
    const positionsParams = { timestamp: Date.now() };
    const signedPositions = await binanceSigner.signPositionRequest(positionsParams, decryptedCredentials.apiSecret);
    const positionsQueryString = binanceSigner.buildQueryString(signedPositions.params);
    const positionsUrl = `${baseUrl}/fapi/v2/positionRisk?${positionsQueryString}`;

    const positionsResponse = await fetch(positionsUrl, {
      method: 'GET',
      headers: { 'X-MBX-APIKEY': decryptedCredentials.apiKey }
    });

    const positionsData = await positionsResponse.json();
    const openPositions = Array.isArray(positionsData) 
      ? positionsData.filter(p => parseFloat(p.positionAmt) !== 0)
      : [];

    if (openPositions.length === 0) {
      return { success: true, closed: 0, cancelled: 0, message: 'No open positions found' };
    }

    // Step 2: Close all positions (Market Orders)
    const closeResults = [];
    for (const position of openPositions) {
      try {
        const closeOrderParams = {
          symbol: position.symbol,
          side: parseFloat(position.positionAmt) > 0 ? 'SELL' : 'BUY',
          type: 'MARKET',
          reduceOnly: true,
          quantity: Math.abs(parseFloat(position.positionAmt))
        };

        const signedClose = await binanceSigner.signOrderRequest(closeOrderParams, decryptedCredentials.apiSecret);
        const closeQueryString = binanceSigner.buildQueryString(signedClose.params);
        const closeUrl = `${baseUrl}/fapi/v1/order?${closeQueryString}`;

        const closeResponse = await fetch(closeUrl, {
          method: 'POST',
          headers: { 'X-MBX-APIKEY': decryptedCredentials.apiKey }
        });

        const closeResult = await closeResponse.json();
        closeResults.push({
          symbol: position.symbol,
          success: closeResponse.ok && !closeResult.code,
          orderId: closeResult.orderId,
          error: closeResult.msg
        });
      } catch (error) {
        closeResults.push({ symbol: position.symbol, success: false, error: error.message });
      }
    }

    // Step 3: Cancel all open orders
    const cancelledOrders = [];
    const uniqueSymbols = [...new Set(openPositions.map(p => p.symbol))];
    
    for (const symbol of uniqueSymbols) {
      try {
        const openOrdersParams = { symbol: symbol, timestamp: Date.now() };
        const signedOpenOrders = await binanceSigner.signBinanceRequest(openOrdersParams, decryptedCredentials.apiSecret);
        const openOrdersQueryString = binanceSigner.buildQueryString(signedOpenOrders.params);
        const openOrdersUrl = `${baseUrl}/fapi/v1/openOrders?${openOrdersQueryString}`;

        const openOrdersResponse = await fetch(openOrdersUrl, {
          method: 'GET',
          headers: { 'X-MBX-APIKEY': decryptedCredentials.apiKey }
        });

        const openOrders = await openOrdersResponse.json();
        if (Array.isArray(openOrders) && openOrders.length > 0) {
          for (const order of openOrders) {
            try {
              const cancelOrderParams = { symbol: symbol, orderId: order.orderId, timestamp: Date.now() };
              const signedCancelOrder = await binanceSigner.signBinanceRequest(cancelOrderParams, decryptedCredentials.apiSecret);
              const cancelOrderQueryString = binanceSigner.buildQueryString(signedCancelOrder.params);
              const cancelOrderUrl = `${baseUrl}/fapi/v1/order?${cancelOrderQueryString}`;

              const cancelOrderResponse = await fetch(cancelOrderUrl, {
                method: 'DELETE',
                headers: { 'X-MBX-APIKEY': decryptedCredentials.apiKey }
              });

              const cancelOrderResult = await cancelOrderResponse.json();
              if (cancelOrderResponse.ok && !cancelOrderResult.code) {
                cancelledOrders.push({ symbol: symbol, orderId: order.orderId, success: true });
              }
            } catch (error) {
              console.error(`[Binance Pro] Failed to cancel order ${order.orderId}:`, error);
            }
          }
        }
      } catch (error) {
        console.error(`[Binance Pro] Failed to fetch/cancel orders for ${symbol}:`, error);
      }
    }

    // Step 4: Stop all trailing stops
    if (typeof trailingStop !== 'undefined') {
      const activePositions = trailingStop.getActivePositions();
      for (const pos of activePositions) {
        trailingStop.removeTrailingStop(`${pos.symbol}_${pos.side}`);
      }
    }

    const successCount = closeResults.filter(r => r.success).length;
    return {
      success: true,
      closed: successCount,
      failed: closeResults.length - successCount,
      cancelled: cancelledOrders.length,
      details: { closed: closeResults, cancelled: cancelledOrders },
      message: `Kill switch executed: ${successCount} positions closed, ${cancelledOrders.length} orders cancelled`
    };

  } catch (error) {
    console.error('[Binance Pro] Kill switch error:', error);
    throw error;
  }
}

// Handle order update
function handleOrderUpdate(data) {
  // Update UI with order status
  chrome.runtime.sendMessage({
    action: 'orderUpdate',
    data: data
  }).catch(() => {});
}

// Handle account update
function handleAccountUpdate(data) {
  // Update UI with account balance
  chrome.runtime.sendMessage({
    action: 'accountUpdate',
    data: data
  }).catch(() => {});
}

// Get profiles
async function getProfiles() {
  return new Promise((resolve) => {
    chrome.storage.local.get(['profiles', 'activeProfile'], (result) => {
      const profiles = result.profiles || [];
      const activeId = result.activeProfile?.id;
      
      const profilesWithActive = profiles.map(p => ({
        ...p,
        active: p.id === activeId
      }));
      
      resolve(profilesWithActive);
    });
  });
}

// Update connection status
function updateConnectionStatus(status, text) {
  chrome.runtime.sendMessage({
    action: 'connectionStatus',
    status: status,
    text: text
  }).catch(() => {});
}

// Listen for connection status requests
chrome.runtime.onMessage.addListener((request) => {
  if (request.action === 'getConnectionStatus') {
    return Promise.resolve({
      status: connectionStatus,
      profile: currentProfile
    });
  }
});
