# Sprint 2: HFT Execution Engine - Complete Explanation

## 🎯 What is Sprint 2?

**Sprint 2 is the "Central Nervous System"** - the bridge between your encrypted API keys and Binance's matching engine. It transforms a user click into a sub-250ms executed order.

---

## 📊 Sprint Alignment Check

### ✅ What We Have (Sprint 1):
- **UI Framework**: Glassmorphic sidepanel ✅
- **Tab System**: Trade + Setup tabs ✅
- **Input Fields**: Symbol, Notional, Leverage, etc. ✅
- **Minimize UI**: Structure in place ✅
- **Basic Validation**: Input formatting ✅

### ⚠️ What's Missing (Critical):
- **Security Vault**: AES-256-GCM encryption ❌
  - **Why Critical**: Sprint 2 needs encrypted API keys to sign requests
  - **Status**: Must be completed BEFORE Sprint 2

### 🚧 What Sprint 2 Will Build:
1. **HMAC-SHA256 Signing Core** - Sign all Binance requests
2. **WebSocket Persistent Connection** - Sub-250ms execution
3. **Advanced Stop Loss Logic** - Dynamic trailing stops
4. **Validation & Error Handling** - Production-grade error recovery
5. **Minimize Feature Finalization** - Action bar mode
6. **Global Hotkeys** - Ctrl+B (Buy), Ctrl+S (Sell)

---

## 🔍 Detailed Sprint 2 Breakdown

### 1. The Signing Core (HMAC-SHA256)

**What It Does:**
Every Binance API request must be signed. Instead of doing this on every click (slow), we:
- Pre-sign requests using hardware-accelerated SubtleCrypto
- Sort parameters alphabetically (Binance requirement)
- Append `recvWindow` to prevent stale orders
- Use Secret Key from encrypted vault

**Technical Flow:**
```
User Clicks BUY
  ↓
Get encrypted API Secret from Vault
  ↓
Decrypt using Master Password (in memory only)
  ↓
Build query string: symbol=BTCUSDT&side=BUY&type=MARKET&...
  ↓
Sort alphabetically + append timestamp + recvWindow
  ↓
Sign with HMAC-SHA256 using Secret Key
  ↓
Send signed request via WebSocket
```

**Performance:**
- Hardware-accelerated via Web Crypto API
- Pre-computed signatures (if possible)
- <10ms signing time

**Files to Create:**
- `binance-signer.js` - HMAC signing logic
- Integration with `security.js` (vault) to get decrypted keys

---

### 2. The WebSocket Handshake (Persistent Connection)

**Why WebSocket Instead of REST?**
- **REST (HTTP)**: ~200-500ms per request (TCP handshake + TLS + HTTP)
- **WebSocket**: ~50-150ms per message (connection already established)
- **Result**: 3-5x faster execution

**How It Works:**
1. **Connection**: Service Worker opens WSS connection on extension load
2. **Authentication**: Send `session.logon` with signed request
3. **Keep-Alive**: Connection stays "hot" in background
4. **Order Execution**: Send orders directly without re-authenticating
5. **Auto-Reconnect**: Exponential backoff if connection drops

**Connection Flow:**
```
Extension Loads
  ↓
Background.js opens WebSocket to Binance
  ↓
Send session.logon (authenticated)
  ↓
Connection Status: CONNECTED ✅
  ↓
User Clicks BUY
  ↓
Send ORDER_PLACE via WebSocket (already authenticated)
  ↓
Receive order confirmation in <150ms
```

**Files to Create:**
- `binance-websocket.js` - Connection manager
- `binance-api.js` - API communication layer
- Enhanced `background.js` - Lifecycle management

---

### 3. The "ASL" Logic (Advanced Stop Loss)

**What Makes It "Advanced"?**
Most trading bots use fixed trailing stops. Ours dynamically tightens as profit increases.

**Logic Flow:**
```
Order Executed → Hard Stop Placed at -2%
  ↓
WebSocket Price Feed Monitors Mark Price
  ↓
Level 1: Profit reaches 1% → CANCEL_REPLACE → Callback Rate = 2%
  ↓
Level 2: Profit reaches 2% → CANCEL_REPLACE → Callback Rate = 1.5%
  ↓
Level 3: Profit reaches 4% → CANCEL_REPLACE → Callback Rate = 1%
  ↓
Safety Check: Every 500ms, verify stop loss exists
  ↓
If no stop found → Auto-place Safety Stop at -10%
```

**Atomicity (Critical):**
- Old stop is deleted ONLY when new stop is confirmed
- Prevents gap where trade is unprotected
- Uses Binance's CANCEL_REPLACE command

**Files to Create:**
- `trailing-stop.js` - ASL logic engine
- `position-tracker.js` - Real-time position monitoring
- Integration with WebSocket price feed

---

### 4. Full System Breakdown

#### A. Execution Speed (<150ms Target)

**Optimization Techniques:**
1. **Pre-signed Requests**: Sign before user clicks (if possible)
2. **Persistent Connection**: No handshake delay
3. **Minimal Payload**: Only essential parameters
4. **Direct WebSocket**: No HTTP overhead

**Measurement:**
```javascript
const startTime = Date.now();
// Execute order
const endTime = Date.now();
const latency = endTime - startTime; // Target: <150ms
```

#### B. Validation Logic (Pre-flight Checks)

