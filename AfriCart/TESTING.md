# AfriCart - Testing Guide

## 🚀 Quick Start Testing

### Step 1: Load the Extension

1. **Open Chrome Extensions Page**
   - Open Google Chrome
   - Navigate to `chrome://extensions/`
   - Or: Menu (⋮) → Extensions → Manage Extensions

2. **Enable Developer Mode**
   - Toggle "Developer mode" switch in the top-right corner

3. **Load the Extension**
   - Click "Load unpacked" button
   - Navigate to the `AfriCart` folder
   - Select the folder and click "Select Folder"
   - The extension should appear in your extensions list

4. **Verify Installation**
   - You should see "AfriCart - African Price Hopper" in the list
   - Version should show "1.5.0"
   - Status should be "Enabled"

---

## ✅ Basic Functionality Testing

### Test 1: Side Panel Access

1. **Open Side Panel**
   - Click the AfriCart extension icon in the toolbar
   - OR press `Ctrl+Shift+A` (Windows/Linux) or `Cmd+Shift+A` (Mac)
   - Side panel should open on the right side

2. **Verify UI Elements**
   - ✅ Header with "AfriCart" branding
   - ✅ Settings button (gear icon)
   - ✅ Footer with Help and Stats buttons

---

### Test 2: Product Detection (Core Feature)

1. **Navigate to a Supported Store**
   - Go to: `https://www.jumia.com.ng` (Nigeria)
   - OR: `https://www.takealot.com` (South Africa)
   - OR: `https://www.konga.com` (Nigeria)

2. **Open a Product Page**
   - Search for any product (e.g., "Samsung Galaxy")
   - Click on a product to open its detail page
   - Wait for the page to fully load

3. **Open AfriCart Side Panel**
   - Click the extension icon or press `Ctrl+Shift+A`
   - Side panel should show:
     - ✅ Product title
     - ✅ Product price
     - ✅ Product image (if available)
     - ✅ Current store badge with country flag
     - ✅ Comparison section with other stores

4. **Expected Result**
   - Product information should be extracted automatically
   - Store name and flag should be displayed
   - Price should be visible

---

### Test 3: Price Comparison (Core Feature)

1. **On a Product Page**
   - Make sure you're on a product detail page
   - Open the AfriCart side panel

2. **Click a Store Button**
   - Scroll to "Compare Prices" section
   - Click any store button (e.g., "Check Konga", "Check Takealot")
   - A new tab should open with search results

3. **Verify**
   - ✅ New tab opens with search query
   - ✅ Search URL contains the product name
   - ✅ Results page loads correctly

---

## 🆕 v1.5 Features Testing

### Test 4: Price History Tracking

1. **View Price History**
   - On a product page, open the side panel
   - Click the "History" button below the price
   - Price history section should appear

2. **First Visit**
   - Should show "No price history available" (expected on first visit)

3. **Track Price Changes**
   - Refresh the page (F5)
   - Open side panel again
   - Click "History" button
   - Should now show at least one price entry
   - Visit the same product multiple times to build history

4. **Verify**
   - ✅ Price history chart displays
   - ✅ Shows dates and prices
   - ✅ Visual bar chart representation

---

### Test 5: Price Drop Alerts

1. **Simulate Price Drop**
   - Visit a product page
   - Open side panel (this records the price)
   - Manually edit the price in storage (for testing):
     - Open DevTools (F12)
     - Go to Application → Storage → Local Storage
     - Find `priceHistory` and modify a price to be higher
   - Refresh the page and open side panel again
   - Should show price drop badge

2. **Check Badge**
   - Look for green badge showing "↓ X%" next to price
   - Badge should appear if price dropped

3. **Notification Test**
   - Price drop should trigger a browser notification
   - Check notification permissions if not showing

---

### Test 6: Wishlist System

1. **Add to Wishlist**
   - On a product page, open side panel
   - Click the "Wishlist" button (heart icon)
   - Button should highlight/change color
   - Notification should say "Added to wishlist"

2. **View Wishlist**
   - Scroll down in side panel
   - "My Wishlist" section should appear
   - Product card should be visible with:
     - ✅ Product image
     - ✅ Product title
     - ✅ Price
     - ✅ Store name
     - ✅ Remove button (×)

3. **Remove from Wishlist**
   - Click the × button on a wishlist item
   - Item should disappear
   - Notification should say "Removed from wishlist"

4. **Verify Persistence**
   - Close and reopen the side panel
   - Wishlist items should still be there
   - Close browser and reopen - items should persist

---

### Test 7: Currency Converter

1. **Open Converter**
   - On a product page, open side panel
   - Click the "Convert" button
   - Currency converter section should appear

2. **Test Conversion**
   - Amount field should auto-fill with product price
   - Select "NGN" as "From" currency
   - Select "USD" as "To" currency
   - Result should show converted amount
   - Try different currency pairs

3. **Manual Input**
   - Clear the amount field
   - Type "1000"
   - Select currencies
   - Verify conversion is correct

4. **Close Converter**
   - Click the × button
   - Converter should hide

---

### Test 8: Shipping Calculator

1. **View Shipping**
   - On a product page, open side panel
   - Scroll down to "Total Cost (with Shipping)" section
   - Should automatically display:
     - ✅ Product Price
     - ✅ Estimated Shipping
     - ✅ Total Cost

2. **Verify Calculation**
   - Shipping should be a percentage of product price
   - Total = Price + Shipping
   - Values should be formatted with currency symbol

---

### Test 9: Multi-Product Comparison

