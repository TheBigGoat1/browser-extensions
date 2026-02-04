// Binance Execution Pro - Sidepanel Orchestrator
// Handles UI interactions, tab management, and user input validation

let currentTab = 'trade';
let isMinimized = false;
let currentMode = 'futures';
let currentMargin = 'isolated';
let currentHedge = 'hedge';
let currentOrderType = 'market';
let currentProfile = null;

const MAX_PROFILES = 5;
const DRAFT_API_KEY = 'binance_draft_api_key';
const DRAFT_API_SECRET = 'binance_draft_api_secret';

// Initialize
document.addEventListener('DOMContentLoaded', () => {
  initializeApp();
  setupEventListeners();
  loadSettings();
  updateLicenseUI().catch(() => {});
});

// Initialize app
async function initializeApp() {
  // Set initial status to disconnected
  updateStatus('disconnected', 'Disconnected');
  
  // Check if we have an active connection
  try {
    const response = await chrome.runtime.sendMessage({ action: 'getConnectionStatus' });
    if (response && response.status === 'connected') {
      updateStatus('connected', 'Connected');
    } else {
      // Show connection banner if not connected
      showConnectionMessage('Not connected. Set up API keys in Setup tab to connect.', 'warning');
    }
  } catch (error) {
    console.warn('[Sidepanel] Could not check connection status:', error);
    showConnectionMessage('Not connected. Set up API keys in Setup tab to connect.', 'warning');
  }
  
  // Set default tab
  switchTab('trade');
  
  // Initialize help tooltips
  initializeHelpTooltips();
  
  // Load saved state
  loadSavedState();
  
  // Check vault status
  await checkVaultStatus();
}

// Check vault status (single implementation)
async function checkVaultStatus() {
  if (typeof binanceSecurity === 'undefined') {
    setTimeout(checkVaultStatus, 500);
    return;
  }
  try {
    const isInitialized = await binanceSecurity.isVaultInitialized();
    if (isInitialized) {
      const masterPassword = sessionStorage.getItem('masterPassword');
      if (masterPassword) {
        document.getElementById('vaultSection').style.display = 'none';
        document.getElementById('profilesSection').style.display = 'block';
        await loadProfiles();
        await restoreApiDraft();
      }
    }
  } catch (error) {
    console.error('[Sidepanel] Vault status check error:', error);
  }
}

// Setup event listeners
function setupEventListeners() {
  // Listen for connection status updates from background
  chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === 'connectionStatus') {
      updateStatus(request.status, request.text || 'Connected');
    }
    return false; // No async response needed
  });

  // Request current connection status on load
  chrome.runtime.sendMessage({ action: 'getConnectionStatus' })
    .then(response => {
      if (response && response.status) {
        const statusText = response.status === 'connected' ? 'Connected' : 
                          response.status === 'error' ? 'Connection Error' : 'Disconnected';
        updateStatus(response.status, statusText);
      }
    })
    .catch(() => {
      // Background not ready yet, keep default disconnected state
    });

  // Tab switching
  document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const tab = btn.dataset.tab;
      switchTab(tab);
    });
  });

  // Minimize toggle
  document.getElementById('minimizeBtn').addEventListener('click', toggleMinimize);

  // Audit log buttons
  document.getElementById('clearLogBtn')?.addEventListener('click', clearAuditLog);
  document.getElementById('refreshLogBtn')?.addEventListener('click', loadAuditLog);

  // Mode toggles
  document.getElementById('modeSpot').addEventListener('click', () => setMode('spot'));
  document.getElementById('modeFutures').addEventListener('click', () => setMode('futures'));
  document.getElementById('marginIsolated').addEventListener('click', () => setMargin('isolated'));
  document.getElementById('marginCross').addEventListener('click', () => setMargin('cross'));
  document.getElementById('hedgeOneWay').addEventListener('click', () => setHedge('one-way'));
  document.getElementById('hedgeMode').addEventListener('click', () => setHedge('hedge'));
  document.getElementById('orderTypeMarket').addEventListener('click', () => setOrderType('market'));
  document.getElementById('orderTypeLimit').addEventListener('click', () => setOrderType('limit'));

  // Trading inputs
  document.getElementById('symbolInput').addEventListener('input', debounce(validateSymbolInput, 400));
  document.getElementById('symbolInput').addEventListener('blur', () => validateSymbolInput({ target: document.getElementById('symbolInput') }));
  document.getElementById('notionalInput').addEventListener('input', validateNotional);
  document.getElementById('leverageInput').addEventListener('input', updateLeverageAndLiquidation);
  document.getElementById('leverageInput').addEventListener('blur', () => validateLeverageInput({ target: document.getElementById('leverageInput') }));
  document.getElementById('stopLossInput').addEventListener('input', validateStopLoss);
  // Callback and trailing: enforce 0.1% increments
  ['callbackInput', 'trail1Callback', 'trail2Callback', 'trail3Callback'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.addEventListener('input', validateCallbackInput);
    if (el) el.addEventListener('blur', validateCallbackInput);
  });

  // API draft: persist when user clicks out so copy-paste doesn't lose values
  document.getElementById('apiKey').addEventListener('blur', saveApiDraft);
  document.getElementById('apiSecret').addEventListener('blur', saveApiDraft);

  document.getElementById('btnCloseTrade').addEventListener('click', () => closeAllPositions());

  // Execution buttons
  document.getElementById('btnBuy').addEventListener('click', () => executeOrder('BUY'));
  document.getElementById('btnSell').addEventListener('click', () => executeOrder('SELL'));
  document.getElementById('minBtnBuy').addEventListener('click', () => executeOrder('BUY'));
  document.getElementById('minBtnSell').addEventListener('click', () => executeOrder('SELL'));
  document.getElementById('killSwitch').addEventListener('click', closeAllPositions);

  // Setup tab
  document.getElementById('disclaimerAccepted').addEventListener('change', handleDisclaimerAccept);
  document.getElementById('setupVaultBtn').addEventListener('click', setupVault);
  document.getElementById('addProfileBtn').addEventListener('click', showProfileForm);
  document.getElementById('cancelProfileBtn').addEventListener('click', hideProfileForm);
  document.getElementById('saveProfileBtn').addEventListener('click', saveProfile);
  document.getElementById('envTestnet').addEventListener('click', () => setEnvironment('testnet'));
  document.getElementById('envMainnet').addEventListener('click', () => setEnvironment('mainnet'));
  document.getElementById('payNowBtn')?.addEventListener('click', async () => {
    if (typeof licenseManager === 'undefined') {
      alert('License manager not loaded.');
      return;
    }
    await licenseManager.openUpgradeCheckout();
  });

  // Password validation
  document.getElementById('masterPassword').addEventListener('input', validatePassword);
  document.getElementById('confirmPassword').addEventListener('input', validatePasswordMatch);
}

