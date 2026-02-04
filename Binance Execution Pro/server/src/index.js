require('dotenv').config();

const express = require('express');
const cors = require('cors');

const { verifyLicenseToken, requireScope } = require('./license');
const { setSession, getSession, clearSession } = require('./store');
const {
  placeFuturesOrder,
  futuresPositionRisk,
  futuresOpenOrders,
  futuresCancelOrder
} = require('./binanceApi');

const PORT = process.env.PORT || 8787;
const CORS_ORIGINS = process.env.CORS_ORIGINS || '*';

const LICENSE_JWT_PUBLIC_KEY = process.env.LICENSE_JWT_PUBLIC_KEY;
const LICENSE_JWT_ISSUER = process.env.LICENSE_JWT_ISSUER;
const LICENSE_JWT_AUDIENCE = process.env.LICENSE_JWT_AUDIENCE;

const app = express();

app.use(express.json({ limit: '1mb' }));
app.use(
  cors({
    origin: CORS_ORIGINS === '*' ? true : CORS_ORIGINS.split(',').map((s) => s.trim()),
    credentials: true
  })
);

app.get('/health', (req, res) => res.json({ ok: true, name: 'binance-execution-proxy' }));

function requirePaidMainnet(req, res, next) {
  try {
    const auth = req.headers.authorization || '';
    const token = auth.startsWith('Bearer ') ? auth.slice('Bearer '.length) : null;
    const { scopes, payload } = verifyLicenseToken(token, {
      publicKey: LICENSE_JWT_PUBLIC_KEY,
      issuer: LICENSE_JWT_ISSUER,
      audience: LICENSE_JWT_AUDIENCE
    });
    requireScope(scopes, 'mainnet');
    req.license = { scopes, payload };
    next();
  } catch (e) {
    res.status(403).json({ error: 'license_required', message: e.message });
  }
}

// Register credentials for server-side execution
// FREE: testnet allowed without license (paper trading)
// PAID: mainnet requires valid license
app.post('/api/session/register', async (req, res) => {
  const { installId, environment, apiKey, apiSecret } = req.body || {};
  if (!installId || !environment || !apiKey || !apiSecret) {
    return res.status(400).json({ error: 'bad_request', message: 'installId, environment, apiKey, apiSecret required' });
  }

  if (environment === 'mainnet') {
    return requirePaidMainnet(req, res, () => {
      setSession(installId, { environment, apiKey, apiSecret });
      res.json({ ok: true });
    });
  }

  // testnet
  setSession(installId, { environment: 'testnet', apiKey, apiSecret });
  res.json({ ok: true });
});

app.post('/api/session/clear', (req, res) => {
  const { installId } = req.body || {};
  if (!installId) return res.status(400).json({ error: 'bad_request', message: 'installId required' });
  clearSession(installId);
  res.json({ ok: true });
});

// Place order (server-side)
app.post('/api/order/futures', async (req, res) => {
  const { installId, params } = req.body || {};
  if (!installId || !params) {
    return res.status(400).json({ error: 'bad_request', message: 'installId and params required' });
  }

  const session = getSession(installId);
  if (!session) return res.status(401).json({ error: 'no_session', message: 'Register session first' });

  if (session.environment === 'mainnet') {
    return requirePaidMainnet(req, res, async () => {
      try {
        const data = await placeFuturesOrder({
          env: 'mainnet',
          apiKey: session.apiKey,
          apiSecret: session.apiSecret,
          params
        });
        res.json({ ok: true, data });
      } catch (e) {
        res.status(400).json({ ok: false, error: 'binance_error', message: e.message, binance: e.binance || null });
      }
    });
  }

  // testnet
  try {
    const data = await placeFuturesOrder({
      env: 'testnet',
      apiKey: session.apiKey,
      apiSecret: session.apiSecret,
      params
    });
    res.json({ ok: true, data });
  } catch (e) {
    res.status(400).json({ ok: false, error: 'binance_error', message: e.message, binance: e.binance || null });
  }
});

// Kill switch (server-side)
app.post('/api/kill-switch/futures', async (req, res) => {
  const { installId } = req.body || {};
  if (!installId) return res.status(400).json({ error: 'bad_request', message: 'installId required' });

  const session = getSession(installId);
  if (!session) return res.status(401).json({ error: 'no_session', message: 'Register session first' });

  const run = async (env) => {
    const positions = await futuresPositionRisk({ env, apiKey: session.apiKey, apiSecret: session.apiSecret });
    const openPositions = positions.filter((p) => parseFloat(p.positionAmt) !== 0);

    const closed = [];
    for (const p of openPositions) {
      const qty = Math.abs(parseFloat(p.positionAmt));
      const side = parseFloat(p.positionAmt) > 0 ? 'SELL' : 'BUY';
      try {
        const order = await placeFuturesOrder({
          env,
          apiKey: session.apiKey,
          apiSecret: session.apiSecret,
          params: { symbol: p.symbol, side, type: 'MARKET', reduceOnly: true, quantity: qty }
        });
        closed.push({ symbol: p.symbol, ok: true, orderId: order.orderId });
      } catch (e) {
        closed.push({ symbol: p.symbol, ok: false, error: e.message });
      }
    }

    const cancelled = [];
    const uniqueSymbols = [...new Set(openPositions.map((p) => p.symbol))];
    for (const symbol of uniqueSymbols) {
      const orders = await futuresOpenOrders({ env, apiKey: session.apiKey, apiSecret: session.apiSecret, symbol });
      for (const o of orders) {
        try {
          await futuresCancelOrder({ env, apiKey: session.apiKey, apiSecret: session.apiSecret, symbol, orderId: o.orderId });
          cancelled.push({ symbol, orderId: o.orderId, ok: true });
        } catch (e) {
          cancelled.push({ symbol, orderId: o.orderId, ok: false, error: e.message });
        }
      }
    }

    return { closed, cancelled };
  };

  const env = session.environment;
  if (env === 'mainnet') {
    return requirePaidMainnet(req, res, async () => {
      try {
        const out = await run('mainnet');
        res.json({ ok: true, ...out });
      } catch (e) {
        res.status(400).json({ ok: false, error: 'kill_switch_failed', message: e.message });
      }
    });
  }

  try {
    const out = await run('testnet');
    res.json({ ok: true, ...out });
  } catch (e) {
    res.status(400).json({ ok: false, error: 'kill_switch_failed', message: e.message });
  }
});

app.listen(PORT, () => {
  console.log(`[binance-execution-proxy] listening on :${PORT}`);
});

