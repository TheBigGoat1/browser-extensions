// Background service worker for Focus Flow
// Handles extension lifecycle, updates, keyboard shortcuts, and analytics

// Analytics functions (inline since importScripts may not work in all contexts)
const ANALYTICS_KEY = 'focusFlowAnalytics';

function initAnalytics() {
  chrome.storage.local.get([ANALYTICS_KEY], (result) => {
    if (!result[ANALYTICS_KEY]) {
      chrome.storage.local.set({
        [ANALYTICS_KEY]: {
          installDate: Date.now(),
          totalSessions: 0,
          totalTimeActive: 0,
          featuresUsed: {
            hideSidebar: 0,
            hideComments: 0,
            hideHomeGrid: 0
          },
          togglesCount: 0,
          channelsWhitelisted: 0,
          channelsBlacklisted: 0,
          lastActiveDate: null
        }
      });
    }
  });
}

function trackFeature(featureName) {
  chrome.storage.local.get([ANALYTICS_KEY], (result) => {
    const analytics = result[ANALYTICS_KEY] || {};
    if (!analytics.featuresUsed) {
      analytics.featuresUsed = {};
    }
    analytics.featuresUsed[featureName] = (analytics.featuresUsed[featureName] || 0) + 1;
    analytics.lastActiveDate = Date.now();
    chrome.storage.local.set({ [ANALYTICS_KEY]: analytics });
  });
}

function trackToggle() {
  chrome.storage.local.get([ANALYTICS_KEY], (result) => {
    const analytics = result[ANALYTICS_KEY] || {};
    analytics.togglesCount = (analytics.togglesCount || 0) + 1;
    analytics.lastActiveDate = Date.now();
    chrome.storage.local.set({ [ANALYTICS_KEY]: analytics });
  });
}

function trackSessionStart() {
  chrome.storage.local.get([ANALYTICS_KEY], (result) => {
    const analytics = result[ANALYTICS_KEY] || {};
    analytics.totalSessions = (analytics.totalSessions || 0) + 1;
    analytics.sessionStartTime = Date.now();
    chrome.storage.local.set({ [ANALYTICS_KEY]: analytics });
  });
}

function trackChannelListChange(type, count) {
  chrome.storage.local.get([ANALYTICS_KEY], (result) => {
    const analytics = result[ANALYTICS_KEY] || {};
    if (type === 'whitelist') {
      analytics.channelsWhitelisted = count;
    } else if (type === 'blacklist') {
      analytics.channelsBlacklisted = count;
    }
    chrome.storage.local.set({ [ANALYTICS_KEY]: analytics });
  });
}

const CURRENT_VERSION = '1.0.0';

// Initialize analytics on install
initAnalytics();

// Listen for extension installation and updates
chrome.runtime.onInstalled.addListener((details) => {
  if (details.reason === 'install') {
    // Set default settings on first install
    chrome.storage.local.set({
      enabled: true,
      hideSidebar: true,
      hideComments: true,
      hideHomeGrid: true,
      whitelistedChannels: [],
      blacklistedChannels: [],
      lastVersion: CURRENT_VERSION
    });
    
    // Track installation
    trackSessionStart();
    
    // Show welcome notification (optional)
    if (chrome.notifications) {
      // Create a minimal icon data URL (1x1 red pixel)
      const iconDataUrl = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8DwHwAFBQIAX8jx0gAAAABJRU5ErkJggg==';
      
      chrome.notifications.create({
        type: 'basic',
        iconUrl: iconDataUrl,
        title: 'Focus Flow Installed!',
        message: 'Click the extension icon to configure your settings.',
        priority: 1
      }).catch(() => {
        // Notification permission might not be granted, that's okay
      });
    }
    
  } else if (details.reason === 'update') {
    // Check if this is a version update
    chrome.storage.local.get(['lastVersion'], (result) => {
      const lastVersion = result.lastVersion || '0.0.0';
      
      if (lastVersion !== CURRENT_VERSION) {
        // Show update notification (optional)
        if (chrome.notifications) {
          const iconDataUrl = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8DwHwAFBQIAX8jx0gAAAABJRU5ErkJggg==';
          
          chrome.notifications.create({
            type: 'basic',
            iconUrl: iconDataUrl,
            title: 'Focus Flow Updated!',
            message: `Updated to version ${CURRENT_VERSION}. Check what's new!`,
            priority: 1
          }).catch(() => {
            // Notification permission might not be granted
          });
        }
        
        // Update stored version
        chrome.storage.local.set({ lastVersion: CURRENT_VERSION });
      }
    });
  }
});

// Handle keyboard shortcuts
chrome.commands.onCommand.addListener((command) => {
  chrome.storage.local.get(['enabled', 'hideSidebar', 'hideComments'], (data) => {
    const settings = {
      enabled: data.enabled !== false,
      hideSidebar: data.hideSidebar !== false,
      hideComments: data.hideComments !== false,
      hideHomeGrid: data.hideHomeGrid !== false
    };
    
    switch (command) {
      case 'toggle-extension':
        settings.enabled = !settings.enabled;
        chrome.storage.local.set({ enabled: settings.enabled });
        trackToggle();
        notifyAllTabs(settings);
        break;
        
      case 'toggle-sidebar':
        settings.hideSidebar = !settings.hideSidebar;
        chrome.storage.local.set({ hideSidebar: settings.hideSidebar });
        trackFeature('hideSidebar');
        trackToggle();
        notifyAllTabs(settings);
        break;
        
      case 'toggle-comments':
        settings.hideComments = !settings.hideComments;
        chrome.storage.local.set({ hideComments: settings.hideComments });
        trackFeature('hideComments');
        trackToggle();
        notifyAllTabs(settings);
        break;
    }
  });
});

// Notify all YouTube tabs of settings change
function notifyAllTabs(settings) {
  chrome.tabs.query({ url: '*://*.youtube.com/*' }, (tabs) => {
    tabs.forEach(tab => {
      chrome.tabs.sendMessage(tab.id, {
        action: 'updateSettings',
        settings: settings
      }).catch(() => {
        // Tab might not have content script loaded yet
      });
    });
  });
}

// Track tab updates for analytics
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.status === 'complete' && tab.url?.includes('youtube.com')) {
    trackSessionStart();
  }
});

// Track when extension is disabled/enabled
chrome.runtime.onStartup.addListener(() => {
  trackSessionStart();
});

// Track session end
function trackSessionEnd() {
  chrome.storage.local.get([ANALYTICS_KEY], (result) => {
    const analytics = result[ANALYTICS_KEY] || {};
    if (analytics.sessionStartTime) {
      const sessionDuration = Date.now() - analytics.sessionStartTime;
      analytics.totalTimeActive = (analytics.totalTimeActive || 0) + sessionDuration;
      delete analytics.sessionStartTime;
      chrome.storage.local.set({ [ANALYTICS_KEY]: analytics });
    }
  });
}

// Cleanup on shutdown
chrome.runtime.onSuspend.addListener(() => {
  trackSessionEnd();
});
