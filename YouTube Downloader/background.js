// Background service worker for YouTube Downloader Pro

const ANALYTICS_KEY = 'ytDownloaderAnalytics';

// Initialize analytics
function initAnalytics() {
  chrome.storage.local.get([ANALYTICS_KEY], (result) => {
    if (!result[ANALYTICS_KEY]) {
      chrome.storage.local.set({
        [ANALYTICS_KEY]: {
          installDate: Date.now(),
          totalDownloads: 0,
          downloadsByService: {},
          lastDownloadDate: null
        }
      });
    }
  });
}

// Track download
function trackDownload(videoInfo) {
  chrome.storage.local.get([ANALYTICS_KEY], (result) => {
    const analytics = result[ANALYTICS_KEY] || {};
    analytics.totalDownloads = (analytics.totalDownloads || 0) + 1;
    analytics.lastDownloadDate = Date.now();
    
    if (!analytics.downloadsByService) {
      analytics.downloadsByService = {};
    }
    
    const service = videoInfo.service || 'unknown';
    analytics.downloadsByService[service] = (analytics.downloadsByService[service] || 0) + 1;
    
    chrome.storage.local.set({ [ANALYTICS_KEY]: analytics });
  });
}

// Initialize on install
chrome.runtime.onInstalled.addListener((details) => {
  if (details.reason === 'install') {
    initAnalytics();
    chrome.storage.local.set({
      downloadService: 'youtubepp',
      downloadQuality: 'best'
    });
  }
});

// Handle keyboard shortcut
chrome.commands.onCommand.addListener((command) => {
  if (command === 'quick-download') {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs[0] && tabs[0].url?.includes('youtube.com/watch')) {
        // Trigger download button click via content script
        chrome.tabs.sendMessage(tabs[0].id, { action: 'triggerDownload' });
      }
    });
  }
});

// Listen for messages
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'trackDownload') {
    trackDownload(request.videoInfo);
    sendResponse({ success: true });
  }
  return true;
});