// Switch tabs
function switchTab(tab) {
  currentTab = tab;
  
  // Update tab buttons
  document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.tab === tab);
  });
  
  // Update panels
  document.querySelectorAll('.tab-panel').forEach(panel => {
    panel.classList.toggle('active', panel.id === `panel${tab.charAt(0).toUpperCase() + tab.slice(1)}`);
  });
}

// Toggle minimize
function toggleMinimize() {
  isMinimized = !isMinimized;
  
  const tradePanel = document.getElementById('panelTrade');
  const minimizedView = document.getElementById('minimizedView');
  const normalView = tradePanel.querySelector('.mode-section, .trading-inputs, .execution-section');
  
  if (isMinimized) {
    // Hide normal view, show minimized
    if (normalView) {
      Array.from(tradePanel.children).forEach(child => {
        if (!child.id || child.id !== 'minimizedView') {
          child.style.display = 'none';
        }
      });
    }
    minimizedView.style.display = 'block';
    
    // Update minimized values
    updateMinimizedView();
  } else {
    // Show normal view, hide minimized
    minimizedView.style.display = 'none';
    Array.from(tradePanel.children).forEach(child => {
      child.style.display = '';
    });
  }
}

// Update minimized view
function updateMinimizedView() {
  const symbol = document.getElementById('symbolInput').value || '--';
  const notional = document.getElementById('notionalInput').value || '0.00';
  
  document.getElementById('minSymbol').textContent = symbol;
  document.getElementById('minQty').value = notional;
  // PNL would come from real-time data
  document.getElementById('minPnl').textContent = '$0.00';
}

// Set trading mode
function setMode(mode) {
  currentMode = mode;
  
  document.getElementById('modeSpot').classList.toggle('active', mode === 'spot');
  document.getElementById('modeFutures').classList.toggle('active', mode === 'futures');
  
  // Show/hide futures options
  const futuresOptions = document.getElementById('futuresOptions');
  const hedgeOption = document.getElementById('hedgeModeOption');
  const leverageGroup = document.getElementById('leverageGroup');
  
  if (mode === 'futures') {
    futuresOptions.style.display = 'block';
    hedgeOption.style.display = 'block';
    leverageGroup.style.display = 'block';
  } else {
    futuresOptions.style.display = 'none';
    hedgeOption.style.display = 'none';
    leverageGroup.style.display = 'none';
  }
  
  saveSettings();
}

// Set margin mode
function setMargin(margin) {
  currentMargin = margin;
  document.getElementById('marginIsolated').classList.toggle('active', margin === 'isolated');
  document.getElementById('marginCross').classList.toggle('active', margin === 'cross');
  saveSettings();
}

// Set hedge mode
function setHedge(hedge) {
  currentHedge = hedge;
  document.getElementById('hedgeOneWay').classList.toggle('active', hedge === 'one-way');
  document.getElementById('hedgeMode').classList.toggle('active', hedge === 'hedge');
  saveSettings();
}

// Order type: Market vs Limit
function setOrderType(type) {
  currentOrderType = type;
  document.getElementById('orderTypeMarket').classList.toggle('active', type === 'market');
  document.getElementById('orderTypeLimit').classList.toggle('active', type === 'limit');
  const limitPriceGroup = document.getElementById('limitPriceGroup');
  if (limitPriceGroup) limitPriceGroup.style.display = type === 'limit' ? 'block' : 'none';
  const subtitle = type === 'market' ? 'Market Order' : 'Limit Order';
  const buySub = document.getElementById('btnBuySubtitle');
  const sellSub = document.getElementById('btnSellSubtitle');
  if (buySub) buySub.textContent = subtitle;
  if (sellSub) sellSub.textContent = subtitle;
  saveSettings();
}

function debounce(fn, ms) {
  let t;
  return function (...args) {
    clearTimeout(t);
    t = setTimeout(() => fn.apply(this, args), ms);
  };
}

// Input validation
let symbolValidationTimeout;
function validateSymbolInput(e) {
  const input = e && e.target ? e.target : document.getElementById('symbolInput');
  if (!input) return;
  const value = input.value.toUpperCase().replace(/[^A-Z0-9]/g, '');
  input.value = value;
  
  if (value.length < 4) {
    hideInputHint('symbolHint');
    input.classList.remove('error');
    return;
  }
  if (!value.endsWith('USDT')) {
    showInputHint('symbolHint', 'Format: SYMBOLUSDT (e.g., BTCUSDT)');
    input.classList.add('error');
    return;
  }
  // Async check against exchange
  clearTimeout(symbolValidationTimeout);
  symbolValidationTimeout = setTimeout(async () => {
    if (typeof binanceValidator === 'undefined') {
      showInputHint('symbolHint', `Format: ${value}`);
      input.classList.remove('error');
      return;
    }
    const env = currentProfile ? (await chrome.storage.local.get(['profileEnv'])).profileEnv : 'testnet';
    const result = await binanceValidator.isValidTradingPair(value, env || 'testnet', currentMode);
    const hintEl = document.getElementById('symbolHint');
    if (result.valid) {
      showInputHint('symbolHint', `Valid: ${value}`);
      input.classList.remove('error');
    } else {
      showInputHint('symbolHint', result.error || 'Invalid pair');
      input.classList.add('error');
    }
  }, 300);
}

