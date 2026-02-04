// AfriCart - Storage Manager
// Handles price history, wishlist, and user preferences with intelligent tracking

class AfriCartStorage {
  constructor() {
    this.storageKey = 'africart_data';
    this.priceHistoryKey = 'africart_price_history';
    this.wishlistKey = 'africart_wishlist';
    this.settingsKey = 'africart_settings';
    this.couponsKey = 'africart_coupons';
  }

  // ============================================
  // PRICE HISTORY MANAGEMENT
  // ============================================

  async savePriceHistory(productUrl, productData) {
    try {
      const history = await this.getPriceHistory();
      const productId = this.generateProductId(productUrl);
      
      const entry = {
        productId,
        url: productUrl,
        title: productData.title,
        store: productData.store,
        country: productData.country,
        currency: productData.currency,
        price: parseFloat(productData.price?.replace(/,/g, '') || '0'),
        originalPrice: parseFloat(productData.originalPrice?.replace(/,/g, '') || '0'),
        discount: productData.discount,
        image: productData.image,
        timestamp: Date.now(),
        date: new Date().toISOString()
      };

      if (!history[productId]) {
        history[productId] = {
          product: {
            title: productData.title,
            image: productData.image,
            store: productData.store,
            country: productData.country
          },
          history: []
        };
      }

      // Only save if price changed (avoid duplicates)
      const lastEntry = history[productId].history[history[productId].history.length - 1];
      if (!lastEntry || lastEntry.price !== entry.price) {
        history[productId].history.push(entry);
        
        // Keep only last 30 days of history
        const thirtyDaysAgo = Date.now() - (30 * 24 * 60 * 60 * 1000);
        history[productId].history = history[productId].history.filter(
          h => h.timestamp > thirtyDaysAgo
        );
        
        await chrome.storage.local.set({ [this.priceHistoryKey]: history });
        
        // Check for price drops
        await this.checkPriceDrop(productId, entry, lastEntry);
      }

      return entry;
    } catch (error) {
      console.error('[AfriCart Storage] Error saving price history:', error);
      return null;
    }
  }

  async getPriceHistory(productUrl = null) {
    try {
      const result = await chrome.storage.local.get([this.priceHistoryKey]);
      const history = result[this.priceHistoryKey] || {};
      
      if (productUrl) {
        const productId = this.generateProductId(productUrl);
        return history[productId] || null;
      }
      
      return history;
    } catch (error) {
      console.error('[AfriCart Storage] Error getting price history:', error);
      return {};
    }
  }

  async getPriceTrend(productUrl) {
    try {
      const productHistory = await this.getPriceHistory(productUrl);
      if (!productHistory || !productHistory.history || productHistory.history.length < 2) {
        return null;
      }

      const history = productHistory.history;
      const currentPrice = history[history.length - 1].price;
      const previousPrices = history.slice(0, -1).map(h => h.price);
      const lowestPrice = Math.min(...previousPrices, currentPrice);
      const highestPrice = Math.max(...previousPrices, currentPrice);
      const averagePrice = previousPrices.reduce((a, b) => a + b, 0) / previousPrices.length;

      const trend = {
        current: currentPrice,
        lowest: lowestPrice,
        highest: highestPrice,
        average: averagePrice,
        change: currentPrice - (history[history.length - 2]?.price || currentPrice),
        changePercent: ((currentPrice - (history[history.length - 2]?.price || currentPrice)) / (history[history.length - 2]?.price || currentPrice) * 100).toFixed(1),
        isGoodDeal: currentPrice <= averagePrice * 0.95, // 5% below average = good deal
        daysTracked: history.length,
        firstSeen: history[0].date,
        lastSeen: history[history.length - 1].date
      };

      return trend;
    } catch (error) {
      console.error('[AfriCart Storage] Error getting price trend:', error);
      return null;
    }
  }

  async checkPriceDrop(productId, currentEntry, previousEntry) {
    if (!previousEntry) return;

    const priceDrop = previousEntry.price - currentEntry.price;
    const dropPercent = (priceDrop / previousEntry.price * 100).toFixed(1);

    // Only alert if significant drop (5% or more)
    if (priceDrop > 0 && dropPercent >= 5) {
      await this.triggerPriceDropAlert(productId, currentEntry, previousEntry, priceDrop, dropPercent);
    }
  }

  async triggerPriceDropAlert(productId, currentEntry, previousEntry, priceDrop, dropPercent) {
    try {
      // Store alert for background.js to show notification
      const alerts = await chrome.storage.local.get(['africart_price_alerts']);
      const priceAlerts = alerts.africart_price_alerts || [];
      
      priceAlerts.push({
        productId,
        productTitle: currentEntry.title,
        store: currentEntry.store,
        currency: currentEntry.currency,
        oldPrice: previousEntry.price,
        newPrice: currentEntry.price,
        drop: priceDrop,
        dropPercent,
        timestamp: Date.now()
      });

      // Keep only last 10 alerts
      if (priceAlerts.length > 10) {
        priceAlerts.shift();
      }

      await chrome.storage.local.set({ africart_price_alerts: priceAlerts });
      
      // Send message to background to show notification
      chrome.runtime.sendMessage({
        action: 'priceDrop',
        data: {
          productId,
          productTitle: currentEntry.title,
          store: currentEntry.store,
          currency: currentEntry.currency,
          oldPrice: previousEntry.price,
          newPrice: currentEntry.price,
          drop: priceDrop,
          dropPercent
        }
      });
    } catch (error) {
      console.error('[AfriCart Storage] Error triggering price drop alert:', error);
    }
  }

