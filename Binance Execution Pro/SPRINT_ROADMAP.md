# Binance Execution Pro - Sprint Roadmap

## 📋 Sprint Overview

### Sprint 1: UI & Manifest ✅ COMPLETE
**Status:** ✅ DONE
- Glassmorphic sidepanel with Binance branding
- Two-tab system (Trade + Setup)
- Minimize feature UI
- Input validation
- Help tooltips
- Kill switch UI
- Professional black & yellow design

**What's Missing:**
- Security Vault (AES-256-GCM encryption) - **Needs to be added before Sprint 2**

---

### Sprint 2: HFT Execution Engine 🚧 NEXT
**Objective:** Transform user click into sub-250ms executed order through secure, persistent WebSocket tunnel.

#### 1. The Signing Core (HMAC-SHA256)
**What it does:**
- Signs every Binance API request using SubtleCrypto library
- Sorts parameters alphabetically (Binance standard)
- Appends `recvWindow` to prevent stale orders
- Uses Secret Key from encrypted vault (Sprint 1)

**Technical Details:**
- Algorithm: HMAC-SHA256
- Timestamp: Current time in milliseconds
- Signature: HMAC of query string + timestamp
- Performance: Hardware-accelerated via Web Crypto API

**Files to Create:**
- `binance-signer.js` - HMAC signing logic
- Integration with `background.js` for request signing

---

#### 2. The WebSocket Handshake (Persistent Connection)
**What it does:**
- Establishes persistent WSS (WebSocket Secure) connection to Binance
- Maintains "hot" connection in Service Worker (background.js)
- Sends `session.logon` for authentication
- Enables order execution without re-authenticating every request

**Technical Details:**
- Connection: WSS to `wss://fstream.binance.com/ws` (Futures) or `wss://stream.binance.com/ws` (Spot)
- Auto-reconnect: Exponential backoff on disconnect
- Heartbeat: Keep-alive mechanism
- State management: Connection status tracking

**Files to Create:**
- `binance-websocket.js` - WebSocket connection manager
- `binance-api.js` - API communication layer
- Enhanced `background.js` - Connection lifecycle

---

#### 3. The "ASL" Logic (Advanced Stop Loss)
**What it does:**
- Monitors position profit via WebSocket price feed
- Dynamically adjusts trailing stop loss based on profit levels
- Ensures trade is always protected (atomic operations)

**Logic Flow:**
```
Level 1: Profit > 1% → Update Callback Rate to 2%
Level 2: Profit > 2% → Update Callback Rate to 1.5%
Level 3: Profit > 4% → Update Callback Rate to 1%
```

**Technical Details:**
- Price monitoring: Real-time mark price from WebSocket
- CANCEL_REPLACE: Atomic operation (old SL deleted only when new one confirmed)
- Safety stop: Auto-places -10% stop if none exists (500ms check)
- State tracking: Local position state management

**Files to Create:**
- `trailing-stop.js` - ASL logic engine
- Integration with WebSocket price feed

---

#### 4. Full System Breakdown

**Execution Speed:**
- Target: <150ms from click to Binance confirmation
- Optimization: Pre-signed requests, persistent connection
- Measurement: Timestamp tracking from click to order confirmation

**Validation Logic:**
- Pre-flight checks:
  - Quantity rounded to asset's `lotSize` (e.g., BTC: 0.001, SOL: 0.01)
  - Price rounded to asset's `tickSize` (e.g., BTC: 0.1, SOL: 0.01)
- Symbol validation: Check against Binance exchange info
- Notional validation: Minimum order size per pair

**Hedge Mode Logic:**
- Detect account position mode (One-way vs Hedge)
- Format payload accordingly
- Handle dual-side positions in Hedge mode

**Error Shield:**
- `-1021` Error: Timestamp outside recvWindow
  - Auto-sync extension time with Binance server time
  - Retry with corrected timestamp
- `-1003` Error: Too many requests
  - Implement rate limiting
  - Queue requests with backoff
