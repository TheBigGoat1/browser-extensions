# AfriCart - African Price Hopper

**Compare prices across African e-commerce platforms. Find the best deals on Jumia, Konga, Takealot, Kilimall, and more.**

**Version 1.5.0** - Now with Price History, Alerts, Wishlist, Multi-Product Comparison, Currency Conversion, Shipping Calculator, and Review Aggregation!

AfriCart is a specialized price comparison extension designed specifically for the African e-commerce market. Unlike global extensions that focus on US/EU markets, AfriCart understands local currency, logistics, and regional stores.

## 🌍 Features

### Regional Intelligence
- ✅ **Multi-Country Support** - Nigeria, South Africa, Kenya, Egypt
- ✅ **Site-Aware Scraping** - Automatically detects which store you're on
- ✅ **Smart Product Extraction** - Finds product title, price, and image
- ✅ **Instant Price Comparison** - One-click comparison across stores

### Supported Markets

#### 🇳🇬 Nigeria
- **Jumia Nigeria** - Largest e-commerce platform
- **Konga** - Major Nigerian marketplace
- **Slot** - Electronics and gadgets specialist

#### 🇿🇦 South Africa
- **Takealot** - Leading SA e-commerce
- **Zando** - Fashion and lifestyle
- **Superbalist** - Fashion and home goods
- **Amazon South Africa** - Global giant, local presence

#### 🇰🇪 Kenya
- **Jumia Kenya** - Regional leader
- **Kilimall** - Growing marketplace
- **Amanbo** - Local marketplace
- **Copia** - Local favorite

#### 🇪🇬 Egypt
- **Jumia Egypt** - Regional presence
- **Amazon Egypt** - International platform
- **Noon** - Middle East & North Africa

#### 🌍 Global Stores
- **Temu** - Global e-commerce platform
- **Shein** - Fashion and lifestyle global platform

### Professional Features
- ✅ **Side Panel UI** - Persistent interface
- ✅ **Country Flags** - Visual country identification
- ✅ **Currency Display** - Shows local currency
- ✅ **One-Click Comparison** - Opens search in new tabs
- ✅ **Usage Statistics** - Track your comparisons
- ✅ **Affiliate Support** - Ready for affiliate programs

### Advanced Features (v1.5)
- ✅ **Price History Tracking** - Track price changes over time
- ✅ **Price Drop Alerts** - Get notified when prices drop
- ✅ **Wishlist Functionality** - Save products for later comparison
- ✅ **Multi-Product Comparison** - Compare multiple products side-by-side
- ✅ **Currency Conversion** - Convert prices across different currencies
- ✅ **Shipping Cost Comparison** - Compare total costs including shipping
- ✅ **Review Aggregation** - Aggregate reviews from multiple stores

## 🚀 Installation

### For Development/Testing

1. Open Chrome and navigate to `chrome://extensions/`
2. Enable "Developer mode" (toggle in top right)
3. Click "Load unpacked"
4. Select the `AfriCart` folder
5. The extension is now installed!

> 📖 **Detailed Testing Guide**: See [TESTING.md](TESTING.md) for comprehensive testing procedures

## 📖 Usage

### Basic Usage

1. Navigate to a product page on any supported African e-commerce site
2. Click the AfriCart extension icon or press `Ctrl+Shift+A`
3. View the product information and available comparison stores
4. Click any store button to compare prices
5. Results open in new tabs for easy comparison

### Keyboard Shortcuts

- `Ctrl+Shift+A` (Mac: `Cmd+Shift+A`) - Toggle side panel

### Features

- **Automatic Detection** - Knows which store you're on
- **Smart Extraction** - Finds product details automatically
- **Quick Comparison** - One click to check other stores
- **Copy Link** - Share product links easily
- **Statistics** - Track your price comparisons

## 🏗️ Architecture

### System Components

1. **Content Scraper (content.js)** - The "Eyes"
   - Site-aware product extraction
   - Store-specific selectors
   - Automatic store detection
   - Product information parsing

