# WebScraper Pro

A professional Chrome extension for web scraping with visual selector and sitemap-based extraction, inspired by WebScraper.io and ParseHub.

## 🎯 Features

### Core Functionality
- **Visual Selector**: Point-and-click interface to select elements on any webpage
- **Sitemap Builder**: Create complex extraction rules with parent-child relationships
- **Recursive Crawler**: Depth-First Search (DFS) logic for multi-page scraping
- **Multiple Selector Types**: Text, Link, Image, Attribute, HTML, Table
- **Infinite Scroll Handling**: Automatic detection and scrolling for dynamic content
- **Export Formats**: CSV, JSON, XLSX (with SheetJS)

### Advanced Features
- **Job Management**: Track multiple scraping jobs with status monitoring
- **Scheduler**: Schedule jobs to run automatically (hourly/daily) using Chrome Alarms
- **State Persistence**: All data saved to `chrome.storage.local`
- **Queue Management**: Automatic handling of pending URLs and failed retries
- **Results Viewer**: Built-in table viewer for extracted data

## 📁 Architecture

### Core Components

1. **`selector-engine.js`** - The "mechanical heart"
   - Recursive DFS crawler
   - Parent-child selector execution
   - Data extraction logic

2. **`visual-selector.js`** - Point-and-click interface
   - DOM highlighter with overlay
   - CSS path calculator
   - Similar element detection

3. **`content.js`** - Extraction worker
   - Executes sitemaps on target pages
   - Handles infinite scroll
   - Waits for dynamic content

4. **`background.js`** - Orchestrator
   - Queue management
   - Job scheduling
   - Data aggregation

5. **`storage-manager.js`** - State persistence
   - Sitemap storage
   - Job tracking
   - Results caching

6. **`export-manager.js`** - Data export
   - CSV/JSON/XLSX export
   - Clipboard support
   - File downloads

## 🚀 Getting Started

### Installation

1. **Load Extension in Chrome**
   ```
   1. Open Chrome and go to chrome://extensions/
   2. Enable "Developer mode" (top right)
   3. Click "Load unpacked"
   4. Select the "WebScraper Pro" folder
   ```

2. **Open Side Panel**
   - Click the extension icon in the toolbar
   - Or right-click icon → "Open side panel"

### Creating Your First Sitemap

1. **Create a New Sitemap**
   - Click "+ Create Sitemap"
   - Enter a name (e.g., "Amazon Products")
   - Enter start URL (e.g., "https://amazon.com/s?k=laptop")

2. **Add Selectors**
   - Click "+ Add Selector"
   - Visual selector will activate
   - Click on elements on the webpage to select them
   - Selector will auto-populate with CSS path

3. **Configure Selector**
   - **ID**: Unique identifier (e.g., "product_title")
   - **Type**: Text, Link, Image, etc.
   - **CSS Selector**: Auto-filled from visual selection
   - **Multiple**: Check if selecting from a list
   - **Parent**: Choose parent selector (or "_root")

4. **Build Tree Structure**
   - Add container selector first (e.g., "product_wrapper")
   - Add child selectors (e.g., "title", "price", "link")
   - Child selectors only search within parent elements

5. **Save and Run**
   - Click "Save" to save sitemap
   - Click "Test" or "Run" to start scraping
   - View results in "Results" tab

## 📖 Usage Examples

### Example 1: Simple List Scraping

**Sitemap Structure:**
```json
{
  "id": "product_list",
  "startUrl": "https://example.com/products",
  "selectors": [
    {
      "id": "product",
      "type": "SelectorElement",
      "parentSelectors": ["_root"],
      "selector": "div.product-item",
      "multiple": true
    },
    {
      "id": "title",
      "type": "SelectorText",
      "parentSelectors": ["product"],
      "selector": "h2",
      "multiple": false
    },
    {
      "id": "price",
      "type": "SelectorText",
      "parentSelectors": ["product"],
      "selector": ".price",
      "multiple": false
    }
  ]
}
```

