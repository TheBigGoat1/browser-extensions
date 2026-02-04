# Binance Execution Pro - High-Frequency Trading Extension

**Production-Grade Chrome Extension for Sub-250ms Binance Order Execution**

## 🎯 Overview

Binance Execution Pro is a high-stakes trading extension built with HFT (High-Frequency Trading) architecture. It combines a sleek glassmorphic UI with military-grade security and persistent WebSocket connections for lightning-fast order execution.

## 🏗️ Architecture

### System Design
- **Frontend**: Chrome Extension with Glassmorphic UI (Black & Yellow Binance Branding)
- **Backend**: Node.js Proxy Server (Sprint 3) for persistent WebSocket connections
- **Security**: AES-256-GCM encryption with PBKDF2 key derivation
- **Execution**: Sub-250ms order placement via WebSocket streaming

### Component Breakdown

| Component | Technology | Responsibility |
|-----------|-----------|----------------|
| **UI Layer** | HTML/CSS/JS | Glassmorphic sidepanel, tab management, input validation |
| **Security** | Web Crypto API | AES-256-GCM encryption, PBKDF2 (1M rounds) |
| **Execution** | Service Worker | WebSocket management, HMAC-SHA256 signing |
| **Gateway** | Binance WebSocket | Order execution, real-time data |

## 📋 Features

### Tab 1: Tactical Trading Deck
- **Mode Toggles**: Spot/Futures, Isolated/Cross Margin, Hedge Mode
- **Minimize Feature**: Collapse to essential controls (SYMB | QTY | PNL)
- **Kill Switch**: One-click close all positions
- **Smart Validation**:
  - Tick size auto-rounding
  - Callback rate 0.1% increment enforcement
  - Help tooltips with Binance definitions
- **Real-time Position Tracking**: Entry, current price, PnL, stop loss

### Tab 2: Command & Control Center
- **Legal Disclaimer**: Non-bypassable scroll-to-read
- **Security Vault**: Master password setup with strength indicator
- **Connection Profiles**: Manage up to 5 accounts (Main, Scalp, Testnet, etc.)
- **Status Indicator**: Real-time WebSocket connectivity (Red/Green pulse)
- **API Key Instructions**: Integrated guide with direct Binance links

## 🔒 Security Implementation

### Encryption Layer (Sprint 2)
- **Algorithm**: AES-256-GCM
- **Key Derivation**: PBKDF2 with 1 million iterations
- **Storage**: Only encrypted blobs in `chrome.storage.local`
- **Master Key**: Never stored (user enters password each session)

### Security Features
- Unique IV (Initialization Vector) per encryption
- Salt per user
- Industry-standard SubtleCrypto API
- No plaintext API secrets in memory

## ⚡ Execution Logic

### Sub-250ms Secret
1. **Pre-signing**: API keys kept "hot" in memory (browser session only)
2. **WebSocket Streaming**: ORDER_PLACE via WebSocket (not REST POST)
3. **No Connection Overhead**: Persistent connection eliminates HTTPS handshake delay

### Advanced Stop-Loss (ASL) Hierarchy
- **Hard Stop**: Instant placement on Binance servers
- **Dynamic Trailing** (Levels 1-3):
  - Profit 1% → Callback Rate 2%
  - Profit 4% → Callback Rate 1.5%
- **Safety Stop**: Auto-places at -10% if no SL found (500ms check)

## 📁 File Structure

```
Binance Execution Pro/
├── manifest.json          # Extension configuration
├── sidepanel.html         # Main UI (two-tab system)
├── sidepanel.js           # UI orchestration & validation
├── background.js           # Service worker (WebSocket, execution)
├── styles.css              # Glassmorphic design system
├── security.js             # AES-256-GCM encryption (Sprint 2)
├── binance-engine.js       # WebSocket & signing logic (Sprint 3)
└── README.md               # This file
```

## 🚀 Installation

1. Clone or download this repository
2. Open Chrome and navigate to `chrome://extensions/`
3. Enable "Developer mode" (top right)
4. Click "Load unpacked"
5. Select the `Binance Execution Pro` folder
6. Open the extension and complete setup in Tab 2

## 📖 Usage