function validateNotional(e) {
  const input = e.target;
  const value = parseFloat(input.value);
  
  if (isNaN(value) || value <= 0) {
    input.classList.add('error');
    showInputHint('notionalHint', 'Minimum: $5.00 for most pairs');
  } else {
    input.classList.remove('error');
    showInputHint('notionalHint', `Amount: $${value.toFixed(2)}`);
  }
}

function updateLeverageAndLiquidation(e) {
  const input = e.target;
  let value = parseInt(input.value, 10);
  if (isNaN(value) || value < 1) value = 1;
  if (value > 125) value = 125;
  input.value = value;
  const liqPct = (100 / value).toFixed(2);
  const liqEl = document.getElementById('liquidationValue');
  if (liqEl) liqEl.textContent = `${liqPct}%`;
  validateLeverageInput(e);
}

function validateLeverageInput(e) {
  const input = e && e.target ? e.target : document.getElementById('leverageInput');
  if (!input) return;
  const value = parseInt(input.value, 10);
  const symbol = document.getElementById('symbolInput').value.toUpperCase();
  const hintEl = document.getElementById('leverageHint');
  if (isNaN(value) || value < 1) {
    if (hintEl) hintEl.textContent = '1–125';
    input.classList.remove('error');
    return;
  }
  if (currentMode !== 'futures' || !symbol || symbol.length < 4) {
    input.classList.remove('error');
    if (hintEl) hintEl.textContent = '1x–125x';
    return;
  }
  if (typeof binanceValidator !== 'undefined' && binanceValidator.getMaxLeverageForSymbol) {
    binanceValidator.getMaxLeverageForSymbol(symbol, 'testnet').then(maxLev => {
      if (value > maxLev) {
        input.classList.add('error');
        if (hintEl) hintEl.textContent = `Max for ${symbol}: ${maxLev}x`;
      } else {
        input.classList.remove('error');
        if (hintEl) hintEl.textContent = '';
      }
    }).catch(() => {
      input.classList.remove('error');
      if (hintEl) hintEl.textContent = '';
    });
  }
}

function validateLeverage(e) {
  updateLeverageAndLiquidation(e);
}

function validateStopLoss(e) {
  const input = e.target;
  const value = parseFloat(input.value);
  
  if (isNaN(value) || value < 0.1) {
    input.value = '2.0';
    showInputHint('stopLossInput', 'Default: 2.0%');
  }
}

function validateCallbackInput(e) {
  const input = e && e.target ? e.target : document.getElementById('callbackInput');
  if (!input) return;
  const raw = parseFloat(input.value);
  if (isNaN(raw)) return;
  if (typeof binanceValidator === 'undefined') {
    const v = Math.round(raw * 10) / 10;
    input.value = v < 0.1 ? '0.1' : v.toFixed(1);
    return;
  }
  const result = binanceValidator.validateCallbackRate(raw);
  if (result.valid) {
    input.value = result.rounded !== undefined ? result.rounded.toFixed(1) : raw.toFixed(1);
    input.classList.remove('error');
  } else {
    if (result.rounded !== undefined) {
      input.value = result.rounded.toFixed(1);
      input.classList.add('error');
      setTimeout(() => input.classList.remove('error'), 800);
    }
    if (result.error) showInputHint('callbackHint', result.error);
  }
}

function validateCallback(e) {
  validateCallbackInput(e);
}

// Help tooltips
function initializeHelpTooltips() {
  const helpIcons = document.querySelectorAll('.help-icon');
  const tooltip = document.getElementById('helpTooltip');
  const tooltipContent = document.getElementById('tooltipContent');
  
  const helpData = {
    symbol: '<strong>Symbol</strong><br>Trading pair identifier (e.g., BTCUSDT). Must match a valid Binance trading pair format.',
    notional: '<strong>Notional Amount</strong><br>Total order value in quote currency. Minimum varies by trading pair. For BTCUSDT, minimum is $5.00.',
    leverage: '<strong>Leverage</strong><br>Position size multiplier (1–125). Max depends on symbol. Liquidation % = 100 ÷ leverage.',
    stoploss: '<strong>Stop Loss</strong><br>Initiation: % from entry. Levels move SL at profit triggers. Trade is protected unless you leave SL empty.',
    callback: '<strong>Callback Rate</strong><br>Trailing stop distance. Binance accepts only 0.1% increments (0.1, 0.2, 0.3…). 0.15% will error.',
    limitprice: '<strong>Limit Price</strong><br>Price at which your limit order will execute. Only used when Order Type is Limit.',
    takeprofit: '<strong>Take Profit</strong><br>Target price to close the position. Optional; 0 = no TP. Use Close Trade to close manually.',
    masterpass: '<strong>Master Password</strong><br>Your encryption key used to secure API credentials. This password is never stored and must be entered each session to decrypt your API keys.',
    apikey: '<strong>API Key</strong><br>Public identifier from Binance API Management. This key is safe to share and used for authentication.',
    apisecret: '<strong>API Secret</strong><br>Private authentication key. Never share this key. It is encrypted using your master password and stored securely.'
  };
  
  helpIcons.forEach(icon => {
    let tooltipTimeout;
    
    icon.addEventListener('mouseenter', (e) => {
      clearTimeout(tooltipTimeout);
      
      const helpType = icon.dataset.help;
      if (helpData[helpType]) {
        tooltipContent.innerHTML = helpData[helpType];
        tooltip.style.display = 'block';
        
        // Small delay to ensure tooltip is rendered before positioning
        requestAnimationFrame(() => {
          positionTooltip(e.target, tooltip);
        });
      }
    });
    
    icon.addEventListener('mouseleave', () => {
      tooltipTimeout = setTimeout(() => {
        tooltip.style.display = 'none';
        tooltip.style.visibility = 'hidden';
        tooltip.style.opacity = '0';
      }, 150);
    });
    
    // Keep tooltip visible when hovering over it
    tooltip.addEventListener('mouseenter', () => {
      clearTimeout(tooltipTimeout);
    });
    
    tooltip.addEventListener('mouseleave', () => {
      tooltip.style.display = 'none';
      tooltip.style.visibility = 'hidden';
      tooltip.style.opacity = '0';
    });
  });
}

