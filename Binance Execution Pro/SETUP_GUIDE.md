# Binance Execution Pro - Setup Guide

## ⚠️ IMPORTANT: This Extension Uses API Keys, NOT Browser Login

**The extension does NOT use your browser login to Binance.** You must create **Binance API Keys** and configure them in the extension.

---

## Step-by-Step Setup

### 1. Get Binance API Keys

#### For Testnet (Free, Safe for Testing):
1. Go to: https://testnet.binancefuture.com/
2. Click **"Generate HMAC_SHA256 Key"** or use existing testnet credentials
3. Copy your **API Key** and **Secret Key**

#### For Mainnet (Real Trading - Requires Paid License):
1. Log into Binance.com
2. Go to **API Management**: https://www.binance.com/en/my/settings/api-management
3. Click **"Create API"**
4. Choose **"System generated"** for API key type
5. Label it (e.g., "Binance Execution Pro")
6. **Enable Futures Trading** permissions
7. **Restrict to "Enable Futures"** only (for security)
8. Copy your **API Key** and **Secret Key** (Secret is shown only once!)

---

### 2. Set Up the Extension

1. **Open the Extension Side Panel**
   - Click the Binance Execution Pro icon in your browser toolbar
   - Or right-click the icon → "Open side panel"

2. **Go to Setup Tab**
   - Click the **"Setup"** tab at the top

3. **Accept Disclaimer**
   - Read the legal disclaimer
   - Check **"I have read and agree to the terms above"**

4. **Create Security Vault**
   - Enter a **Master Password** (this encrypts your API keys)
   - Confirm the password
   - Click **"Setup Vault"**

5. **Add a Profile**
   - Click **"+ Add Profile"**
   - Fill in:
     - **Profile Name**: e.g., "Testnet Account" or "Main Account"
     - **Environment**: 
       - Select **"Testnet"** for testing (free)
       - Select **"Mainnet"** for real trading (requires paid license)
     - **API Key**: Paste your Binance API key
     - **API Secret**: Paste your Binance secret key
   - Click **"Save Profile"**

6. **Activate Profile**
   - Find your profile in the list
   - Click the **→** button (or click the profile name)
   - The extension will attempt to connect

7. **Verify Connection**
   - Look at the top-right status indicator:
     - **🟢 Green "CONNECTED"** = Success! You're ready to trade
     - **🔴 Red "DISCONNECTED"** = Check error message
     - **🟡 Yellow "CONNECTING..."** = Wait a moment

---

## Troubleshooting

### Status Shows "DISCONNECTED"

**Possible Causes:**
1. **No Profile Activated**
   - Go to Setup tab → Activate a profile (click → button)

2. **Invalid API Keys**
   - Double-check your API key and secret
   - For Testnet: Make sure you're using testnet keys
   - For Mainnet: Ensure API has "Futures Trading" enabled

3. **Network Issues**
   - Check your internet connection
   - Check if Binance is accessible in your region

4. **Proxy Server Not Running** (if using server-side execution)
   - Start the Node.js proxy: `cd server && npm start`
   - Check: `http://localhost:8787/health`

5. **Service Worker Not Running**
   - Go to `chrome://extensions/`
   - Find "Binance Execution Pro"
   - Click **"Service worker"** → **"Inspect"**
   - Check for red errors in console

### Error: "Connection Failed"

**Check the Error Message:**
- **"Invalid API key"** → Your API key is wrong or doesn't exist
- **"API key does not have permission"** → Enable Futures Trading in Binance API settings
- **"Timestamp outside recvWindow"** → Your system clock is wrong (sync time)
- **"Proxy register failed"** → Proxy server not running (optional, will fallback to direct)

### Error: "Vault Locked"

- You need to unlock the vault with your master password
- Go to Setup tab → Enter master password when prompted

### Error: "License manager not loaded"

- This happens if trying to use Mainnet without paid license
- Use **Testnet** for free testing
- Or purchase license for Mainnet access

---

## Testing Your Setup

### 1. Test Connection
- Activate a Testnet profile
- Status should turn **green "CONNECTED"**
- Connection banner should disappear

### 2. Test Order Execution (Testnet Only!)
- Go to Trade tab
- Symbol: `BTCUSDT`
- Notional: `5` (small amount)
- Click **BUY** or **SELL**
- Check Binance Testnet dashboard: https://testnet.binancefuture.com/
- You should see the order appear

### 3. Check Audit Log
- Go to Setup tab → Scroll to **"Session Audit Log"**
- You should see:
  - Request entries (order attempts)
  - Response entries (success/error)
  - Error entries (if any failures)

---

## Security Best Practices

1. **Never Share API Keys**
   - API keys are encrypted in the extension
   - But keep your master password secure

2. **Use IP Restrictions** (Mainnet)
   - In Binance API settings, restrict API key to your IP
   - This prevents unauthorized access if keys are compromised

3. **Use Testnet First**
   - Always test with Testnet before using Mainnet
   - Testnet uses fake money - safe to experiment

4. **Enable Only Necessary Permissions**
   - Only enable "Futures Trading" if you're trading futures
   - Don't enable "Withdraw" unless absolutely necessary

5. **Regular Key Rotation**
   - Periodically regenerate API keys
   - Delete old unused keys

---

## Quick Reference

| Status | Meaning | Action |
|--------|---------|--------|
| 🟢 **CONNECTED** | Ready to trade | You can execute orders |
| 🔴 **DISCONNECTED** | Not connected | Set up API keys in Setup tab |
| 🟡 **CONNECTING...** | Connecting now | Wait a moment |
| 🟡 **CONNECTION ERROR** | Connection failed | Check API keys and network |

---

## Still Having Issues?

1. **Check Service Worker Console**
   - `chrome://extensions/` → Binance Execution Pro → Service worker → Inspect
   - Look for red errors

2. **Check Side Panel Console**
   - Right-click side panel → Inspect
   - Look for errors

3. **Check Audit Log**
   - Setup tab → Session Audit Log
   - Look for error entries with details

4. **Verify API Keys**
   - Testnet: https://testnet.binancefuture.com/
   - Mainnet: https://www.binance.com/en/my/settings/api-management

---

## Next Steps

Once connected:
- ✅ Status shows **green "CONNECTED"**
- ✅ You can execute trades on the Trade tab
- ✅ Orders will appear in your Binance account
- ✅ Check Audit Log for execution history

**Remember:** This extension uses **API keys**, not browser login. Being logged into Binance.com in your browser does NOT connect the extension.
