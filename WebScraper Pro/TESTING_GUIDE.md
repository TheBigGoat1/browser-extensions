# Scrape Orange v2.0 - Complete Testing Guide

## 🧪 **STEP-BY-STEP FUNCTIONALITY TEST**

### **PREREQUISITES**
1. Extension loaded in Chrome (`chrome://extensions/`)
2. Extension shows "Enabled" status
3. Orange logo visible in toolbar
4. No red errors in extension card

---

## **TEST 1: Basic Setup & UI**

### **Step 1.1: Open Side Panel**
1. **Click the orange icon** in Chrome toolbar
2. **Expected:** Side panel opens on the right side
3. **Verify:** You see 3 tabs: "Sitemaps", "Jobs", "Results"

### **Step 1.2: Check UI Elements**
1. **Look at the header** - Should say "Scrape Orange v2.0"
2. **Check tabs** - All 3 tabs should be visible
3. **Check buttons** - "Create Sitemap" button should be visible
4. **Verify:** No emojis anywhere (only SVG icons)
5. **Verify:** Orange/black color scheme applied

### **Step 1.3: Check Service Worker**
1. Go to `chrome://extensions/`
2. Find "Scrape Orange"
3. Click **"Service worker"** link (or "Inspect views: service worker")
4. **Expected:** Console opens
5. **Verify:** No red errors
6. **Look for:** `[Background] Initialized` message

**✅ PASS:** If side panel opens, UI looks correct, no errors

---

## **TEST 2: Create & Save Sitemap**

### **Step 2.1: Create New Sitemap**
1. In side panel, click **"Create Sitemap"** button
2. **Expected:** Editor opens, list disappears
3. **Verify:** You see form fields: Name, Start URL, Selectors tree

### **Step 2.2: Fill Basic Info**
1. **Name field:** Enter "Test Sitemap"
2. **Start URL field:** Enter `https://example.com`
3. **Verify:** Both fields accept input

### **Step 2.3: Save Sitemap**
1. Click **"Save"** button
2. **Expected:** 
   - Notification appears: "Sitemap saved successfully"
   - Editor closes
   - List shows your sitemap
3. **Verify:** Sitemap appears in list with name "Test Sitemap"

**✅ PASS:** If sitemap saves and appears in list

---

## **TEST 3: Visual Selector (Point-and-Click)**