function positionTooltip(target, tooltip) {
  // Ensure tooltip is visible to get dimensions
  tooltip.style.visibility = 'hidden';
  tooltip.style.display = 'block';
  tooltip.style.opacity = '0';
  
  // Force reflow to get accurate dimensions
  void tooltip.offsetWidth;
  
  // Get dimensions after rendering
  const rect = target.getBoundingClientRect();
  const tooltipRect = tooltip.getBoundingClientRect();
  const viewportWidth = window.innerWidth;
  const viewportHeight = window.innerHeight;
  const padding = 20; // Safe padding from screen edges
  const gap = 12; // Gap between icon and tooltip
  
  // Calculate icon center
  const iconCenterY = rect.top + rect.height / 2;
  
  // Determine best horizontal position
  let left;
  const spaceRight = viewportWidth - rect.right - gap;
  const spaceLeft = rect.left - gap;
  
  if (tooltipRect.width <= spaceRight) {
    // Position to the right (preferred)
    left = rect.right + gap;
  } else if (tooltipRect.width <= spaceLeft) {
    // Position to the left
    left = rect.left - tooltipRect.width - gap;
  } else {
    // Center horizontally if tooltip is too wide
    left = Math.max(padding, (viewportWidth - tooltipRect.width) / 2);
  }
  
  // Ensure tooltip stays within viewport horizontally
  left = Math.max(padding, Math.min(left, viewportWidth - tooltipRect.width - padding));
  
  // Determine best vertical position (center relative to icon)
  let top = iconCenterY - tooltipRect.height / 2;
  
  // Adjust if tooltip goes off-screen at top
  if (top < padding) {
    top = padding;
  }
  
  // Adjust if tooltip goes off-screen at bottom
  if (top + tooltipRect.height > viewportHeight - padding) {
    top = viewportHeight - tooltipRect.height - padding;
  }
  
  // If still off-screen, try alternative positions
  if (top < padding || top + tooltipRect.height > viewportHeight - padding) {
    // Try above icon
    if (rect.top - tooltipRect.height - gap >= padding) {
      top = rect.top - tooltipRect.height - gap;
    } 
    // Try below icon
    else if (rect.bottom + gap + tooltipRect.height <= viewportHeight - padding) {
      top = rect.bottom + gap;
    }
    // Last resort: center vertically in viewport
    else {
      top = Math.max(padding, (viewportHeight - tooltipRect.height) / 2);
    }
  }
  
  // Final bounds check to ensure it's always visible
  top = Math.max(padding, Math.min(top, viewportHeight - tooltipRect.height - padding));
  left = Math.max(padding, Math.min(left, viewportWidth - tooltipRect.width - padding));
  
  // Apply positioning
  tooltip.style.left = `${left}px`;
  tooltip.style.top = `${top}px`;
  tooltip.style.visibility = 'visible';
  tooltip.style.opacity = '1';
}

// Show/hide input hints
function showInputHint(id, text) {
  const hint = document.getElementById(id);
  if (hint) {
    hint.textContent = text;
    hint.style.display = 'block';
  }
}

function hideInputHint(id) {
  const hint = document.getElementById(id);
  if (hint) {
    hint.style.display = 'none';
  }
}

// Execute order
function executeOrder(side) {
  // Check connection status first
  const statusDot = document.getElementById('statusDot');
  if (!statusDot || !statusDot.classList.contains('connected')) {
    showConnectionMessage('You must be connected to Binance to execute trades. Please set up API keys in Setup tab.', 'error');
    // Switch to setup tab after 2 seconds
    setTimeout(() => {
      if (confirm('You need to connect first. Go to Setup tab to configure API keys?')) {
        switchTab('setup');
      }
    }, 500);
    return;
  }
  
  const symbol = document.getElementById('symbolInput').value;
  const notional = document.getElementById('notionalInput').value;
  
  if (!symbol || !notional) {
    alert('Please enter symbol and notional amount');
    return;
  }
  
  // Validate inputs
  if (!validateOrderInputs()) {
    return;
  }
  
  const leverageEl = document.getElementById('leverageInput');
  const stopLossEl = document.getElementById('stopLossInput');
  const tpPriceEl = document.getElementById('tpTargetPrice');
  const stopLoss = {
    initiation: stopLossEl ? parseFloat(stopLossEl.value) || 0 : 0,
    level1: { trigger: getNum('sl1Trigger'), replace: getNum('sl1Replace') },
    level2: { trigger: getNum('sl2Trigger'), replace: getNum('sl2Replace') }
  };
  const trailingStop = {
    level1: { profit_pct: getNum('trail1Profit'), callback_rate_pct: getNum('trail1Callback') },
    level2: { profit_pct: getNum('trail2Profit'), callback_rate_pct: getNum('trail2Callback') },
    level3: { profit_pct: getNum('trail3Profit'), callback_rate_pct: getNum('trail3Callback') }
  };
  function getNum(id) {
    const el = document.getElementById(id);
    return el ? parseFloat(el.value) || 0 : 0;
  }

  chrome.runtime.sendMessage({
    action: 'executeOrder',
    side: side,
    symbol: symbol,
    notional: parseFloat(notional),
    mode: currentMode,
    margin: currentMargin,
    hedge: currentHedge,
    orderType: currentOrderType,
    limitPrice: document.getElementById('limitPriceInput') ? parseFloat(document.getElementById('limitPriceInput').value) || 0 : 0,
    leverage: leverageEl ? (parseInt(leverageEl.value, 10) || 1) : 1,
    stopLoss,
    trailingStop,
    takeProfitPrice: tpPriceEl ? parseFloat(tpPriceEl.value) || 0 : 0
  }).then(response => {
    if (response.success) {
      updateStatus('connected', 'Order Executed');
      clearErrorStates();
    } else {
      handleOrderError(response);
    }
  }).catch(error => {
    console.error('Order execution error:', error);
    alert('Failed to execute order. Check connection.');
    clearErrorStates();
  });
}

