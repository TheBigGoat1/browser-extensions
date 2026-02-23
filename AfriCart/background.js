// AfriCart - Background Service Worker
// Handles extension lifecycle and cross-tab communication

// Initialize extension
chrome.runtime.onInstalled.addListener((details) => {
  if (details.reason === 'install') {
    chrome.storage.local.set({
      enabled: true,
      showFlags: true,
      openInNewTab: true,
      affiliateEnabled: false,
      preferredCountry: 'auto',
      locale: 'auto'
    });
  }
});

// Handle side panel opening
chrome.action.onClicked.addListener((tab) => {
  chrome.sidePanel.open({ windowId: tab.windowId });
});

// Handle keyboard shortcut
chrome.commands.onCommand.addListener((command) => {
  if (command === 'toggle-sidepanel') {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs[0]) {
        chrome.sidePanel.open({ windowId: tabs[0].windowId });
      }
    });
  }
});

// Listen for messages
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'pageChanged') {
    // Notify side panel of page change
    chrome.runtime.sendMessage({
      action: 'pageChanged',
      url: request.url
    }).catch(() => {});
    sendResponse({ success: true });
  }
  return true;
});

// Track usage analytics (for dashboard, stats by date, and activity log)
async function trackUsage(action, store) {
  try {
    const key = 'usageStats';
    const dateKey = 'statsByDate';
    const analytics = await chrome.storage.local.get([key, dateKey, 'activityLog']);
    const stats = analytics[key] || { totalHops: 0, hopsByStore: {}, lastHop: null };
    const byDate = analytics[dateKey] || {};

    stats.totalHops++;
    stats.hopsByStore[store] = (stats.hopsByStore[store] || 0) + 1;
    stats.lastHop = Date.now();

    const today = new Date().toISOString().slice(0, 10);
    if (!byDate[today]) byDate[today] = { count: 0, stores: {} };
    byDate[today].count++;
    byDate[today].stores[store] = (byDate[today].stores[store] || 0) + 1;

    const activityLog = analytics.activityLog || [];
    activityLog.unshift({
      ts: Date.now(),
      level: 'info',
      message: 'Price comparison opened',
      store: store,
    });
    const trimmed = activityLog.slice(0, 100);
    await chrome.storage.local.set({ [key]: stats, [dateKey]: byDate, activityLog: trimmed });
  } catch (error) {
    console.error('[AfriCart] Error tracking usage:', error);
  }
}

// Advanced: Price Drop Alerts with Rich Notifications
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'priceDrop') {
    const { productTitle, store, currency, oldPrice, newPrice, drop, dropPercent } = request.data;
    
    // Format price
    const formatPrice = (price, curr) => {
      return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: curr || 'USD',
        minimumFractionDigits: 0
      }).format(price);
    };
    
    // Show rich notification
    chrome.notifications.create({
      type: 'basic',
      iconUrl: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDgiIGhlaWdodD0iNDgiIHZpZXdCb3g9IjAgMCA0OCA0OCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHBhdGggZD0iTTI0IDBDMTAuNzQ1IDAgMCAxMC43NDUgMCAyNFMxMC43NDUgNDggMjQgNDhTMzggMzcuMjU1IDM4IDI0UzM3LjI1NSAwIDI0IDBaIiBmaWxsPSIjMDA2NkZGIi8+CjxwYXRoIGQ9Ik0yNCAxMkMxNy4zNzMgMTIgMTIgMTcuMzczIDEyIDI0UzE3LjM3MyAzNiAyNCAzNlMzNiAzMC42MjcgMzYgMjRTMzAuNjI3IDEyIDI0IDEyWiIgZmlsbD0id2hpdGUiLz4KPC9zdmc+',
      title: '💰 Price Drop Detected!',
      message: `${productTitle.substring(0, 40)}...\n${formatPrice(oldPrice, currency)} → ${formatPrice(newPrice, currency)} (${dropPercent}% off)`,
      buttons: [
        { title: 'View Product' },
        { title: 'Dismiss' }
      ],
      requireInteraction: false
    }, (notificationId) => {
      // Handle notification click
      chrome.notifications.onButtonClicked.addListener((id, buttonIndex) => {
        if (id === notificationId && buttonIndex === 0) {
          // Open product page
          chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
            if (tabs[0]) {
              chrome.tabs.update(tabs[0].id, { url: request.data.url });
            }
          });
        }
        chrome.notifications.clear(id);
      });
      
      chrome.notifications.onClicked.addListener((id) => {
        if (id === notificationId) {
          chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
            if (tabs[0]) {
              chrome.sidePanel.open({ windowId: tabs[0].windowId });
            }
          });
        }
      });
    }).catch(() => {});
    
    sendResponse({ success: true });
    return true;
  }
  
  if (request.action === 'trackHop') {
    trackUsage('hop', request.store)
      .then(() => sendResponse({ success: true }))
      .catch(() => sendResponse({ success: false }));
    return true;
  }
  
  return true;
});

// v1.5: Periodic price checking (runs every 6 hours)
chrome.alarms.create('checkPrices', { periodInMinutes: 360 });
chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name === 'checkPrices') {
    // Check prices for wishlist items
    checkWishlistPrices();
  }
});

async function checkWishlistPrices() {
  const wishlistData = await chrome.storage.local.get(['wishlist']);
  const wishlist = wishlistData.wishlist || [];
  
  // This would require background price checking - simplified for now
  // In production, this would fetch prices from APIs
}
