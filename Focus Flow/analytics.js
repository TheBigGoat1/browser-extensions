// Analytics tracking for Focus Flow
// Tracks usage statistics locally (privacy-friendly)

const ANALYTICS_KEY = 'focusFlowAnalytics';

// Initialize analytics
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

// Track feature usage
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

// Track toggle action
function trackToggle() {
  chrome.storage.local.get([ANALYTICS_KEY], (result) => {
    const analytics = result[ANALYTICS_KEY] || {};
    analytics.togglesCount = (analytics.togglesCount || 0) + 1;
    analytics.lastActiveDate = Date.now();
    chrome.storage.local.set({ [ANALYTICS_KEY]: analytics });
  });
}

// Track session start
function trackSessionStart() {
  chrome.storage.local.get([ANALYTICS_KEY], (result) => {
    const analytics = result[ANALYTICS_KEY] || {};
    analytics.totalSessions = (analytics.totalSessions || 0) + 1;
    analytics.sessionStartTime = Date.now();
    chrome.storage.local.set({ [ANALYTICS_KEY]: analytics });
  });
}

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

// Track channel list changes
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

// Get analytics data
async function getAnalytics() {
  return new Promise((resolve) => {
    chrome.storage.local.get([ANALYTICS_KEY], (result) => {
      resolve(result[ANALYTICS_KEY] || {});
    });
  });
}

// Export for use in other files
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    initAnalytics,
    trackFeature,
    trackToggle,
    trackSessionStart,
    trackSessionEnd,
    trackChannelListChange,
    getAnalytics
  };
}