// Validate order inputs
function validateOrderInputs() {
  const symbol = document.getElementById('symbolInput').value;
  const notional = document.getElementById('notionalInput').value;
  const symbolEl = document.getElementById('symbolInput');
  if (!symbol || symbol.length < 4) {
    alert('Please enter a valid symbol');
    return false;
  }
  if (symbolEl && symbolEl.classList.contains('error')) {
    alert('Symbol is not a valid trading pair. Check the hint.');
    return false;
  }
  if (!notional || parseFloat(notional) < 5) {
    alert('Notional amount must be at least $5.00');
    return false;
  }
  return true;
}

function clearErrorStates() {
  document.querySelectorAll('.input-field.error').forEach(el => el.classList.remove('error'));
}

function handleOrderError(response) {
  const msg = response?.error?.msg || response?.message || response?.error || 'Order failed';
  alert(typeof msg === 'string' ? msg : JSON.stringify(msg));
}

// Close all positions
function closeAllPositions() {
  if (!confirm('Are you sure you want to close ALL positions? This action cannot be undone.')) {
    return;
  }
  
  chrome.runtime.sendMessage({
    action: 'closeAllPositions'
  }).then(response => {
    if (response.success) {
      updateStatus('connected', 'All Positions Closed');
    } else {
      alert(`Failed to close positions: ${response.error}`);
    }
  });
}

// Setup tab handlers
async function handleDisclaimerAccept(e) {
  const accepted = e.target.checked;
  document.getElementById('setupVaultBtn').disabled = !accepted;
  
  if (accepted) {
    // Check if vault is already initialized
    if (typeof binanceSecurity !== 'undefined') {
      const isInitialized = await binanceSecurity.isVaultInitialized();
      if (isInitialized) {
        // Vault exists, show password prompt
        showPasswordPrompt();
      } else {
        // New vault, show setup
        document.getElementById('vaultSection').style.display = 'block';
      }
    } else {
      document.getElementById('vaultSection').style.display = 'block';
    }
  }
}

// Show password prompt for existing vault
async function showPasswordPrompt() {
  const password = prompt('Enter your master password to unlock the vault:');
  if (!password) {
    document.getElementById('disclaimerAccepted').checked = false;
    return;
  }
  
  try {
    if (typeof binanceSecurity === 'undefined') {
      alert('Security module not loaded');
      return;
    }
    
    const isValid = await binanceSecurity.verifyMasterPassword(password);
    if (isValid) {
      // Store in session
      sessionStorage.setItem('masterPassword', password);
      
      // Show profiles section
      document.getElementById('vaultSection').style.display = 'none';
      document.getElementById('profilesSection').style.display = 'block';
      
      // Load profiles
      await loadProfiles();
      
      updateStatus('ready', 'Vault Unlocked');
    } else {
      alert('Invalid master password');
      document.getElementById('disclaimerAccepted').checked = false;
    }
  } catch (error) {
    console.error('[Sidepanel] Password verification error:', error);
    alert('Failed to verify password');
    document.getElementById('disclaimerAccepted').checked = false;
  }
}

function validatePassword(e) {
  const password = e.target.value;
  const strengthEl = document.getElementById('passwordStrength');
  
  // Use security module validation if available
  let strength = 'weak';
  if (typeof binanceSecurity !== 'undefined') {
    const isValid = binanceSecurity.validatePasswordStrength(password);
    if (isValid) {
      if (password.length >= 12 && /[A-Z]/.test(password) && /[0-9]/.test(password) && /[^A-Za-z0-9]/.test(password)) {
        strength = 'strong';
      } else {
        strength = 'medium';
      }
    }
  } else {
    // Fallback validation
    if (password.length >= 12 && /[A-Z]/.test(password) && /[0-9]/.test(password) && /[^A-Za-z0-9]/.test(password)) {
      strength = 'strong';
    } else if (password.length >= 8) {
      strength = 'medium';
    }
  }
  
  strengthEl.className = `password-strength ${strength}`;
  validatePasswordMatch();
}

function validatePasswordMatch() {
  const password = document.getElementById('masterPassword').value;
  const confirm = document.getElementById('confirmPassword').value;
  const btn = document.getElementById('setupVaultBtn');
  
  if (password && confirm && password === confirm && password.length >= 8) {
    btn.disabled = false;
  } else {
    btn.disabled = true;
  }
}

async function setupVault() {
  const password = document.getElementById('masterPassword').value;
  const confirm = document.getElementById('confirmPassword').value;
  
  if (password !== confirm) {
    alert('Passwords do not match');
    return;
  }
  
  if (!validatePasswordStrength(password)) {
    alert('Password must be at least 8 characters and meet strength requirements');
    return;
  }
  
  try {
    // Check if security module is loaded
    if (typeof binanceSecurity === 'undefined') {
      alert('Security module not loaded. Please refresh the extension.');
      return;
    }
    
    // Initialize vault
    await binanceSecurity.initializeVault(password);
    
    // Show success and proceed to profiles
    document.getElementById('vaultSection').style.display = 'none';
    document.getElementById('profilesSection').style.display = 'block';
    
    // Store master password in session (memory only, never persisted)
    sessionStorage.setItem('masterPassword', password);
    
    // Load profiles
    await loadProfiles();
    
    updateStatus('ready', 'Vault Initialized');
  } catch (error) {
    console.error('[Sidepanel] Vault setup error:', error);
    alert(`Failed to setup vault: ${error.message}`);
  }
}