2. **Background Worker (background.js)** - The "Engine"
   - Extension lifecycle management
   - Usage analytics tracking
   - Cross-tab communication

3. **Side Panel (sidepanel.html/js)** - The "Command Center"
   - Product display
   - Comparison store buttons
   - Link building
   - Statistics display

4. **Settings Page (options.html/js)** - Configuration
   - General preferences
   - Affiliate link settings
   - Usage statistics

## 🔧 How It Works

### Three-Step Flow

**Step 1: Detection**
- When you're on a product page (e.g., Jumia Nigeria for "Samsung Galaxy A54")
- Extension automatically detects which store you're on
- Extracts the product title using store-specific selectors

**Step 2: Cleaning**
- Converts product title into a search query
- URL-encodes the text (handles spaces, special characters)
- Example: "Samsung Galaxy A54" → "Samsung+Galaxy+A54"

**Step 3: Hopping**
- Generates comparison buttons in the side panel
- Each button links to the search page on other stores
- Example: "Check Konga" → `https://www.konga.com/search?search=Samsung+Galaxy+A54`
- Example: "Check Slot" → `https://slot.ng/catalogsearch/result/?q=Samsung+Galaxy+A54`

### Store Detection
1. Extension detects current website domain
2. Matches against African store database
3. Identifies country and currency

### Product Extraction
1. Uses store-specific CSS selectors
2. Extracts title, price, image, description
3. Handles different page layouts

### Price Comparison
1. Builds search URLs for other stores
2. Uses product title as search query
3. Opens in new tabs for comparison
4. Tracks usage for analytics

### Link Building Examples
- **Jumia Nigeria**: `https://www.jumia.com.ng/catalog/?q=PRODUCT_NAME`
- **Konga**: `https://www.konga.com/search?search=PRODUCT_NAME`
- **Slot**: `https://slot.ng/catalogsearch/result/?q=PRODUCT_NAME`
- **Takealot**: `https://www.takealot.com/all?qsearch=PRODUCT_NAME`
- **Superbalist**: `https://superbalist.com/search?q=PRODUCT_NAME`
- **Kilimall**: `https://www.kilimall.co.ke/new/search?q=PRODUCT_NAME`
- **Amanbo**: `https://www.amanbo.co.ke/search/?q=PRODUCT_NAME`
- And more...

## 📁 File Structure

```
AfriCart/
├── manifest.json       # Extension configuration
├── content.js          # Site-aware scraper (The "Eyes")
├── background.js        # Background worker (The "Engine")
├── sidepanel.html       # Side panel UI (The "Command Center")
├── sidepanel.js         # UI orchestrator & link builder
├── styles.css           # Premium design system
├── options.html         # Settings page
├── options.js           # Settings logic
└── README.md           # This file
```

## 🎨 Design

### Color Palette
- **Primary**: #FFD700 (Gold - African theme)
- **Secondary**: #228B22 (Forest Green)
- **Accent**: #FF6347 (Tomato)

### Features
- Gradient headers
- Country flags
- Card-based layouts
- Smooth animations
- Professional typography

## 💰 Revenue Potential

AfriCart is designed with affiliate revenue in mind:

1. **Jumia Affiliate Program** - Sign up and earn commissions
2. **Takealot Affiliate** - Partner program available
3. **Amazon Associates** - For Amazon SA/EG
4. **Other Programs** - Many stores offer affiliate programs

The extension is ready to add affiliate tracking parameters when you sign up for programs.

## 🔒 Privacy

- ✅ No data sent to external servers
- ✅ All data stored locally
- ✅ Usage statistics stored in browser
- ✅ No tracking or analytics

## ⚙️ Configuration

### Settings Page

Access via: Right-click extension icon → "Options"

**Available Settings:**
- Open links in new tabs
- Show country flags
- Enable affiliate links
- View usage statistics

## 🐛 Troubleshooting