### Example 2: Multi-Page Navigation

**Sitemap Structure:**
```json
{
  "id": "multi_page",
  "startUrl": "https://example.com/list",
  "selectors": [
    {
      "id": "next_page",
      "type": "SelectorLink",
      "parentSelectors": ["_root"],
      "selector": "a.next",
      "multiple": false
    },
    {
      "id": "item",
      "type": "SelectorText",
      "parentSelectors": ["_root"],
      "selector": ".item",
      "multiple": true
    }
  ]
}
```

## 🔧 Technical Details

### Selector Types

- **SelectorElement**: Container/wrapper (no data extraction)
- **SelectorText**: Extract text content
- **SelectorLink**: Extract href and navigate to new pages
- **SelectorImage**: Extract image src, alt, title
- **SelectorAttribute**: Extract any HTML attribute
- **SelectorHTML**: Extract innerHTML
- **SelectorTable**: Extract table data as rows

### Execution Flow

1. **Initialize**: Load sitemap and find root selectors
2. **Execute Root**: Find all elements matching root selectors
3. **Recurse**: For each root element, find and process child selectors
4. **Extract**: Extract data based on selector type
5. **Navigate**: If Link selector, queue URL for navigation
6. **Aggregate**: Collect all results and save to storage

### State Management

All state is persisted in `chrome.storage.local`:
- **Sitemaps**: JSON sitemap definitions
- **Jobs**: Active and completed scraping jobs
- **Results**: Extracted data per job
- **Pending URLs**: Queue of URLs to process
- **Failed URLs**: URLs that failed (for retry)

## 🎨 UI Components

### Sitemaps Tab
- List of all saved sitemaps
- Create, edit, delete, run sitemaps
- Visual sitemap editor with tree view

### Jobs Tab
- Active and completed scraping jobs
- Real-time status updates
- Job statistics (pages, results, errors)

### Results Tab
- View extracted data in table format
- Filter by job
- Export to CSV/JSON/XLSX

## 🔐 Permissions

- **storage**: Save sitemaps, jobs, results
- **tabs**: Navigate to URLs and inject scripts
- **scripting**: Inject content scripts
- **activeTab**: Access current tab
- **alarms**: Schedule automatic scraping jobs
- **host_permissions**: Access all URLs for scraping

## 🐛 Troubleshooting

### Visual Selector Not Working
- Make sure you're on the target webpage
- Refresh the page and try again
- Check browser console for errors

### Selectors Not Finding Elements
- Verify CSS selector is correct
- Check if page structure changed
- Use browser DevTools to test selector

### Scraping Stuck
- Check job status in "Jobs" tab
- Look for errors in browser console
- Verify start URL is accessible

### Export Not Working
- Check if results exist for selected job
- Try different export format
- Check browser download permissions

## 📝 Development

### File Structure
```
WebScraper Pro/
├── manifest.json          # Extension manifest
├── background.js          # Service worker orchestrator
├── content.js             # Content script worker
├── selector-engine.js     # Core extraction engine
├── visual-selector.js     # Point-and-click interface
├── storage-manager.js     # State persistence
├── export-manager.js      # CSV/JSON export
├── sidepanel.html         # UI markup
├── sidepanel.js           # UI logic
├── styles.css             # UI styles
└── README.md              # This file
```

### Adding New Selector Types

1. Add type to `SELECTOR_TYPES` in `selector-engine.js`
2. Add extraction method (e.g., `extractCustom()`)
3. Add case in `extractData()` method
4. Add UI option in `sidepanel.html` selector type dropdown

## 📄 License

This project is provided as-is for educational and development purposes.

## 🙏 Credits

Inspired by:
- [WebScraper.io](https://webscraper.io/)
- [ParseHub](https://www.parsehub.com/)

Built with modern web technologies and Chrome Extension Manifest V3.
