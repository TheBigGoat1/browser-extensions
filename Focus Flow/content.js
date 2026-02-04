// Default settings
const DEFAULT_SETTINGS = {
  enabled: true,
  hideSidebar: true,
  hideComments: true,
  hideHomeGrid: true,
  whitelistedChannels: [],
  blacklistedChannels: []
};

// Current settings
let currentSettings = { ...DEFAULT_SETTINGS };

// Load settings from storage
async function loadSettings() {
  try {
    const data = await chrome.storage.local.get(Object.keys(DEFAULT_SETTINGS));
    currentSettings = { ...DEFAULT_SETTINGS, ...data };
    return currentSettings;
  } catch (error) {
    console.error('[Focus Flow] Error loading settings:', error);
    return DEFAULT_SETTINGS;
  }
}

// Get current channel name from page
function getCurrentChannel() {
  try {
    // Try multiple methods to get channel name
    // Method 1: From channel link
    const channelLink = document.querySelector('ytd-channel-name a, ytd-video-owner-renderer a[href*="/channel/"], ytd-video-owner-renderer a[href*="/@"]');
    if (channelLink) {
      const href = channelLink.getAttribute('href');
      const match = href.match(/\/(?:channel|c|user|@)\/([^\/\?]+)/);
      if (match) {
        return match[1].toLowerCase();
      }
    }
    
    // Method 2: From URL
    const urlMatch = window.location.href.match(/youtube\.com\/(?:channel|c|user|@)\/([^\/\?]+)/);
    if (urlMatch) {
      return urlMatch[1].toLowerCase();
    }
    
    // Method 3: From meta tags
    const metaChannel = document.querySelector('meta[property="og:url"]');
    if (metaChannel) {
      const metaMatch = metaChannel.getAttribute('content').match(/\/(?:channel|c|user|@)\/([^\/\?]+)/);
      if (metaMatch) {
        return metaMatch[1].toLowerCase();
      }
    }
    
    return null;
  } catch (error) {
    console.error('[Focus Flow] Error getting channel:', error);
    return null;
  }
}

// Check if current channel should be exempted
function shouldExemptChannel() {
  const currentChannel = getCurrentChannel();
  if (!currentChannel) return false;
  
  const whitelist = currentSettings.whitelistedChannels || [];
  const blacklist = currentSettings.blacklistedChannels || [];
  
  // If whitelist exists and channel is not in it, exempt (don't hide)
  if (whitelist.length > 0) {
    return whitelist.includes(currentChannel);
  }
  
  // If blacklist exists and channel is in it, don't exempt (hide)
  if (blacklist.length > 0) {
    return !blacklist.includes(currentChannel);
  }
  
  // No lists configured, apply normally
  return true;
}

// Apply hiding rules based on settings
function applyHidingRules() {
  if (!currentSettings.enabled) {
    // If disabled, show everything
    showAll();
    return;
  }

  // Check channel whitelist/blacklist
  const shouldApply = shouldExemptChannel();
  if (!shouldApply && (currentSettings.whitelistedChannels?.length > 0 || currentSettings.blacklistedChannels?.length > 0)) {
    // Channel is exempted, show everything
    showAll();
    return;
  }

  try {
    // Hide sidebar if enabled
    if (currentSettings.hideSidebar) {
      hideElement('#secondary');
      hideElement('ytd-watch-next-secondary-results-renderer');
      hideElement('#related');
    } else {
      showElement('#secondary');
      showElement('ytd-watch-next-secondary-results-renderer');
      showElement('#related');
    }

    // Hide comments if enabled
    if (currentSettings.hideComments) {
      hideElement('#comments');
      hideElement('ytd-comments#comments');
      hideElement('#comment-teaser');
    } else {
      showElement('#comments');
      showElement('ytd-comments#comments');
      showElement('#comment-teaser');
    }

    // Hide home grid if enabled
    if (currentSettings.hideHomeGrid) {
      hideElement('ytd-rich-grid-renderer');
      hideElement('#contents.ytd-rich-grid-renderer');
    } else {
      showElement('ytd-rich-grid-renderer');
      showElement('#contents.ytd-rich-grid-renderer');
    }
  } catch (error) {
    console.error('[Focus Flow] Error applying hiding rules:', error);
  }
}

// Hide an element by selector
function hideElement(selector) {
  try {
    const elements = document.querySelectorAll(selector);
    elements.forEach(el => {
      if (el) {
        el.style.display = 'none';
        el.setAttribute('data-focus-flow-hidden', 'true');
      }
    });
  } catch (error) {
    // Silently fail if selector is invalid
  }
}

// Show an element by selector
function showElement(selector) {
  try {
    const elements = document.querySelectorAll(selector);
    elements.forEach(el => {
      if (el && el.getAttribute('data-focus-flow-hidden') === 'true') {
        el.style.display = '';
        el.removeAttribute('data-focus-flow-hidden');
      }
    });
  } catch (error) {
    // Silently fail if selector is invalid
  }
}

// Show all hidden elements
function showAll() {
  try {
    const hiddenElements = document.querySelectorAll('[data-focus-flow-hidden="true"]');
    hiddenElements.forEach(el => {
      el.style.display = '';
      el.removeAttribute('data-focus-flow-hidden');
    });
  } catch (error) {
    console.error('[Focus Flow] Error showing all:', error);
  }
}

// Main function to clean YouTube
async function cleanYouTube() {
  await loadSettings();
  applyHidingRules();
}

// MutationObserver to watch for dynamic content
let observer = null;

function startObserver() {
  if (observer) {
    observer.disconnect();
  }

  observer = new MutationObserver((mutations) => {
    // Debounce: only run after mutations settle
    clearTimeout(observer.timeout);
    observer.timeout = setTimeout(() => {
      applyHidingRules();
    }, 100);
  });

  try {
    observer.observe(document.body, {
      childList: true,
      subtree: true,
      attributes: false
    });
  } catch (error) {
    console.error('[Focus Flow] Error starting observer:', error);
  }
}

// Listen for messages from popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'updateSettings') {
    currentSettings = { ...DEFAULT_SETTINGS, ...request.settings };
    applyHidingRules();
    sendResponse({ success: true });
  }
  return true; // Keep message channel open for async response
});

// Initialize when page loads
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', async () => {
    await cleanYouTube();
    startObserver();
  });
} else {
  cleanYouTube();
  startObserver();
}

// Re-run when navigating (YouTube is a SPA)
let lastUrl = location.href;
new MutationObserver(() => {
  const url = location.href;
  if (url !== lastUrl) {
    lastUrl = url;
    cleanYouTube();
  }
}).observe(document, { subtree: true, childList: true });
