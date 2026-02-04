# Binance Execution Pro — TESTING (Production-Grade)

This document is the **full QA + verification procedure** for Binance Execution Pro, mapped to the **full requirement scope** (Vault, Execution Engine, ASL, Kill Switch, Audit Log, Error Handling, Hotkeys, UX/Minimize).

> **Safety:** Start with **Testnet / small sizes**. Never enable withdrawals on API keys.  
> **Scope Note:** This build runs purely as a Chrome Extension (MV3). There is **no external Node proxy** in this phase.

---

## 0) Requirement Scope (What must be true)

### A) Architecture (Triad / Nervous System)
- **The Vault** (`security.js`): AES-256-GCM + PBKDF2 (1M rounds). Secrets stored encrypted; decrypted only in-session.
- **The Commander** (`background.js`): Execution core. WebSocket trading tunnel, time sync, signing, validation, safety.
- **The Deck** (`sidepanel.js`): UX engine. Tab switching, minimize/focus mode, error UI, session audit log viewer.

### B) Pillars (Production Requirements)
1. **Order Execution**
   - Prefer **WSS trading** over REST for live order placement (sub-250ms goal).
   - **Time Sync** heartbeat to reduce `-1021`.
   - **Pre-flight rounding / validation** using exchange filters.
2. **ASL (Advanced Stop Loss)**
   - Phase 1: Entry + initial hard stop.
   - Phase 2: Trailing levels 1/2/3 using **atomic cancel/replace**.
   - Safety stop fallback if stop is missing.
3. **Operational Safety**
   - Kill switch: close all positions (reduce-only market), cancel open orders, stop trailing logic, verify.
4. **Audit Logging**
   - Session log with last **100** request/response/error entries (sanitized).
5. **Error Handling UX**
   - `-1021`: time sync + retry.
   - `-2019`: insufficient margin; input highlights + user guidance.
   - `-1003`: rate limit; cooldown timer + disabled controls.
6. **Hotkeys**
   - `Ctrl+Shift+B` buy, `Ctrl+Shift+S` sell (see `manifest.json`).

---

## 1) Test Prerequisites

### 1.0 Server-side Execution Proxy (required for “server executes trades” scope)
This build includes a Node proxy at `Binance Execution Pro/server/`.

Steps:
1. Open terminal in `Binance Execution Pro/server/`
2. Run:
   - `npm install`
   - `npm start`
3. Confirm health:
   - `GET http://localhost:8787/health` returns `{ ok: true }`

Pass criteria:
- Proxy is running and reachable from the extension

### 1.1 Chrome Setup
1. Open `chrome://extensions/`
2. Enable **Developer mode**
3. Click **Load unpacked**
4. Select folder: `Binance Execution Pro/`

Expected:
- Extension loads with no manifest errors
- Side panel opens from extension icon

### 1.2 Binance Safety Requirements
- Use **Testnet first**.
- Create API keys with **only the minimum permissions** needed.
- **Never enable withdrawals**.
- If using Futures testing, ensure Futures permissions are enabled for the test account.

### 1.3 Where to Watch Logs
- **Service Worker logs**: `chrome://extensions/` → Binance Execution Pro → **Service worker** → Inspect
- **UI logs**: Right click Sidepanel → Inspect

---

## 2) Smoke Test (Loads + UI Baseline)

### 2.1 UI Opens + Tabs Work
Steps:
1. Open side panel
2. Click tabs: **Trade** ↔ **Setup**

Pass criteria:
- No blank screens
- No JS exceptions in sidepanel DevTools console
- Tooltips appear fully within viewport (no off-screen clipping)

### 2.2 Minimize / Focus Mode
Steps:
1. On Trade tab, click **Minimize**
2. Confirm compact view shows essential controls
3. Click again to restore full view

Pass criteria:
- Layout transitions cleanly
- Buttons remain clickable
- No layout overflow or “stuck minimized” state

---

## 3) Vault (Security) Testing

### 3.1 Disclaimer Gate
Steps:
1. Go to Setup tab
2. Scroll disclaimer (if scroll enforcement exists)
3. Check “I agree”

Pass criteria:
- Vault section becomes available

### 3.2 Initialize Vault
Steps:
1. Enter master password + confirm
2. Click **Setup Vault**

Pass criteria:
- Vault initializes successfully
- Profiles section becomes visible
- Master password is stored only in session (not persisted)

### 3.3 Unlock Existing Vault (Reload test)
Steps:
1. Close side panel
2. Reload extension (toggle off/on) or refresh `chrome://extensions/`
3. Open side panel → Setup tab → accept disclaimer
4. Enter master password when prompted

Pass criteria:
- Vault unlocks
- Profiles load
- Wrong password is rejected

### 3.4 Storage Sanity (No secrets in plaintext)
Steps:
1. `chrome://extensions/` → Inspect service worker console
2. Run:
   - `chrome.storage.local.get(null).then(console.log)`

Pass criteria:
- API secrets are stored encrypted (expect `encryptedSecret`, `salt`, `iv`)
- No plaintext API secret visible

---

## 4) Profiles + Connection (Testnet)

### 4.1 Create a Testnet Profile
Steps:
1. Setup tab → Add Profile
2. Environment: **Testnet**
3. Enter API key/secret
4. Save

Pass criteria:
- Profile appears in list
- Selecting profile triggers connection attempt
- Status indicator shows connected/ready state (or clear error)