  // ============================================
  // WISHLIST MANAGEMENT
  // ============================================

  async addToWishlist(productData) {
    try {
      const wishlist = await this.getWishlist();
      const productId = this.generateProductId(productData.url);
      
      wishlist[productId] = {
        ...productData,
        addedAt: Date.now(),
        addedDate: new Date().toISOString()
      };

      await chrome.storage.local.set({ [this.wishlistKey]: wishlist });
      return true;
    } catch (error) {
      console.error('[AfriCart Storage] Error adding to wishlist:', error);
      return false;
    }
  }

  async removeFromWishlist(productUrl) {
    try {
      const wishlist = await this.getWishlist();
      const productId = this.generateProductId(productUrl);
      delete wishlist[productId];
      await chrome.storage.local.set({ [this.wishlistKey]: wishlist });
      return true;
    } catch (error) {
      console.error('[AfriCart Storage] Error removing from wishlist:', error);
      return false;
    }
  }

  async getWishlist() {
    try {
      const result = await chrome.storage.local.get([this.wishlistKey]);
      return result[this.wishlistKey] || {};
    } catch (error) {
      console.error('[AfriCart Storage] Error getting wishlist:', error);
      return {};
    }
  }

  async isInWishlist(productUrl) {
    try {
      const wishlist = await this.getWishlist();
      const productId = this.generateProductId(productUrl);
      return !!wishlist[productId];
    } catch (error) {
      return false;
    }
  }

  // ============================================
  // COUPON MANAGEMENT
  // ============================================

  async saveCoupon(store, couponCode, discount, expiry = null) {
    try {
      const coupons = await this.getCoupons();
      const couponId = `${store}_${couponCode}`.toLowerCase();
      
      coupons[couponId] = {
        store,
        code: couponCode,
        discount,
        expiry,
        foundAt: Date.now(),
        foundDate: new Date().toISOString(),
        used: false
      };

      await chrome.storage.local.set({ [this.couponsKey]: coupons });
      return true;
    } catch (error) {
      console.error('[AfriCart Storage] Error saving coupon:', error);
      return false;
    }
  }

  async getCoupons(store = null) {
    try {
      const result = await chrome.storage.local.get([this.couponsKey]);
      const coupons = result[this.couponsKey] || {};
      
      if (store) {
        return Object.values(coupons).filter(c => c.store.toLowerCase().includes(store.toLowerCase()));
      }
      
      return coupons;
    } catch (error) {
      console.error('[AfriCart Storage] Error getting coupons:', error);
      return {};
    }
  }

  async markCouponUsed(couponId) {
    try {
      const coupons = await this.getCoupons();
      if (coupons[couponId]) {
        coupons[couponId].used = true;
        coupons[couponId].usedAt = Date.now();
        await chrome.storage.local.set({ [this.couponsKey]: coupons });
      }
    } catch (error) {
      console.error('[AfriCart Storage] Error marking coupon as used:', error);
    }
  }

  // ============================================
  // SETTINGS MANAGEMENT
  // ============================================

  async saveSettings(settings) {
    try {
      const currentSettings = await this.getSettings();
      const updatedSettings = { ...currentSettings, ...settings };
      await chrome.storage.local.set({ [this.settingsKey]: updatedSettings });
      return true;
    } catch (error) {
      console.error('[AfriCart Storage] Error saving settings:', error);
      return false;
    }
  }

  async getSettings() {
    try {
      const result = await chrome.storage.local.get([this.settingsKey]);
      return result[this.settingsKey] || {
        userCountry: null,
        userRegion: null,
        currency: 'USD',
        notifications: true,
        priceAlerts: true,
        autoDetectCoupons: true
      };
    } catch (error) {
      console.error('[AfriCart Storage] Error getting settings:', error);
      return {};
    }
  }

  // ============================================
  // UTILITY FUNCTIONS
  // ============================================

  generateProductId(url) {
    try {
      const urlObj = new URL(url);
      // Use hostname + pathname as ID (removes query params)
      return `${urlObj.hostname}${urlObj.pathname}`.replace(/\/$/, '');
    } catch (error) {
      // Fallback to hash of URL
      return btoa(url).substring(0, 50);
    }
  }

  formatDate(timestamp) {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now - date;
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
    return `${Math.floor(diffDays / 30)} months ago`;
  }

  formatPrice(price, currency) {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency || 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 2
    }).format(price);
  }
}

// Export singleton instance
const africartStorage = new AfriCartStorage();

// Make available globally
if (typeof window !== 'undefined') {
  window.africartStorage = africartStorage;
}