**Side panel not opening?**
- Check if extension is enabled
- Try clicking the extension icon
- Use keyboard shortcut `Ctrl+Shift+A`

**Product not detected?**
- Make sure you're on a product page (not homepage)
- Refresh the page and try again
- Check browser console for errors (F12)

**Comparison links not working?**
- Verify you're on a supported store
- Check internet connection
- Try refreshing the page

## 📊 Analytics

AfriCart tracks usage locally:
- Total price comparisons
- Comparisons by store
- Last comparison timestamp

View statistics in the settings page.

## 📝 Version History

### v1.5.0 (Current)
- ✨ **Price History Tracking** - Automatic price tracking with historical data
- 🔔 **Price Drop Alerts** - Smart notifications when prices decrease
- 💝 **Wishlist System** - Save and manage favorite products
- 📊 **Multi-Product Comparison** - Compare up to 5 products simultaneously
- 💱 **Currency Converter** - Real-time conversion across NGN, ZAR, KES, EGP, USD
- 🚚 **Shipping Calculator** - Compare total costs including shipping fees
- ⭐ **Review Aggregator** - Unified review scores from all stores
- 🎨 **Premium UI Redesign** - Designer-grade interface with enhanced UX
- 🚀 **Performance Improvements** - Faster loading and smoother animations

### v1.0.0
- Initial release
- Support for 4 countries, 17+ stores
- Site-aware product extraction
- Price comparison functionality
- Usage statistics
- Settings page

## 🚀 Version 2.0 Roadmap

### Planned Features for Next Major Release

#### Smart Shopping Intelligence
- 🤖 **AI-Powered Price Predictions** - Machine learning to predict best buying times
- 📈 **Price Trend Analysis** - Visual charts showing price movements
- 🎯 **Smart Recommendations** - AI suggests best deals based on your preferences
- 🔍 **Advanced Search Filters** - Filter by price range, ratings, availability

#### Enhanced User Experience
- 📱 **Mobile Companion App** - Native mobile app for iOS and Android
- 🌐 **Browser Sync** - Sync wishlist and alerts across devices
- 🎨 **Custom Themes** - Personalize the extension appearance
- 📊 **Advanced Analytics Dashboard** - Detailed insights and shopping patterns

#### Social & Community Features
- 👥 **Price Sharing** - Share deals with friends and family
- 💬 **Community Reviews** - User-generated reviews and ratings
- 🏆 **Deal Leaderboard** - Track who finds the best deals
- 📢 **Deal Alerts Network** - Community-driven price drop notifications

#### Integration & Automation
- 🔗 **API Access** - Developer API for third-party integrations
- ⚙️ **Automated Shopping** - Auto-purchase when price drops below threshold
- 📧 **Email Digest** - Weekly summary of price changes
- 🔔 **Push Notifications** - Browser notifications for price alerts

#### Advanced Comparison Tools
- 🎬 **Video Comparison** - Side-by-side product video reviews
- 📸 **Image Comparison** - Visual product comparison tool
- 📋 **Specification Matrix** - Detailed technical comparison
- 🏪 **Store Reputation Score** - Trust ratings for each store

#### Business Features
- 💼 **B2B Price Tracking** - Enterprise features for businesses
- 📈 **Bulk Comparison** - Compare hundreds of products at once
- 📊 **Export Reports** - Generate PDF/Excel reports of comparisons
- 🔐 **Team Collaboration** - Share wishlists and alerts with teams

## 🎯 Best Practices

1. **Product Pages** - Works best on individual product pages
2. **Supported Stores** - Only works on listed African e-commerce sites
3. **Search Accuracy** - Uses product title for search (may need refinement)
4. **Affiliate Links** - Enable in settings after signing up for programs

## 📄 License

MIT License - Feel free to use and modify

## 🙏 Credits

- **Design**: Professional African-themed design
- **Stores**: All major African e-commerce platforms
- **Icons**: Custom SVG icons

---

**AfriCart** - Your gateway to the best prices across Africa! 🛒🌍