### 4.2 Activate Profile + WebSocket Connection
Steps:
1. Click a profile to activate
2. Watch service worker console

Pass criteria:
- Trading WebSocket connects
- Stream WebSocket connects (if configured)
- Time sync heartbeat starts (log every 60s or visible offset updates)

---

## 5) Order Execution (Primary Pillar)

### 5.1 Market Order (Small Size)
Steps:
1. Trade tab
2. Symbol: a valid futures symbol (e.g., `BTCUSDT`)
3. Notional: small (e.g., `5` / minimum allowed)
4. Click **BUY** or **SELL**

Expected:
- Extension registers a proxy session on profile activation
- Order is sent to the **server proxy** (`/api/order/futures`) which signs + executes
- License enforcement happens server-side for Mainnet

Pass criteria:
- UI shows “Order Executed” (or a specific, informative error)
- No unhandled promise rejections in service worker console

### 5.2 Verify Audit Log Captures the Session
Steps:
1. Setup tab → **Session Audit Log**
2. Click Refresh (if needed)

Pass criteria:
- Request entry appears (method/url/params sanitized)
- Response entry appears (result)
- If errors occur, error entry appears
- Log never exceeds 100 entries (older lines roll off)

---

## 6) Time Sync (-1021) Verification

Goal: confirm automatic protection and recovery for “timestamp outside recvWindow”.

Steps:
1. Let extension run for ~2 minutes (time sync heartbeat should run)
2. Check service worker logs for time sync messages

Optional forced test:
- Temporarily simulate time drift by pausing execution in DevTools (advanced) and then retry order.

Pass criteria:
- On `-1021`, the engine syncs server time and retries (or produces a clean, actionable error)
- No crash / no broken state after recovery

---

## 7) Validation / Rounding (Tick + Lot Size)

Goal: confirm the engine prevents FILTER_FAILURE via rounding or rejects cleanly.

Steps:
1. Use a symbol with strict filters (e.g., `BTCUSDT`)
2. Try unusual notional/quantity inputs (if supported)

Pass criteria:
- Validation catches invalid values early
- If Binance rejects, error is clean + logged in Audit Log

---

## 8) ASL (Advanced Stop Loss) — Full Pillar

### 8.1 Phase 1: Entry + Hard Stop
Steps:
1. Enter Stop Loss % (e.g., `1.5`)
2. Execute an order

Pass criteria:
- Stop order placement is attempted immediately after entry
- If stop placement fails, warning appears (and ASL should not proceed blindly)
- Audit log shows stop-order request/response

### 8.2 Phase 2: Trailing Levels + Atomic Cancel/Replace
Steps:
1. Enable trailing logic (callback rate input if required)
2. Move trade into profit (this may be hard in testnet; use very small size and time)
3. Observe logs for “level 1/2/3” updates

Pass criteria:
- Trailing only escalates levels upward (no flapping)
- Cancel/replace is atomic: old SL not removed unless new SL accepted
- If cancel/replace fails, safety stop is attempted (logged)

---

## 9) Kill Switch (Operational Safety)

Goal: confirm the extension can flatten risk quickly and verifiably.

Steps:
1. Open at least 1–2 small positions (Testnet)
2. Click **Kill Switch**
3. Watch service worker logs + audit log

Pass criteria:
- Fetches open positions
- Places reduce-only market orders to close
- Cancels open orders (SL/TP/limit)
- Stops trailing engine positions
- Returns a summary (closed, cancelled, failures)

Failure criteria:
- Leaves positions open without telling you
- Cancels the SL but fails to close position (unsafe)

---

## 10) Error UX Tests (Must Be Visible + Helpful)

### 10.1 Insufficient Margin (`-2019`)
Steps:
1. Increase notional high enough to exceed test account margin
2. Execute order

Pass criteria:
- Notional input glows red / shows hint
- User sees “Insufficient margin” messaging
- Audit log shows the rejection

### 10.2 Rate Limit (`-1003`)
Steps:
1. Spam actions rapidly (orders / repeated calls)

Pass criteria:
- Buy/Sell buttons disabled
- Cooldown banner shows remaining time
- After cooldown expires, buttons re-enable

---

## 11) Hotkeys

Configured in `manifest.json`:
- Buy: **Ctrl+Shift+B**
- Sell: **Ctrl+Shift+S**

Steps:
1. Ensure you have symbol + notional set
2. Use hotkeys while side panel is open

Pass criteria:
- Command triggers execution (or clean error if missing inputs)
- Audit log records the attempt

---

## 12) Regression Checklist (Before Mainnet)

Run this list before any Mainnet usage:
- Vault unlocks reliably; wrong password fails safely
- No plaintext secrets in `chrome.storage.local`
- Trading WebSocket connects and stays stable for 10+ minutes
- Time sync heartbeat runs every 60 seconds
- Market order works on Testnet with small notional
- Stop-loss order places correctly (Phase 1)
- Trailing updates do not remove protection (Phase 2)
- Kill switch closes positions + cancels open orders
- Audit log contains accurate sanitized records
- `-2019` and `-1003` produce visible, helpful UI states

---

## 13) Known Constraints / Notes

- **Sub-250ms** depends heavily on network latency and Binance endpoint conditions.
- Some ASL triggers require market movement; on Testnet you may need time for profit thresholds.
- Monetization (Stripe/JWT gating) is **not part of this test scope** unless/ until added.