async function showProfileForm() {
  if (typeof binanceSecurity !== 'undefined') {
    const profiles = await binanceSecurity.getProfiles();
    if (profiles.length >= MAX_PROFILES) {
      alert(`Maximum ${MAX_PROFILES} profiles. Remove one to add another.`);
      return;
    }
  }
  document.getElementById('profileForm').style.display = 'block';
}

function hideProfileForm() {
  document.getElementById('profileForm').style.display = 'none';
  // Reset form
  document.getElementById('profileName').value = '';
  document.getElementById('apiKey').value = '';
  document.getElementById('apiSecret').value = '';
}

async function updateLicenseUI() {
  const envMainnetBtn = document.getElementById('envMainnet');
  const paymentSection = document.getElementById('paymentSection');
  if (!envMainnetBtn) return;

  let allowed = false;
  let useRealCheck = false;
  try {
    if (typeof licenseManager !== 'undefined') {
      useRealCheck = licenseManager.USE_REAL_SUBSCRIPTION_CHECK === true;
      await licenseManager.refreshLicenseTokenIfNeeded().catch(() => null);
      allowed = await licenseManager.isMainnetAllowed();
    }
  } catch {
    allowed = false;
  }

  if (useRealCheck && !allowed) {
    envMainnetBtn.classList.add('locked');
    envMainnetBtn.setAttribute('title', 'Subscribe to use Real Trading (paid). Click Pay Now to upgrade.');
    if (paymentSection) paymentSection.style.display = 'block';
  } else {
    envMainnetBtn.classList.remove('locked');
    envMainnetBtn.setAttribute('title', useRealCheck ? 'Real (Mainnet)' : 'Real Trading — subscribe when payment API is connected');
    if (paymentSection) paymentSection.style.display = 'none';
  }
}

function setEnvironment(env) {
  // Gatekeeper: block UI switch to mainnet unless licensed
  if (env === 'mainnet') {
    if (typeof licenseManager === 'undefined') {
      alert('License system not loaded. Mainnet is locked.');
      return;
    }
    licenseManager.isMainnetAllowed().then((ok) => {
      if (!ok) {
        alert('Paid subscription required for Real Trading (Mainnet). Click Pay Now to upgrade.');
        const paymentSection = document.getElementById('paymentSection');
        if (paymentSection) paymentSection.style.display = 'block';
        return;
      }
      document.getElementById('envTestnet').classList.toggle('active', false);
      document.getElementById('envMainnet').classList.toggle('active', true);
      chrome.storage.local.set({ profileEnv: 'mainnet' });
    });
    return;
  }

  document.getElementById('envTestnet').classList.toggle('active', env === 'testnet');
  document.getElementById('envMainnet').classList.toggle('active', env === 'mainnet');
  chrome.storage.local.set({ profileEnv: 'testnet' });
}

async function saveProfile() {
  const name = document.getElementById('profileName').value.trim();
  const env = document.querySelector('[data-env].active')?.dataset.env || 'testnet';
  const apiKey = document.getElementById('apiKey').value.trim();
  const apiSecret = document.getElementById('apiSecret').value.trim();
  
  if (!name || !apiKey || !apiSecret) {
    alert('Please fill all fields');
    return;
  }
  
  // Validate API key format (Binance API keys are typically 64 characters)
  if (apiKey.length < 20 || apiSecret.length < 20) {
    if (!confirm('API key or secret seems too short. Are you sure this is correct?')) {
      return;
    }
  }
  
  try {
    // Get master password from session
    const masterPassword = sessionStorage.getItem('masterPassword');
    if (!masterPassword) {
      alert('Session expired. Please set up vault again.');
      return;
    }
    
    // Check if security module is loaded
    if (typeof binanceSecurity === 'undefined') {
      alert('Security module not loaded. Please refresh the extension.');
      return;
    }
    
    // Save encrypted profile
    const profile = await binanceSecurity.saveProfile({
      name: name,
      environment: env,
      apiKey: apiKey,
      apiSecret: apiSecret
    }, masterPassword);
    
    // Clear form
    hideProfileForm();
    
    // Reload profiles
    await loadProfiles();
    
    // If this is the first profile, set it as active
    const profiles = await binanceSecurity.getProfiles();
    if (profiles.length === 1) {
      await binanceSecurity.setActiveProfile(profile.id);
      currentProfile = profile;
    }
    
    document.getElementById('apiKey').value = '';
    document.getElementById('apiSecret').value = '';
    const storage = chrome.storage.session || chrome.storage.local;
    await storage.remove([DRAFT_API_KEY, DRAFT_API_SECRET]);
    
    updateStatus('ready', 'Profile Saved');
  } catch (error) {
    console.error('[Sidepanel] Save profile error:', error);
    alert(`Failed to save profile: ${error.message}`);
  }
}

async function loadProfiles() {
  try {
    if (typeof binanceSecurity === 'undefined') {
      console.error('[Sidepanel] Security module not loaded');
      return;
    }
    
    // Get all profiles
    const profiles = await binanceSecurity.getProfiles();
    const activeProfileId = await binanceSecurity.getActiveProfileId();
    
    const selector = document.getElementById('profileSelector');
    
    if (profiles.length === 0) {
      selector.innerHTML = '<div class="history-empty">No profiles yet. Click "Add Profile" to create one.</div>';
      return;
    }
    
    // Render profiles
    selector.innerHTML = profiles.map(profile => {
      const isActive = profile.id === activeProfileId;
      return `
        <div class="profile-item ${isActive ? 'active' : ''}" data-id="${profile.id}">
          <div class="profile-info">
            <span class="profile-name">${profile.name}</span>
            <span class="profile-env">${profile.environment}</span>
          </div>
          <div class="profile-actions">
            <button class="btn-profile-action" onclick="activateProfile('${profile.id}')" title="Activate">
              ${isActive ? '✓' : '→'}
            </button>
            <button class="btn-profile-action" onclick="deleteProfileAction('${profile.id}')" title="Delete">×</button>
          </div>
        </div>
      `;
    }).join('');
    
    // Add click handlers
    document.querySelectorAll('.profile-item').forEach(item => {
      item.addEventListener('click', (e) => {
        if (!e.target.closest('.profile-actions')) {
          const profileId = item.dataset.id;
          activateProfile(profileId);
        }
      });
    });
  } catch (error) {
    console.error('[Sidepanel] Load profiles error:', error);
  }
}

