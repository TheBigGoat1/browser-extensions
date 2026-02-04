# Scrape Orange v2.0 - Installation & Setup Guide

## 🚀 **QUICK INSTALLATION**

### **Step 1: Load Extension**
1. Open Chrome
2. Navigate to: `chrome://extensions/`
3. Enable **"Developer mode"** (toggle in top-right)
4. Click **"Load unpacked"**
5. Select folder: `C:\Users\okeke\OneDrive\Desktop\PROGRAMS\Browser extension\WebScraper Pro`
6. Extension loads with **orange logo**

### **Step 2: Verify Installation**
✅ Check these:
- Extension name: **"Scrape Orange"**
- Version: **"2.0.0"**
- Orange logo appears in Chrome toolbar
- Status: **"Enabled"**
- No red error messages

### **Step 3: Open Side Panel**
- **Click the orange icon** in Chrome toolbar
- Side panel opens automatically
- You should see 3 tabs: **Sitemaps**, **Jobs**, **Results**

---

## ✅ **VERIFICATION CHECKLIST**

After installation, verify:

- [ ] Extension loads without errors
- [ ] Orange logo displays in toolbar
- [ ] Side panel opens on icon click
- [ ] All 3 tabs visible (Sitemaps, Jobs, Results)
- [ ] No emojis in UI (only SVG icons)
- [ ] Orange/black theme applied
- [ ] Service worker shows "Inspect" link (no errors)

---

## 🎯 **FIRST USE - CREATE YOUR FIRST SITEMAP**

### **Example: Scrape Product List**

1. **Navigate to a webpage** (e.g., https://example.com/products)

2. **Open Side Panel**
   - Click orange icon

3. **Create Sitemap**
   - Click **"Create Sitemap"**
   - Name: "Product List"
   - Start URL: Current page URL
   - Click **"Add Selector"**

4. **Select Elements**
   - Visual selector activates
   - **Click on a product container** (e.g., `div.product`)
   - CSS selector auto-fills
   - Check **"Multiple"** (for lists)
   - Click **"Save"**

5. **Add Child Selectors**
   - Click **"Add Selector"** again
   - **Click product title** → Save as "title"
   - **Click product price** → Save as "price"
   - Set parent to "product" (the container)

6. **Save Sitemap**
   - Click **"Save"** button
   - Sitemap appears in list

7. **Run Scraping**
   - Click **Play icon** on sitemap
   - Go to **"Jobs"** tab
   - Watch progress
   - Go to **"Results"** tab
   - View extracted data

8. **Export Data**
   - Select job from dropdown
   - Click **"Export"**
   - Choose CSV or JSON
   - File downloads

---

## 🔍 **TROUBLESHOOTING**

### **Side Panel Won't Open:**
1. Check `chrome://extensions/` → Verify `sidePanel` permission
2. Click "Service worker" → Check console for errors
3. Reload extension
4. Try right-clicking icon → "Open side panel"

### **Visual Selector Not Working:**
1. Make sure you're on a webpage (not chrome:// pages)
2. Refresh the page
3. Check content script is loaded (DevTools → Console)
4. Try clicking "Add Selector" again

### **Scraping Not Working:**
1. Check service worker console for errors
2. Verify sitemap has valid selectors
3. Check start URL is accessible
4. Look for errors in Jobs tab

### **No Results:**
1. Verify selectors are correct
2. Check if elements exist on page
3. Test selectors in browser DevTools
4. Check Results tab for any error messages

---

## 📋 **SYSTEM REQUIREMENTS**

- **Chrome Version:** 88+ (for Side Panel API)
- **Permissions:** All required permissions are in manifest
- **Storage:** Uses chrome.storage.local (unlimited)

---

## 🎨 **THEME CUSTOMIZATION**

The extension uses a professional orange/black theme:
- **Primary Color:** Orange (#FF6B35)
- **Background:** Black (#0A0A0A)
- **All Icons:** SVG (no emojis)

To customize, edit `styles.css` CSS variables.

---

## 📚 **DOCUMENTATION**

- **V2_COMPLETE.md** - Complete system documentation
- **README.md** - Technical overview
- **QUICK_START.md** - Quick reference guide

---

**Extension is ready to use!** 🎉
