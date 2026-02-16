# Freelancer Commander — Preview & Testing Guide

Use this to **design and test the interface** without loading the extension every time, and to **run the real extension** when you need full behavior.

---

## 1. Preview the UI (design and layout)

Use the **standalone preview** so you can see the side panel layout and tweak CSS/HTML in the browser.

### Option A: Open the file directly
1. In File Explorer, go to the `FreelancerCommander` folder.
2. Double-click **`sidepanel-preview.html`** to open it in your default browser.  
   Or right-click → **Open with** → Chrome (or Edge).

You’ll see the same header, tabs, panels, and action bar as the real side panel. Iframes show a blank area in preview (no external sites). Buttons and tab switching work; “Open Full Page” opens the real URL in a new tab.

### Option B: Use Live Server in VS Code / Cursor
1. Install the **Live Server** extension if you don’t have it.
2. Right-click **`sidepanel-preview.html`** in the file tree.
3. Choose **“Open with Live Server”**.

The page opens in the browser and **auto-refreshes when you save** `sidepanel-preview.html` or its CSS. Best for quick layout and style changes.

### What works in preview
- Full layout and styling (same as the real side panel).
- Tab switching (ChatGPT, Claude, DeepSeek, etc.).
- Button clicks (Translate, Draft Proposal, Urgent Bid) show status messages; clipboard/real AI won’t work.
- “Open Full Page” opens the real site in a new tab.
- “Refresh” reloads the blank iframe.

### Design workflow
1. Edit **`sidepanel.html`** (or copy changes into `sidepanel-preview.html` if you prefer to keep them in sync).
2. View changes in **`sidepanel-preview.html`** (direct open or Live Server).
3. When you’re happy, the real extension uses **`sidepanel.html`** (see below).

---

## 2. Test the real extension in Chrome

To test **full behavior** (side panel, storage, real iframes, etc.):

1. Open Chrome and go to **`chrome://extensions`**.
2. Turn **Developer mode** ON (top right).
3. Click **“Load unpacked”**.
4. Select the **`FreelancerCommander`** folder (the one that contains `manifest.json`).
5. The extension appears in the toolbar. Click its icon to open the **side panel**.

The side panel is the same UI as in the preview, but:
- It runs in the extension context (real `chrome.storage`, etc.).
- Iframes load the real sites (ChatGPT, Claude, etc.).
- Translate / Draft Proposal / Urgent Bid use the real prompt logic and clipboard.

After code changes, go to **`chrome://extensions`** and click the **reload** icon on your extension to pick up changes.

---

## Files involved

| File | Purpose |
|------|--------|
| **sidepanel.html** | Real side panel UI used by the extension. |
| **sidepanel-preview.html** | Standalone copy for preview; uses blank iframes and a mock for Chrome APIs. |
| **preview-mock-chrome.js** | Mocks `chrome.storage` and `chrome.tabs` so the preview runs in a normal tab. |
| **sidepanel.js** | Main logic; used by both the real panel and the preview. |

Keep layout and styles in **`sidepanel.html`** so the extension always has the latest design. Use **`sidepanel-preview.html`** for fast visual iteration, then copy any layout/CSS changes back to **`sidepanel.html`** if you edited the preview only.