// Activate profile
window.activateProfile = async function(profileId) {
  try {
    // Show connecting status
    updateStatus('warning', 'Connecting...');
    showConnectionMessage('Connecting to Binance...', 'info');
    
    if (typeof binanceSecurity === 'undefined') {
      const error = 'Security module not loaded. Please reload the extension.';
      updateStatus('error', 'Module Error');
      showConnectionMessage(error, 'error');
      alert(error);
      return;
    }
    
    await binanceSecurity.setActiveProfile(profileId);
    currentProfile = { id: profileId };
    
    // Reload profiles to update UI
    await loadProfiles();
    
    // Connect WebSocket with this profile
    const masterPassword = sessionStorage.getItem('masterPassword');
    if (!masterPassword) {
      const error = 'Vault is locked. Please unlock your vault first.';
      updateStatus('error', 'Vault Locked');
      showConnectionMessage(error, 'error');
      alert(error);
      return;
    }
    
    let credentials;
    try {
      credentials = await binanceSecurity.getDecryptedCredentials(profileId, masterPassword);
    } catch (error) {
      const errorMsg = `Failed to decrypt credentials: ${error.message}`;
      updateStatus('error', 'Decryption Failed');
      showConnectionMessage(errorMsg, 'error');
      alert(errorMsg);
      return;
    }
    
    if (!credentials.apiKey || !credentials.apiSecret) {
      const error = 'Profile is missing API credentials. Please check your profile settings.';
      updateStatus('error', 'Invalid Profile');
      showConnectionMessage(error, 'error');
      alert(error);
      return;
    }
    
    // Send to background to connect
    try {
      const response = await chrome.runtime.sendMessage({
        action: 'connectWebSocket',
        profile: {
          id: profileId,
          name: credentials.name,
          environment: credentials.environment,
          apiKey: credentials.apiKey,
          apiSecret: credentials.apiSecret
        }
      });
      
      if (response && response.success) {
        updateStatus('connected', 'Connected');
        showConnectionMessage(`Connected to Binance ${credentials.environment.toUpperCase()}`, 'success');
        // Clear message after 3 seconds
        setTimeout(() => hideConnectionMessage(), 3000);
      } else {
        const errorMsg = response?.error || 'Connection failed. Check your API keys and network.';
        updateStatus('error', 'Connection Failed');
        showConnectionMessage(errorMsg, 'error');
        alert(`Connection failed: ${errorMsg}`);
      }
    } catch (error) {
      console.error('[Sidepanel] Connection error:', error);
      const errorMsg = `Connection error: ${error.message || 'Unknown error'}`;
      updateStatus('error', 'Connection Error');
      showConnectionMessage(errorMsg, 'error');
      alert(errorMsg);
    }
  } catch (error) {
    console.error('[Sidepanel] Activate profile error:', error);
    const errorMsg = `Failed to activate profile: ${error.message || 'Unknown error'}`;
    updateStatus('error', 'Activation Failed');
    showConnectionMessage(errorMsg, 'error');
    alert(errorMsg);
  }
};

// Delete profile
window.deleteProfileAction = async function(profileId) {
  if (!confirm('Are you sure you want to delete this profile? This action cannot be undone.')) {
    return;
  }
  
  try {
    if (typeof binanceSecurity === 'undefined') {
      alert('Security module not loaded');
      return;
    }
    
    await binanceSecurity.deleteProfile(profileId);
    await loadProfiles();
    
    updateStatus('ready', 'Profile Deleted');
  } catch (error) {
    console.error('[Sidepanel] Delete profile error:', error);
    alert(`Failed to delete profile: ${error.message}`);
  }
};

// Update status
function updateStatus(status, text) {
  const dot = document.getElementById('statusDot');
  const statusText = document.getElementById('statusText');
  
  if (!dot || !statusText) {
    console.warn('[Sidepanel] Status elements not found');
    return;
  }
  
  // Remove all status classes
  dot.classList.remove('connected', 'disconnected', 'warning', 'ready', 'error');
  
  // Add the appropriate status class
  if (status === 'connected') {
    dot.classList.add('connected');
    statusText.textContent = text || 'Connected';
    hideConnectionMessage(); // Hide banner when connected
  } else if (status === 'disconnected') {
    dot.classList.add('disconnected');
    statusText.textContent = text || 'Disconnected';
    showConnectionMessage('Not connected. Set up API keys in Setup tab to connect.', 'warning');
  } else if (status === 'warning' || status === 'error') {
    dot.classList.add('warning');
    statusText.textContent = text || 'Error';
  } else {
    // For 'ready' or other states, use default styling
    dot.classList.add('disconnected');
    statusText.textContent = text || 'Ready';
  }
  
  // Log status change for debugging
  console.log(`[Sidepanel] Status updated: ${status} - ${text}`);
}