### **Step 3.1: Navigate to Test Page**
1. Open a new tab
2. Navigate to: `https://example.com`
3. **Important:** Must be a regular webpage (not chrome:// pages)

### **Step 3.2: Activate Visual Selector**
1. Go back to side panel
2. Click **"Edit"** on your test sitemap (or create new one)
3. Click **"Add Selector"** button
4. **Expected:**
   - Visual selector controls appear at bottom
   - Status says: "Click elements on the page to select them"
   - Go back to the webpage tab

### **Step 3.3: Select Elements**
1. **On the webpage** (example.com), move your mouse
2. **Expected:** Elements highlight with green border as you hover
3. **Click on the main heading** (e.g., "Example Domain")
4. **Expected:**
   - Element highlights
   - CSS selector hint appears
   - Modal opens in side panel
   - CSS selector field auto-fills

### **Step 3.4: Save Selector**
1. In the modal:
   - **Selector ID:** "heading" (or leave auto-generated)
   - **Type:** "SelectorText" (should be selected)
   - **CSS Selector:** Should be auto-filled (e.g., "h1")
   - **Multiple:** Leave unchecked
2. Click **"Save"**
3. **Expected:**
   - Modal closes
   - Selector appears in tree view
   - Notification: "Selector saved"

**✅ PASS:** If visual selector highlights elements and saves selector

---

## **TEST 4: Build Complete Sitemap**

### **Step 4.1: Add Container Selector**
1. Still editing your sitemap
2. Click **"Add Selector"** again
3. Go to webpage, **click on a container element** (e.g., a div)
4. In modal:
   - **ID:** "container"
   - **Type:** "SelectorElement"
   - **Multiple:** Check this (for lists)
   - **Parent:** "_root"
5. Click **"Save"**

### **Step 4.2: Add Child Selector**
1. Click **"Add Selector"** again
2. Go to webpage, **click on text inside container**
3. In modal:
   - **ID:** "text"
   - **Type:** "SelectorText"
   - **Parent:** Select "container" (not "_root")
   - **Multiple:** Unchecked
4. Click **"Save"**
5. **Expected:** Selector appears nested under "container" in tree

### **Step 4.3: Save Complete Sitemap**
1. Click **"Save"** button (top of editor)
2. **Expected:** Sitemap saved, appears in list

**✅ PASS:** If you can build a tree structure with parent-child selectors

---

## **TEST 5: Execute Scraping Job**

### **Step 5.1: Prepare Test Page**
1. Use a simple test page: `https://example.com`
2. Or use: `https://quotes.toscrape.com/` (has lists of quotes)

### **Step 5.2: Update Sitemap URL**
1. Edit your sitemap
2. **Start URL:** Change to your test page URL
3. **Save** sitemap

### **Step 5.3: Run Scraping**
1. In sitemap list, click **Play icon** (▶️) on your sitemap
2. **Expected:**
   - Notification: "Starting scraping job..."
   - Then: "Scraping started successfully"
   - Automatically switches to "Jobs" tab

### **Step 5.4: Monitor Job**
1. In **"Jobs"** tab:
   - **Expected:** Job appears with status "running"
   - Shows: "X pages • Y results"
2. **Wait 5-10 seconds**
3. **Expected:** Status updates, results count increases

### **Step 5.5: Check Service Worker Console**
1. Go to `chrome://extensions/`
2. Click **"Service worker"** → Inspect
3. **Look for:**
   - `[Background] Starting scraping for sitemap: ...`
   - `[Background] Tab created/opened: ...`
   - `[Background] Execute command sent to content script`
4. **No red errors**

### **Step 5.6: Check Content Script Console**
1. Go to your test webpage
2. Press **F12** (DevTools)
3. Go to **Console** tab
4. **Look for:**
   - `[ContentScript] Executing sitemap: ...`
   - `[SelectorEngine] Initialized with sitemap: ...`
   - `[SelectorEngine] Execution complete. Results: X`
5. **No red errors**

**✅ PASS:** If job runs, status updates, data is extracted

---

## **TEST 6: View Results**

### **Step 6.1: Go to Results Tab**
1. Click **"Results"** tab in side panel
2. **Expected:** Results interface loads

### **Step 6.2: Select Job**
1. In **"Select Job"** dropdown, choose your job
2. **Expected:**
   - Stats appear: "Total Results: X"
   - Table populates with data
   - Headers show selector IDs
   - Rows show extracted values

### **Step 6.3: Verify Data**
1. **Check table:**
   - Headers match your selector IDs
   - Rows contain extracted text/data
   - No empty table
2. **Check stats:**
   - Total Results > 0
   - Job Status shows "completed" or "running"

**✅ PASS:** If results display correctly in table

---

## **TEST 7: Export Data**

### **Step 7.1: Export to CSV**
1. In Results tab, job selected
2. Click **"Export"** button
3. **Prompt appears:** "Export format (csv/json):"
4. Type: `csv` and press Enter
5. **Expected:**
   - File downloads automatically
   - Filename: `[sitemap-name]_[timestamp].csv`
   - Notification: "Export complete"

### **Step 7.2: Verify CSV File**
1. Open downloaded CSV file
2. **Expected:**
   - Headers in first row
   - Data in subsequent rows
   - Properly formatted CSV

### **Step 7.3: Export to JSON**
1. Click **"Export"** again
2. Type: `json` and press Enter
3. **Expected:** JSON file downloads
4. Open file, verify JSON structure

**✅ PASS:** If files download and contain correct data

---

## **TEST 8: Advanced Features**

### **Test 8.1: Multiple Selectors**
1. Create sitemap with 3+ selectors
2. Run scraping
3. **Verify:** All selector data appears in results

### **Test 8.2: Parent-Child Relationships**
1. Create container selector (parent)
2. Create 2 child selectors
3. **Verify:** Children only extract from parent element

### **Test 8.3: Multiple Elements (Lists)**
1. Create selector with "Multiple" checked
2. Run on page with list
3. **Verify:** Multiple rows in results (one per element)

### **Test 8.4: Different Selector Types**
1. Test each type:
   - SelectorText
   - SelectorLink
   - SelectorImage
   - SelectorAttribute
2. **Verify:** Each extracts correct data type

---

## **DEBUGGING TIPS**

### **If Visual Selector Doesn't Work:**

1. **Check Console:**
   - Open DevTools (F12) on the webpage
   - Look for errors in Console
   - Should see: `[VisualSelector] Module loaded`

2. **Check Content Script:**
   - DevTools → Console
   - Type: `window.visualSelector`
   - Should return object (not undefined)

3. **Verify Page:**
   - Must be regular webpage (http/https)
   - Not chrome:// or extension pages
   - Page must be fully loaded

### **If Scraping Doesn't Work:**

1. **Check Service Worker:**
   - `chrome://extensions/` → Service worker → Inspect
   - Look for errors
   - Should see execution messages

2. **Check Content Script:**
   - DevTools → Console on webpage
   - Look for: `[ContentScript] Executing sitemap`
   - Check for errors

3. **Verify Sitemap:**
   - Selectors must be valid CSS
   - Start URL must be accessible
   - At least one selector required

4. **Check SelectorEngine:**
   - Console: `window.SelectorEngine`
   - Should return class (not undefined)

### **If Results Don't Appear:**

1. **Check Storage:**
   - Service worker console
   - Type: `chrome.storage.local.get(null, console.log)`
   - Should see results data

2. **Verify Job Status:**
   - Jobs tab should show "completed"
   - If "error", check error message

3. **Check Results Count:**
   - Stats should show > 0 results
   - If 0, selectors might not match

---

## **QUICK TEST SCENARIO**

### **5-Minute Quick Test:**

1. **Load extension** ✅
2. **Open side panel** ✅
3. **Create sitemap:**
   - Name: "Quick Test"
   - URL: `https://example.com`
4. **Add selector:**
   - Click "Add Selector"
   - Click heading on page
   - Save as "heading" (Text type)
5. **Save sitemap** ✅
6. **Run scraping:**
   - Click Play icon
   - Wait 5 seconds
7. **View results:**
   - Go to Results tab
   - Select job
   - Should see data
8. **Export:**
   - Click Export
   - Choose CSV
   - File downloads ✅

**If all steps work → Extension is fully functional!** 🎉

---

## **EXPECTED CONSOLE OUTPUT**

### **Service Worker (Background):**
```
[Background] Initialized
[Background] StorageManager loaded successfully
[Background] Service worker loaded successfully
[Background] Starting scraping for sitemap: sitemap_123
[Background] Tab created/opened: 456
[Background] Execute command sent to content script
```

### **Content Script (Webpage):**
```
[ContentScript] Initialized on: https://example.com
[ContentScript] Executing sitemap: sitemap_123
[ContentScript] Page ready
[ContentScript] Creating SelectorEngine instance
[SelectorEngine] Initialized with sitemap: sitemap_123
[SelectorEngine] Starting execution...
[SelectorEngine] Execution complete. Results: 5
[ContentScript] Execution complete. Results: 5
```

### **Visual Selector:**
```
[VisualSelector] Module loaded
[VisualSelector] Activated
[VisualSelector] Element selected: {selector: "h1", ...}
```

---

## **COMMON ISSUES & FIXES**

### **Issue: "SelectorEngine not loaded"**
**Fix:** Content scripts load in order. Check manifest.json - selector-engine.js must be listed.

### **Issue: "Visual selector not activating"**
**Fix:** 
- Make sure you're on a webpage (not chrome://)
- Refresh the page
- Check content script is injected

### **Issue: "No results extracted"**
**Fix:**
- Verify CSS selectors are correct
- Test selectors in browser DevTools
- Check if elements exist on page

### **Issue: "Job stuck on running"**
**Fix:**
- Check service worker console for errors
- Verify page loaded completely
- Check network connectivity

---

## **SUCCESS CRITERIA**

✅ **Extension is fully functional if:**
- Side panel opens
- Can create and save sitemaps
- Visual selector highlights elements
- Can run scraping jobs
- Results appear in table
- Can export to CSV/JSON
- No console errors
- All features work end-to-end

**Follow this guide step-by-step to verify everything works!** 🚀