1. **Add First Product**
   - On a product page, open side panel
   - Scroll to "Multi-Product Comparison" section
   - Click "Add Current Product to Comparison"
   - Product should appear in comparison grid

2. **Add More Products**
   - Navigate to a different product page
   - Open side panel
   - Click "Add Current Product to Comparison" again
   - Should add up to 5 products

3. **View Comparison**
   - All added products should be visible in grid
   - Each shows: image, title, price, store
   - Products are displayed side-by-side

4. **Remove Products**
   - Click × button on any product
   - Product should be removed
   - Can add new products to replace

5. **Limit Test**
   - Try adding a 6th product
   - Should show error: "Maximum 5 products can be compared"

---

### Test 10: Quick Actions

1. **Refresh Button**
   - On a product page, open side panel
   - Click "Refresh" button
   - Side panel should reload product info
   - Loading indicator should appear briefly

2. **Copy Link Button**
   - Click "Copy Link" button
   - Button should show "Copied!" briefly
   - Paste somewhere (Ctrl+V) to verify link was copied

---

### Test 11: Settings Page

1. **Open Settings**
   - Right-click the extension icon
   - Click "Options"
   - OR click the settings button (gear) in side panel header

2. **Test Settings**
   - Toggle "Open links in new tabs"
   - Toggle "Show country flags"
   - Toggle "Enable affiliate links"
   - Click "Save Settings"
   - Success message should appear

3. **View Statistics**
   - Click "Stats" button in side panel footer
   - Should show usage statistics
   - Total comparisons count
   - Comparisons by store

4. **Reset Settings**
   - In settings page, click "Reset to Defaults"
   - Confirm the reset
   - Settings should revert to defaults

---

## 🐛 Troubleshooting Tests

### Test 12: Error Handling

1. **Unsupported Store**
   - Navigate to `https://www.google.com`
   - Open side panel
   - Should show "Store Not Supported" message
   - Should list supported stores

2. **No Product Detected**
   - Go to a store homepage (not product page)
   - Open side panel
   - Should show appropriate error message

3. **Network Issues**
   - Disconnect internet
   - Try to compare prices
   - Should handle gracefully (may show error)

---

## 📊 Advanced Testing

### Test 13: Data Persistence

1. **Close Browser**
   - Add items to wishlist
   - Add products to comparison
   - Close Chrome completely

2. **Reopen Browser**
   - Open Chrome again
   - Navigate to a product page
   - Open side panel
   - Wishlist and comparison should still be there

---

### Test 14: Cross-Tab Functionality

1. **Multiple Tabs**
   - Open product page in Tab 1
   - Open side panel
   - Open different product in Tab 2
   - Switch back to Tab 1
   - Side panel should still show Tab 1's product

---

### Test 15: Keyboard Shortcuts

1. **Test Shortcut**
   - Press `Ctrl+Shift+A` (Windows/Linux)
   - OR `Cmd+Shift+A` (Mac)
   - Side panel should toggle open/close

---

## ✅ Testing Checklist

### Core Features
- [ ] Extension loads without errors
- [ ] Side panel opens correctly
- [ ] Product detection works on supported stores
- [ ] Price extraction is accurate
- [ ] Store comparison buttons work
- [ ] Links open in new tabs

### v1.5 Features
- [ ] Price history tracking works
- [ ] Price drop alerts appear
- [ ] Wishlist add/remove functions
- [ ] Currency converter calculates correctly
- [ ] Shipping calculator shows totals
- [ ] Multi-product comparison (up to 5)
- [ ] All UI elements are visible and styled

### UI/UX
- [ ] All buttons are clickable
- [ ] Animations are smooth
- [ ] Colors and styling look professional
- [ ] Text is readable
- [ ] Layout is responsive

### Data Persistence
- [ ] Wishlist persists after browser close
- [ ] Price history is saved
- [ ] Comparison products are saved
- [ ] Settings are saved

---

## 🎯 Test Scenarios by Store

### Nigeria Stores
1. **Jumia Nigeria** - `https://www.jumia.com.ng`
2. **Konga** - `https://www.konga.com`
3. **Slot** - `https://slot.ng`

### South Africa Stores
1. **Takealot** - `https://www.takealot.com`
2. **Zando** - `https://www.zando.co.za`
3. **Superbalist** - `https://superbalist.com`

### Kenya Stores
1. **Jumia Kenya** - `https://www.jumia.co.ke`
2. **Kilimall** - `https://www.kilimall.co.ke`

### Egypt Stores
1. **Jumia Egypt** - `https://www.jumia.com.eg`
2. **Noon** - `https://www.noon.com`

---

## 🔍 Debugging Tips

### If Something Doesn't Work:

1. **Check Console**
   - Press F12 to open DevTools
   - Go to "Console" tab
   - Look for error messages (red text)
   - Take note of any errors

2. **Check Extension Errors**
   - Go to `chrome://extensions/`
   - Find AfriCart
   - Click "Errors" if any appear
   - Read the error details

3. **Reload Extension**
   - Go to `chrome://extensions/`
   - Click the reload icon (↻) on AfriCart
   - Try again

4. **Clear Storage** (if needed)
   - Open DevTools (F12)
   - Application → Storage → Clear site data
   - Reload extension

---

## 📝 Test Report Template

After testing, note:
- ✅ What works
- ❌ What doesn't work
- 🐛 Any bugs found
- 💡 Suggestions for improvement
- 📸 Screenshots of issues (if any)

---

**Happy Testing!** 🚀

If you encounter any issues, check the console for errors and refer to the troubleshooting section.
