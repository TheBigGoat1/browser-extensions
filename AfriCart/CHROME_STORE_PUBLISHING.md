# Publishing AfriCart on the Chrome Web Store

Use this guide to publish AfriCart on the Chrome Developer Dashboard and go live.

---

## 1. Before you upload

- **Developer account:** You need a [Chrome Web Store Developer account](https://chrome.google.com/webstore/devconsole). One-time registration fee applies (as of 2024, typically a small one-time payment).
- **Package:** Your extension is the **AfriCart** folder. You will zip this folder (contents only, not the parent folder name) for upload.

---

## 2. Create the upload package (ZIP)

1. Open the folder: `AfriCart` (the one that contains `manifest.json`, `trolley.png`, `sidepanel.html`, etc.).
2. Select **all files and folders inside** AfriCart (manifest.json, background.js, content.js, sidepanel.html, sidepanel.js, styles.css, options.html, options.js, parser.js, storage.js, utils.js, trolley.png, stores-database.js, and any .md files you want to exclude from the zip if you prefer a smaller package).
3. **Recommended:** Exclude from the ZIP: `TESTING.md`, `CHROME_STORE_PUBLISHING.md`, `OVERVIEW.md`, `GITHUB_SETUP.md` (they are not required for the extension to run and keep the package smaller).
4. Create a ZIP file of the selected items:
   - **Windows:** Right-click → Send to → Compressed (zipped) folder. Name it e.g. `AfriCart-1.5.0.zip`.
   - **Mac:** Right-click → Compress.
5. The ZIP must contain `manifest.json` at the **root** of the archive (no extra parent folder like `AfriCart` at the top level, or the store may reject it). So when you open the zip, you should see `manifest.json`, `trolley.png`, `background.js`, etc. directly.

**Check:** Unzip somewhere and confirm you see `manifest.json` and `trolley.png` in the root of the zip.

---

## 3. Upload to Chrome Developer Dashboard

1. Go to [Chrome Web Store Developer Dashboard](https://chrome.google.com/webstore/devconsole).
2. Sign in with your Google account and pay the one-time developer fee if prompted.
3. Click **“New item”**.
4. Click **“Choose file”** and select your `AfriCart-1.5.0.zip`.
5. If the manifest is valid, you’ll see a form with **Store listing** and **Privacy** sections. Fix any errors shown (e.g. description length, icons, permissions).

---

## 4. Store listing – what to enter

Fill in the following so your listing is clear and complete.

### Short description (132 characters max) – already in manifest

This is the `description` field in your manifest. You already have:

```
Compare prices across African e-commerce. Wishlist, price history, alerts, currency conversion and best price suggestions.
```

Use the same (or edit in manifest and re-zip) so it stays under 132 characters.

### Detailed description (for the store page)

Use this (or edit to taste) in the **Detailed description** field in the dashboard:

```
AfriCart helps you compare prices for the same product across African and global e-commerce sites. Open any product page on Jumia, Konga, Kilimall, Takealot, and many other supported stores, then open the AfriCart side panel to see your product and one-click buttons to search the same item on other stores.

Features:
• Same-product price comparison – search other stores without leaving your tab
• Best price suggestion – get a recommended store based on typical prices and ratings
• Wishlist – save products for later
• Price history – track price changes over time (stored locally)
• Price drop alerts – optional notifications when prices go down
• Currency converter – convert between NGN, ZAR, KES, EGP, USD
• Multi-product comparison – compare up to 5 products side by side
• Shipping estimate – rough total cost including shipping
• Responsive design – works in the side panel at any size
• No account required – all data stays in your browser

Supported regions include Nigeria (Jumia, Konga, Slot), South Africa (Takealot, Zando), Kenya (Jumia, Kilimall), Egypt (Jumia, Noon), and many more. Use the toolbar icon or Ctrl+Shift+A (Cmd+Shift+A on Mac) to open the panel.

Privacy: AfriCart does not send your data to external servers. Price history, wishlist, and settings are stored locally in your browser.
```

### Category

- Choose **Shopping** or **Productivity** (Shopping is a better fit).

### Language

- Select the primary language (e.g. **English**).

### Small tile (optional but recommended)

- **128x128** – use your `trolley.png` if it’s 128x128, or resize it. The store can scale, but 128x128 is standard.

### Screenshots

- Add at least **1 screenshot** (up to 5). Recommended size: **1280x800** or **640x400**.
- Show: (1) Side panel open on a product page with “Compare Prices” and store buttons, (2) Optional: best price suggestion card, (3) Optional: options/settings page.
- You can capture the side panel by opening it on a supported site (e.g. a Jumia or Kilimall product page) and taking a screenshot.

### Promotional images (optional)

- **Small promo tile:** 440x280  
- **Marquee:** 1400x560  
- **Large tile:** 920x680  

These improve visibility in the store; you can add them later.

---

## 5. Privacy and permissions

- **Single purpose:** Describe that the extension is for price comparison and shopping assistance. The dashboard may ask for a “single purpose” description; use something like: “Compare product prices across African e-commerce sites and suggest where to find the best price.”
- **Permission justifications:** Be ready to briefly justify:
  - **storage** – save wishlist, price history, settings
  - **tabs** – get current tab URL to detect product page
  - **sidePanel** – show the comparison panel
  - **activeTab** – access current tab when user invokes the extension
  - **host_permissions** – to run the extension on supported store domains (Jumia, Konga, etc.) so it can read product info and build comparison links
- **Privacy policy:** The Chrome Web Store may require a **privacy policy URL** if you collect any user data. AfriCart stores data only locally; you can state that in a short policy and host it (e.g. on GitHub Pages or your site). Example wording: “AfriCart does not collect or transmit personal data. All data (wishlist, price history, settings) is stored locally in your browser.”

---

## 6. Submit for review

1. Complete all required fields (description, category, screenshots, privacy if needed).
2. Click **“Submit for review”**.
3. Review usually takes from a few hours to a few days. You’ll get an email when it’s approved or if changes are requested.
4. After approval, set **visibility** (e.g. “Public” to list it in the store, or “Unlisted” if you only want to share the link).

---

## 7. Hosting and updates

- **Hosting:** The Chrome Web Store hosts your extension. Users install it from the store; you don’t need a separate hosting server for the extension package.
- **Updates:** When you release a new version:
  1. Update `version` in `manifest.json` (e.g. to `"1.5.1"`).
  2. Zip the AfriCart folder again (same way as above).
  3. In the Developer Dashboard, open your item → **Package** → upload the new zip and submit for review. Approved updates will roll out to users automatically.

---

## 8. Quick checklist

- [ ] Developer account created and fee paid
- [ ] ZIP contains manifest.json and trolley.png at root (no extra wrapper folder)
- [ ] Short description ≤ 132 characters (already set in manifest)
- [ ] Detailed description and category (e.g. Shopping) filled in
- [ ] At least one screenshot added
- [ ] Privacy policy URL added if required
- [ ] Permissions/single purpose explained
- [ ] Submitted for review
- [ ] Visibility set after approval (Public or Unlisted)

---

## 9. Store listing summary (copy-paste)

| Field | Content |
|-------|--------|
| **Name** | AfriCart - African Price Hopper |
| **Short description** | Compare prices across African e-commerce. Wishlist, price history, alerts, currency conversion and best price suggestions. |
| **Category** | Shopping |
| **Detailed description** | (Use the “Detailed description” block above.) |

Once the item is approved and public, your store URL will look like:  
`https://chrome.google.com/webstore/detail/[your-extension-id]`. You can share that link so users can install AfriCart directly from the Chrome Web Store.