**Tick Size Rounding:**
```javascript
// Example: BTCUSDT has tickSize = 0.1
// User enters: 50000.123
// Auto-rounds to: 50000.1 ✅
```

**Lot Size Rounding:**
```javascript
// Example: BTCUSDT has lotSize = 0.001
// User enters: 0.12345
// Auto-rounds to: 0.123 ✅
```

**Files to Create:**
- `binance-validator.js` - Pre-flight validation
- `exchange-info.js` - Binance symbol metadata cache

#### C. Hedge Mode Logic

**Detection:**
- Query account position mode via API
- Format payload based on mode:
  - **One-way**: Standard order
  - **Hedge**: Include `positionSide` parameter (LONG/SHORT)

**Files to Update:**
- `binance-api.js` - Mode detection
- Order formatting logic

#### D. Error Shield

**Common Errors & Solutions:**

| Error Code | Meaning | Solution |
|------------|---------|----------|
| `-1021` | Timestamp outside recvWindow | Auto-sync with Binance server time |
| `-1003` | Too many requests | Rate limiting + request queue |
| `-1111` | Invalid symbol | Validate symbol before sending |
| `-2010` | New order rejected | Parse rejection reason, show user |
| `FILTER_FAILURE` | Validation error | Auto-correct (tick size, lot size) |

**Files to Create:**
- `error-handler.js` - Error parsing and recovery
- `time-sync.js` - Binance server time synchronization
- `rate-limiter.js` - Request throttling

---

### 5. Visual Alignment (Minimize Feature Finalization)

**Current State:**
- Minimize button exists ✅
- UI structure in place ✅
- Needs: Final styling and action bar

**Action Bar Mode:**
- 60px high fixed bar at bottom
- Green (BUY) and Red (SELL) buttons
- Minimal, distraction-free
- Perfect for "in the zone" trading

**Global Hotkeys:**
- `Ctrl+B` (Windows) / `Cmd+B` (Mac) → Execute BUY
- `Ctrl+S` (Windows) / `Cmd+S` (Mac) → Execute SELL
- Defined in `manifest.json` commands
- Handled in `background.js`

**Files to Update:**
- `styles.css` - Action bar styling
- `sidepanel.js` - Minimize state management
- `background.js` - Hotkey handlers
- `manifest.json` - Commands configuration

---

## 🔄 Development Order (Critical)

### ⚠️ MUST DO FIRST: Security Vault
**Why:** Sprint 2 cannot function without encrypted API keys

**What to Build:**
1. `security.js` - AES-256-GCM encryption module
2. PBKDF2 key derivation (1M rounds)
3. Secure storage in `chrome.storage.local`
4. Master password management
5. Key retrieval for signing

**Estimated Time:** 1-2 hours

### THEN: Sprint 2 Execution Engine
**After Security Vault is complete:**
1. HMAC-SHA256 signing (1 hour)
2. WebSocket connection (2 hours)
3. ASL logic (2 hours)
4. Validation & error handling (1 hour)
5. Minimize finalization (30 min)
6. Global hotkeys (30 min)

**Total Estimated Time:** ~7-8 hours

---

## ✅ Sprint 2 Alignment Confirmation

### Your Roadmap Says:
- ✅ HMAC-SHA256 Signing Core
- ✅ WebSocket Persistent Connection
- ✅ Advanced Stop Loss (ASL) Logic
- ✅ Validation & Error Handling
- ✅ Minimize Feature Finalization
- ✅ Global Hotkeys

### What We'll Build:
- ✅ **Exactly as specified** - Full alignment confirmed

### Critical Dependency:
- ⚠️ **Security Vault must be completed FIRST**
  - Without it, we cannot retrieve API keys
  - Cannot sign requests
  - Cannot authenticate WebSocket

---

## 🎯 Sprint 2 Deliverables

At the end of Sprint 2, you will have:

1. **Functional Trading Terminal**
   - Click BUY/SELL → Order executes in <250ms
   - Real-time WebSocket connection
   - Position tracking

2. **Advanced Stop Loss**
   - Dynamic trailing stops (Levels 1-3)
   - Safety stop fallback
   - Atomic operations

3. **Production-Grade Error Handling**
   - Auto-correction for common errors
   - Time synchronization
   - Rate limiting

4. **Optimized UX**
   - Minimize mode (action bar)
   - Global hotkeys
   - Clean, focused interface

---

## 🚀 Recommended Next Steps

### Option 1: Complete Security Vault First (Recommended)
1. Build `security.js` with AES-256-GCM
2. Implement PBKDF2 key derivation
3. Secure storage system
4. Then proceed to Sprint 2

### Option 2: Build Sprint 2 with Mock Keys (For Testing)
1. Use test API keys (hardcoded for testing)
2. Build Sprint 2 execution engine
3. Add Security Vault later
4. Replace mock keys with encrypted keys

**Which approach do you prefer?**

---

## 📝 Summary

**Sprint 2 is fully aligned with your roadmap.** It will build:
- ✅ HMAC-SHA256 signing
- ✅ WebSocket persistent connection
- ✅ Advanced Stop Loss logic
- ✅ Validation & error handling
- ✅ Minimize feature finalization
- ✅ Global hotkeys

**Critical:** Security Vault must be completed first, OR we use mock keys for testing.

**Ready to proceed?** Let me know if you want to:
1. Complete Security Vault first (recommended)
2. Build Sprint 2 with mock keys for testing
3. Build both simultaneously