- `FILTER_FAILURE`: Validation errors
  - Parse error message
  - Show user-friendly error
  - Auto-correct if possible (e.g., tick size)

**Files to Create:**
- `binance-validator.js` - Pre-flight validation
- `error-handler.js` - Error parsing and recovery
- `time-sync.js` - Binance server time synchronization

---

#### 5. Visual Alignment (Minimize Feature Finalization)
**What it does:**
- Finalizes minimize feature CSS
- Creates "Action Bar" mode (60px high bar)
- Global hotkeys for quick execution

**Technical Details:**
- Minimize state: Hides all inputs, shows only essential controls
- Action bar: Fixed bottom bar with BUY/SELL buttons
- Hotkeys:
  - `Ctrl+B` (or `Cmd+B` on Mac) → Execute BUY
  - `Ctrl+S` (or `Cmd+S` on Mac) → Execute SELL
- Keyboard shortcuts: Defined in `manifest.json` commands

**Files to Update:**
- `styles.css` - Action bar styling
- `sidepanel.js` - Minimize state management
- `background.js` - Hotkey handlers
- `manifest.json` - Commands configuration

---

## 🔄 Sprint Alignment Check

### What We Have (Sprint 1):
✅ UI Framework
✅ Tab System
✅ Input Fields
✅ Minimize UI Structure
✅ Basic Validation

### What's Missing Before Sprint 2:
⚠️ **Security Vault (AES-256-GCM)** - This should be completed FIRST
- Master password setup
- API key encryption
- Secure storage
- Key retrieval for signing

### What Sprint 2 Will Build:
1. ✅ HMAC-SHA256 Signing Core
2. ✅ WebSocket Persistent Connection
3. ✅ Advanced Stop Loss Logic
4. ✅ Validation & Error Handling
5. ✅ Minimize Feature Finalization
6. ✅ Global Hotkeys

---

## 📝 Recommended Development Order

### Phase 1: Complete Security Vault (Before Sprint 2)
**Why:** Sprint 2 needs encrypted API keys to sign requests
- Create `security.js` with AES-256-GCM encryption
- Implement PBKDF2 key derivation (1M rounds)
- Secure storage in `chrome.storage.local`
- Master password management

### Phase 2: Sprint 2 - Execution Engine
**After Security Vault is complete:**
1. Build HMAC-SHA256 signing
2. Establish WebSocket connection
3. Implement ASL logic
4. Add validation & error handling
5. Finalize minimize feature
6. Add global hotkeys

---

## 🎯 Sprint 2 Deliverables

At the end of Sprint 2, you will have:

1. **Functional Trading Terminal**
   - Click BUY/SELL → Order executes in <250ms
   - Real-time connection status
   - Position tracking

2. **Advanced Stop Loss**
   - Dynamic trailing stops
   - Multi-level profit protection
   - Safety stop fallback

3. **Professional Error Handling**
   - Auto-correction for common errors
   - Time synchronization
   - Rate limiting

4. **Optimized UX**
   - Minimize mode for focused trading
   - Global hotkeys for power users
   - Clean, distraction-free interface

---

## ⚠️ Critical Dependency

**Sprint 2 REQUIRES Sprint 1 Security Vault to be complete.**

Without the Security Vault:
- ❌ Cannot retrieve API keys for signing
- ❌ Cannot authenticate WebSocket connection
- ❌ Cannot execute orders

**Recommendation:** Complete Security Vault first, then proceed to Sprint 2.

---

## 🚀 Next Steps

1. **Complete Security Vault** (AES-256-GCM encryption)
2. **Build HMAC-SHA256 Signing Core**
3. **Establish WebSocket Connection**
4. **Implement ASL Logic**
5. **Add Validation & Error Handling**
6. **Finalize Minimize Feature**
7. **Add Global Hotkeys**

---

**Ready to proceed with Security Vault, then Sprint 2 Execution Engine?**
