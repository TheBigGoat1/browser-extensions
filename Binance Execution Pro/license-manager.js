// Binance Execution Pro - License Manager (Gatekeeper)
// Free = Testnet (paper). Paid = Mainnet (real).
//
// SUBSCRIPTION GATE: Set USE_REAL_SUBSCRIPTION_CHECK = true only when you have
// connected real payment API (Stripe, Paddle, etc.). Until then, mainnet is
// allowed so there is no obstruction; UI still shows "Subscribe to use Real Trading".
//
// Security model:
// - Users can always modify unpacked extensions, so we DO NOT rely on UI locks.
// - We enforce mainnet access through a server-issued, short-lived JWT.
// - The extension verifies JWT expiry locally and can (optionally) verify signature if you provide a public key.
//
// Backend endpoints (you implement):
// - POST /api/license/issue     { installId } -> { token, expiresAt, plan, scopes }
// - GET  /api/license/status   ?installId=... -> { active, plan, scopes }
// - Payment Checkout URL (hosted) expects installId (client_reference_id or query param)

const LICENSE_STORAGE_KEY = 'binance_license_token_v1';
const INSTALL_ID_KEY = 'binance_install_id_v1';

// --- SUBSCRIPTION GATE: Set to true only when real payment API is connected ---
// When false: mainnet is allowed (no obstruction). UI still shows "Subscribe" for clarity.
const USE_REAL_SUBSCRIPTION_CHECK = false;

// Update this to your backend (must be in manifest host_permissions)
const LICENSE_BACKEND_BASE_URL = 'https://your-license-server.example';

// Payment processor: single place to switch (Stripe, Paddle, etc.)
const PAYMENT_PROVIDER = 'stripe'; // 'stripe' | 'paddle' | 'custom'
const STRIPE_CHECKOUT_URL = 'https://your-stripe-checkout.example/checkout';
const PADDLE_CHECKOUT_URL = 'https://your-paddle-checkout.example/checkout';

// Execution proxy (server-side execution). This is where orders are sent when enabled.
const EXECUTION_PROXY_BASE_URL = 'http://localhost:8787';

// Scope names
const LICENSE_SCOPES = {
  MAINNET: 'mainnet',
  MULTI_PROFILE: 'multi_profile'
};

function randomInstallId() {
  // Prefer crypto.randomUUID when available
  if (typeof crypto !== 'undefined' && crypto.randomUUID) return crypto.randomUUID();
  const arr = new Uint8Array(16);
  crypto.getRandomValues(arr);
  return [...arr].map(b => b.toString(16).padStart(2, '0')).join('');
}

async function getInstallId() {
  const result = await chrome.storage.local.get([INSTALL_ID_KEY]);
  let id = result[INSTALL_ID_KEY];
  if (!id) {
    id = randomInstallId();
    await chrome.storage.local.set({ [INSTALL_ID_KEY]: id });
  }
  return id;
}

function decodeJwtNoVerify(token) {
  // token = header.payload.signature
  const parts = (token || '').split('.');
  if (parts.length < 2) throw new Error('Invalid token format');
  const payloadB64 = parts[1].replace(/-/g, '+').replace(/_/g, '/');
  const padded = payloadB64 + '='.repeat((4 - (payloadB64.length % 4)) % 4);
  const json = atob(padded);
  return JSON.parse(json);
}

function isJwtExpired(token, skewSeconds = 30) {
  try {
    const payload = decodeJwtNoVerify(token);
    if (!payload || typeof payload.exp !== 'number') return true;
    const now = Math.floor(Date.now() / 1000);
    return now >= (payload.exp - skewSeconds);
  } catch {
    return true;
  }
}

async function getStoredLicenseToken() {
  const result = await chrome.storage.local.get([LICENSE_STORAGE_KEY]);
  return result[LICENSE_STORAGE_KEY] || null;
}

async function storeLicenseToken(token) {
  await chrome.storage.local.set({ [LICENSE_STORAGE_KEY]: token });
}

