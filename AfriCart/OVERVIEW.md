# AfriCart – What It Does (From the Top)

## In one sentence

**AfriCart is a browser extension that compares product prices across African (and global) e-commerce sites.** You open a product page on a supported store, open AfriCart’s side panel, and it shows you the same product (or search) on other stores so you can find the best price.

---

## Core flow

1. **You are on a product page** (e.g. Jumia Nigeria, Konga, Takealot, Amazon, etc.).
2. **You open AfriCart** (toolbar icon or `Ctrl+Shift+A` / `Cmd+Shift+A`).
3. **The extension**  
   - Detects the store and country  
   - Extracts product title, price, image, and optional original price  
   - Shows the current product in the side panel  
   - Lists other supported stores with “Compare” actions
4. **You click a store** → AfriCart opens that store’s search (using the product title) in a new tab so you can compare prices yourself.

So: **one product page → one panel → hop to other stores’ search results.**

---

## How the main features fit together

| Feature | What it does | How it ties in |
|--------|----------------|-----------------|
| **Current product card** | Shows store, title, price, image, discount if any | Central place for the product you’re viewing; all other features refer to this product. |
| **Compare prices** | Buttons like “Check Konga”, “Check Takealot” | Builds search URLs from the **current product title** and opens them in new tabs. |
| **Price history** | Tracks price over time (stored locally) | Uses the **same product** (URL + title); “Price History” button shows trend. |
| **Price drop alerts** | Notifications when price goes down | Uses **price history** for this product; background/options can trigger alerts. |
| **Wishlist** | Save products for later | Saves the **current product** (title, URL, price, store); list appears in side panel. |
| **Currency converter** | Convert amount between NGN, ZAR, KES, EGP, USD | Pre-fills with **current product price**; convert to other currencies. |
| **Shipping estimate** | Rough “product + shipping” total | Uses **current product price** and store/country to show an estimate. |
| **Multi-product comparison** | Add current product to a list of up to 5 | “Add to comparison” adds **current product**; side panel shows the list. |
| **Copy link** | Copy product URL | Copies the **current product** URL. |
| **Refresh** | Re-read the page | Re-runs extraction and updates the **current product** and all sections that depend on it. |
| **Stats** | Count of “hops” (comparisons) per store | Tied to **Compare** actions when you open another store. |
| **Settings (Options)** | Preferences, affiliate, etc. | Affects how **Compare** links are built (e.g. affiliate params). |

So across the extension, **everything is driven by the current tab’s product**. The side panel is the single place where that product is shown and where you trigger comparison, wishlist, history, currency, shipping, and multi-compare.

---

## Supported stores (concept)

- **Africa:** Jumia (NG, KE, EG, GH, etc.), Konga, Slot, Takealot, Zando, Superbalist, Kilimall, Amanbo, Copia, and others.
- **Global:** Amazon (multiple domains), eBay, Walmart, Temu, Shein, AliExpress, Noon, etc.

The exact list is in `manifest.json` (host_permissions) and in the content script / store config. Only pages on those domains get the content script and show the “Compare” options.

---

## Technical layout (for developers)

- **Content script** (`content.js` + `parser.js`): Runs on product pages; detects store and extracts product data; responds to `getProductInfo` from the side panel.
- **Side panel** (`sidepanel.html` + `sidepanel.js` + `styles.css`): UI for current product, compare buttons, wishlist, price history, currency converter, shipping, multi-compare. Loads `utils.js` for price/currency helpers.
- **Background** (`background.js`): Tracks hops, can show price-drop notifications, handles extension lifecycle.
- **Options** (`options.html` + `options.js`): User settings (e.g. open in new tab, affiliate).
- **Storage:** Local only (e.g. price history, wishlist, comparison list, usage stats). No external server.

This keeps a single source of truth (current product from content script) and one UI (side panel) so features stay correlated and the code stays maintainable.