### Initial Setup
1. **Read Disclaimer**: Scroll through and accept terms
2. **Create Vault**: Set a strong master password (12+ characters recommended)
3. **Add Profile**: Enter API keys (Testnet recommended for testing)
4. **Connect**: Profile automatically connects via WebSocket

### Trading
1. **Select Mode**: Spot or Futures (with margin/hedge options)
2. **Enter Symbol**: Trading pair (e.g., BTCUSDT)
3. **Set Notional**: Order value in quote currency
4. **Configure Stop Loss**: Hard stop percentage
5. **Set Callback Rate**: Trailing stop distance (0.1% increments)
6. **Execute**: Click BUY (LONG) or SELL (SHORT)

### Minimize Mode
- Click minimize button to collapse UI
- Shows only: SYMB | QTY (editable) | PNL
- Quick BUY/SELL buttons remain visible

## ⚙️ Configuration

### Trading Modes
- **Spot**: Regular spot trading
- **Futures**: Perpetual futures with leverage
  - **Isolated**: Margin isolated per position
  - **Cross**: Shared margin across positions
  - **Hedge Mode**: Dual-side positions allowed

### Validation Rules
- **Symbol**: Must be valid Binance format (e.g., BTCUSDT)
- **Notional**: Minimum $5.00 for most pairs
- **Leverage**: 1x - 125x (Futures only)
- **Stop Loss**: Minimum 0.1%
- **Callback Rate**: 0.1% increments only (auto-adjusts)

## 🔧 Development Status

### ✅ Sprint 1: UI & Manifest (COMPLETE)
- [x] Manifest.json with all permissions
- [x] Glassmorphic sidepanel design
- [x] Two-tab system (Trade + Setup)
- [x] Binance black & yellow branding
- [x] Minimize feature
- [x] Input validation
- [x] Help tooltips
- [x] Kill switch UI

### 🚧 Sprint 2: Security Vault (NEXT)
- [ ] AES-256-GCM encryption module
- [ ] PBKDF2 key derivation
- [ ] Secure key storage
- [ ] Master password management

### 📋 Sprint 3: Execution Engine (PLANNED)
- [ ] WebSocket connection management
- [ ] HMAC-SHA256 request signing
- [ ] Order execution logic
- [ ] Trailing stop loss implementation
- [ ] Position tracking
- [ ] Real-time PnL updates

## 🎨 Design Philosophy

### Glassmorphism
- **Backdrop Blur**: 15px for frosted glass effect
- **Translucent Layers**: rgba(15, 23, 42, 0.7) backgrounds
- **Subtle Borders**: Yellow accent borders (rgba(240, 185, 11, 0.2))
- **Depth**: Multiple shadow layers for 3D effect

### Binance Branding
- **Primary Yellow**: #F0B90B (Binance official)
- **Dark Background**: #0B0E11 (Binance dark theme)
- **Accent Colors**: Green (buy), Red (sell), Orange (kill switch)

### Professional UI
- **Zero Icons**: 100% vector/CSS (no image dependencies)
- **Typography**: System fonts for native feel
- **Spacing**: Consistent 4px grid system
- **Animations**: Smooth transitions (0.15s - 0.5s)

## ⚠️ Important Notes

### Security
- **Never enable "Withdrawals"** in Binance API settings
- **Use Testnet** for development and testing
- **Master password** is never stored - remember it!
- **API keys** are encrypted but you're responsible for their security

### Trading Risks
- **High Leverage**: Can lead to significant losses
- **Market Volatility**: Prices can move rapidly
- **WebSocket Latency**: Network issues may affect execution speed
- **No Guarantees**: Past performance doesn't guarantee future results

### Legal
- **Compliance**: Ensure trading is legal in your jurisdiction
- **Tax Obligations**: Report trading activity as required
- **No Warranty**: Software provided "as-is"

## 🐛 Troubleshooting

**WebSocket won't connect?**
- Check API keys are correct
- Verify API permissions in Binance
- Ensure network allows WebSocket connections

**Orders not executing?**
- Verify connection status (green dot)
- Check symbol format (must be valid Binance pair)
- Ensure notional meets minimum requirements

**Encryption errors?**
- Master password must match original
- Clear storage and re-setup if needed

## 📝 License

This project is provided for educational and development purposes. Use at your own risk.

---

**Built with precision for professional traders.**