// Show connection message banner
function showConnectionMessage(message, type = 'info') {
  const banner = document.getElementById('connectionBanner');
  const title = document.getElementById('connectionBannerTitle');
  const messageEl = document.getElementById('connectionBannerMessage');
  const icon = document.getElementById('connectionBannerIcon');
  const actionBtn = document.getElementById('connectionBannerAction');
  
  if (!banner || !title || !messageEl) return;
  
  // Set message
  messageEl.textContent = message;
  
  // Set type-based styling
  banner.className = `connection-banner connection-banner-${type}`;
  
  // Set icon and title based on type
  if (type === 'success') {
    icon.textContent = '✅';
    title.textContent = 'Connected';
    actionBtn.style.display = 'none';
  } else if (type === 'error') {
    icon.textContent = '❌';
    title.textContent = 'Connection Failed';
    actionBtn.textContent = 'Check Setup';
    actionBtn.style.display = 'block';
  } else if (type === 'warning') {
    icon.textContent = '⚠️';
    title.textContent = 'Not Connected';
    actionBtn.textContent = 'Go to Setup';
    actionBtn.style.display = 'block';
  } else {
    icon.textContent = 'ℹ️';
    title.textContent = 'Status';
    actionBtn.style.display = 'none';
  }
  
  banner.style.display = 'block';
}

// Hide connection message banner
function hideConnectionMessage() {
  const banner = document.getElementById('connectionBanner');
  if (banner) {
    banner.style.display = 'none';
  }
}

// Load settings (defaults: Isolated, Hedge, Futures, Leverage 1, Notional 25)
function loadSettings() {
  chrome.storage.local.get(['mode', 'margin', 'hedge', 'orderType', 'minimized'], (result) => {
    setMode(result.mode || 'futures');
    setMargin(result.margin || 'isolated');
    setHedge(result.hedge || 'hedge');
    setOrderType(result.orderType || 'market');
    if (result.minimized) toggleMinimize();
  });
}

// Save settings (and last notional/leverage for restore)
function saveSettings() {
  const notionalInput = document.getElementById('notionalInput');
  const leverageInput = document.getElementById('leverageInput');
  const payload = {
    mode: currentMode,
    margin: currentMargin,
    hedge: currentHedge,
    orderType: currentOrderType,
    minimized: isMinimized
  };
  if (notionalInput && notionalInput.value) payload.lastNotional = parseFloat(notionalInput.value);
  if (leverageInput && leverageInput.value) payload.lastLeverage = parseInt(leverageInput.value, 10);
  chrome.storage.local.set(payload);
}

// Load audit log
async function loadAuditLog() {
  if (typeof auditLog === 'undefined') {
    return;
  }

  const container = document.getElementById('auditLogContainer');
  if (!container) {
    return;
  }

  const logs = auditLog.getAuditLog();
  
  if (logs.length === 0) {
    container.innerHTML = '<div class="audit-log-empty">No log entries yet. Trading activity will appear here.</div>';
    return;
  }

  // Display logs in reverse order (newest first)
  container.innerHTML = logs.slice().reverse().map(entry => {
    const date = new Date(entry.timestamp);
    const timeStr = date.toLocaleTimeString();
    const typeClass = entry.type === 'error' ? 'error' : entry.type === 'request' ? 'request' : entry.type === 'response' ? 'response' : 'info';
    
    return `
      <div class="audit-log-entry ${typeClass}">
        <div class="audit-log-header">
          <span class="audit-log-time">${timeStr}</span>
          <span class="audit-log-type">${entry.type.toUpperCase()}</span>
        </div>
        <div class="audit-log-data">
          <pre>${JSON.stringify(entry.data, null, 2)}</pre>
        </div>
      </div>
    `;
  }).join('');
}

// Clear audit log
async function clearAuditLog() {
  if (!confirm('Are you sure you want to clear the audit log?')) {
    return;
  }

  if (typeof auditLog !== 'undefined') {
    await auditLog.clearAuditLog();
    loadAuditLog();
  }
}

// Load saved state (defaults: Isolated, Hedge, Futures, Leverage 1, Notional 25)
function loadSavedState() {
  chrome.storage.local.get(['lastSymbol', 'lastNotional', 'lastLeverage', 'mode', 'margin', 'hedge', 'orderType'], (result) => {
    const symbolInput = document.getElementById('symbolInput');
    const notionalInput = document.getElementById('notionalInput');
    const leverageInput = document.getElementById('leverageInput');
    if (symbolInput && result.lastSymbol) symbolInput.value = result.lastSymbol;
    if (notionalInput) notionalInput.value = result.lastNotional != null ? String(result.lastNotional) : '25';
    if (leverageInput) {
      leverageInput.value = result.lastLeverage != null ? String(result.lastLeverage) : '1';
      const liqVal = document.getElementById('liquidationValue');
      if (liqVal) liqVal.textContent = (100 / (parseInt(leverageInput.value, 10) || 1)).toFixed(2) + '%';
    }
  });
}

// API draft: persist when user clicks out (so copy-paste doesn't lose values)
async function saveApiDraft() {
  const apiKey = document.getElementById('apiKey');
  const apiSecret = document.getElementById('apiSecret');
  if (!apiKey || !apiSecret) return;
  try {
    const storage = chrome.storage.session || chrome.storage.local;
    await storage.set({
      [DRAFT_API_KEY]: apiKey.value || '',
      [DRAFT_API_SECRET]: apiSecret.value || ''
    });
  } catch (e) {
    console.warn('[Sidepanel] Could not save API draft:', e);
  }
}

async function restoreApiDraft() {
  const apiKey = document.getElementById('apiKey');
  const apiSecret = document.getElementById('apiSecret');
  if (!apiKey || !apiSecret) return;
  try {
    const storage = chrome.storage.session || chrome.storage.local;
    const result = await storage.get([DRAFT_API_KEY, DRAFT_API_SECRET]);
    if (result[DRAFT_API_KEY] && !apiKey.value) apiKey.value = result[DRAFT_API_KEY];
    if (result[DRAFT_API_SECRET] && !apiSecret.value) apiSecret.value = result[DRAFT_API_SECRET];
  } catch (e) {
    console.warn('[Sidepanel] Could not restore API draft:', e);
  }
}
