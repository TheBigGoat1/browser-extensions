const fetch = (...args) => import('node-fetch').then(({ default: f }) => f(...args));
const { buildQueryString, signParams } = require('./binanceSigner');

const DEFAULT_RECV_WINDOW = 5000;

function baseUrlFor(env, product) {
  // product: 'spot' | 'futures'
  if (env === 'testnet') {
    // Binance Testnet:
    // - Spot: https://testnet.binance.vision
    // - Futures: https://testnet.binancefuture.com
    if (product === 'futures') {
      return 'https://testnet.binancefuture.com';
    }
    return 'https://testnet.binance.vision';
  }
  // mainnet
  if (product === 'spot') return 'https://api.binance.com';
  return 'https://fapi.binance.com';
}

async function binanceTime(env) {
  const url = `${baseUrlFor(env, 'spot')}/api/v3/time`;
  const resp = await fetch(url);
  if (!resp.ok) throw new Error(`time_failed_${resp.status}`);
  return await resp.json();
}

async function placeFuturesOrder({ env, apiKey, apiSecret, params }) {
  const baseUrl = baseUrlFor(env, 'futures');
  const endpoint = '/fapi/v1/order';
  const signedParams = {
    ...params,
    timestamp: Date.now(),
    recvWindow: params.recvWindow || DEFAULT_RECV_WINDOW
  };
  const { queryString, signature } = signParams(signedParams, apiSecret);
  const url = `${baseUrl}${endpoint}?${queryString}&signature=${signature}`;

  const resp = await fetch(url, { method: 'POST', headers: { 'X-MBX-APIKEY': apiKey } });
  const data = await resp.json().catch(() => ({}));
  if (!resp.ok || data.code) {
    const err = new Error(data.msg || `order_failed_${resp.status}`);
    err.binance = data;
    throw err;
  }
  return data;
}

async function futuresPositionRisk({ env, apiKey, apiSecret }) {
  const baseUrl = baseUrlFor(env, 'futures');
  const endpoint = '/fapi/v2/positionRisk';
  const signedParams = { timestamp: Date.now(), recvWindow: DEFAULT_RECV_WINDOW };
  const { queryString, signature } = signParams(signedParams, apiSecret);
  const url = `${baseUrl}${endpoint}?${queryString}&signature=${signature}`;
  const resp = await fetch(url, { headers: { 'X-MBX-APIKEY': apiKey } });
  const data = await resp.json().catch(() => ([]));
  if (!resp.ok || data.code) {
    const err = new Error(data.msg || `positionRisk_failed_${resp.status}`);
    err.binance = data;
    throw err;
  }
  return data;
}

async function futuresOpenOrders({ env, apiKey, apiSecret, symbol }) {
  const baseUrl = baseUrlFor(env, 'futures');
  const endpoint = '/fapi/v1/openOrders';
  const signedParams = { timestamp: Date.now(), recvWindow: DEFAULT_RECV_WINDOW };
  if (symbol) signedParams.symbol = symbol;
  const { queryString, signature } = signParams(signedParams, apiSecret);
  const url = `${baseUrl}${endpoint}?${queryString}&signature=${signature}`;
  const resp = await fetch(url, { headers: { 'X-MBX-APIKEY': apiKey } });
  const data = await resp.json().catch(() => ([]));
  if (!resp.ok || data.code) {
    const err = new Error(data.msg || `openOrders_failed_${resp.status}`);
    err.binance = data;
    throw err;
  }
  return data;
}

async function futuresCancelOrder({ env, apiKey, apiSecret, symbol, orderId }) {
  const baseUrl = baseUrlFor(env, 'futures');
  const endpoint = '/fapi/v1/order';
  const signedParams = { symbol, orderId, timestamp: Date.now(), recvWindow: DEFAULT_RECV_WINDOW };
  const { queryString, signature } = signParams(signedParams, apiSecret);
  const url = `${baseUrl}${endpoint}?${queryString}&signature=${signature}`;
  const resp = await fetch(url, { method: 'DELETE', headers: { 'X-MBX-APIKEY': apiKey } });
  const data = await resp.json().catch(() => ({}));
  if (!resp.ok || data.code) {
    const err = new Error(data.msg || `cancel_failed_${resp.status}`);
    err.binance = data;
    throw err;
  }
  return data;
}

module.exports = {
  binanceTime,
  placeFuturesOrder,
  futuresPositionRisk,
  futuresOpenOrders,
  futuresCancelOrder,
  buildQueryString
};