async function clearLicenseToken() {
  await chrome.storage.local.remove([LICENSE_STORAGE_KEY]);
}

async function fetchLicenseTokenFromBackend() {
  const installId = await getInstallId();
  const url = `${LICENSE_BACKEND_BASE_URL}/api/license/issue`;
  const resp = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ installId })
  });
  if (!resp.ok) {
    const text = await resp.text().catch(() => '');
    throw new Error(`License issue failed (${resp.status}): ${text}`);
  }
  const data = await resp.json();
  if (!data || !data.token) throw new Error('License response missing token');
  await storeLicenseToken(data.token);
  return data.token;
}

async function refreshLicenseTokenIfNeeded() {
  const token = await getStoredLicenseToken();
  if (token && !isJwtExpired(token)) return token;
  return await fetchLicenseTokenFromBackend();
}

async function getLicenseState() {
  const token = await getStoredLicenseToken();
  if (!token) {
    return { active: false, token: null, scopes: [], plan: 'free' };
  }
  if (isJwtExpired(token)) {
    return { active: false, token, scopes: [], plan: 'free', expired: true };
  }
  const payload = decodeJwtNoVerify(token);
  const scopes = Array.isArray(payload.scopes) ? payload.scopes : (Array.isArray(payload.scope) ? payload.scope : []);
  return {
    active: true,
    token,
    plan: payload.plan || 'pro',
    scopes
  };
}

async function isMainnetAllowed() {
  if (!USE_REAL_SUBSCRIPTION_CHECK) {
    return true; // No obstruction until real subscription API is connected
  }
  const state = await getLicenseState();
  return state.active && state.scopes.includes(LICENSE_SCOPES.MAINNET);
}

async function requireMainnetAllowed() {
  if (!USE_REAL_SUBSCRIPTION_CHECK) {
    return; // No gate until real payment API is connected
  }
  const ok = await isMainnetAllowed();
  if (!ok) {
    const installId = await getInstallId();
    throw new Error(`Paid subscription required for Real Trading. (installId: ${installId})`);
  }
}

/** Payment processor adapter: easy to switch Stripe / Paddle / custom */
function getCheckoutUrl() {
  const base = PAYMENT_PROVIDER === 'paddle' ? PADDLE_CHECKOUT_URL : STRIPE_CHECKOUT_URL;
  return base;
}

async function openUpgradeCheckout() {
  const installId = await getInstallId();
  const base = getCheckoutUrl();
  const url = `${base}?installId=${encodeURIComponent(installId)}`;
  if (chrome.tabs && chrome.tabs.create) {
    chrome.tabs.create({ url });
  } else {
    window.open(url, '_blank');
  }
}

// Exports
if (typeof window !== 'undefined') {
  window.licenseManager = {
    USE_REAL_SUBSCRIPTION_CHECK,
    PAYMENT_PROVIDER,
    LICENSE_BACKEND_BASE_URL,
    STRIPE_CHECKOUT_URL,
    EXECUTION_PROXY_BASE_URL,
    LICENSE_SCOPES,
    getInstallId,
    getStoredLicenseToken,
    refreshLicenseTokenIfNeeded,
    getLicenseState,
    isMainnetAllowed,
    requireMainnetAllowed,
    getCheckoutUrl,
    openUpgradeCheckout,
    clearLicenseToken
  };
}

if (typeof self !== 'undefined' && typeof importScripts !== 'undefined') {
  self.licenseManager = {
    USE_REAL_SUBSCRIPTION_CHECK,
    PAYMENT_PROVIDER,
    LICENSE_BACKEND_BASE_URL,
    STRIPE_CHECKOUT_URL,
    EXECUTION_PROXY_BASE_URL,
    LICENSE_SCOPES,
    getInstallId,
    getStoredLicenseToken,
    refreshLicenseTokenIfNeeded,
    getLicenseState,
    isMainnetAllowed,
    requireMainnetAllowed,
    getCheckoutUrl,
    openUpgradeCheckout,
    clearLicenseToken
  };
}

