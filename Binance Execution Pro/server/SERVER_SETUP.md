# Binance Execution Pro — Server Proxy Setup (Required for “server-side execution” scope)

This proxy makes the extension **UI-only** while the server performs:
- Binance request signing
- Order execution
- Kill switch execution
- Paid mainnet enforcement via JWT verification

## 1) Install

From `Binance Execution Pro/server/`:
- `npm install`
- `npm start`

## 2) Environment variables

Set these in your environment (PowerShell example):

```powershell
$env:PORT="8787"
$env:CORS_ORIGINS="*"
$env:LICENSE_JWT_PUBLIC_KEY="-----BEGIN PUBLIC KEY-----`nREPLACE_ME`n-----END PUBLIC KEY-----"
$env:LICENSE_JWT_ISSUER="binance-execution-pro"
$env:LICENSE_JWT_AUDIENCE="binance-execution-pro-extension"
```

Notes:
- **RS256** public key verification is required for Mainnet gating (`LICENSE_JWT_PUBLIC_KEY`).
- Testnet is allowed without license (paper trading).

## 3) API Routes

### Health
- `GET /health`

### Register session (store API credentials in memory for execution)
- `POST /api/session/register`

Body:
```json
{ "installId": "...", "environment": "testnet", "apiKey": "...", "apiSecret": "..." }
```

Mainnet requires `Authorization: Bearer <license_jwt>`

### Place futures order
- `POST /api/order/futures`

Body:
```json
{ "installId": "...", "params": { "symbol":"BTCUSDT","side":"BUY","type":"MARKET","quantity":"0.001","reduceOnly":false } }
```

### Kill switch (close positions + cancel open orders)
- `POST /api/kill-switch/futures`

Body:
```json
{ "installId": "..." }
```

## 4) Production note (important)

This server currently uses an **in-memory session store** (`src/store.js`).
For production you must replace it with:
- Redis/DB storage
- encryption-at-rest (KMS recommended)
- rate limiting + IP controls

