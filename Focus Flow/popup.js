// Default settings
const DEFAULT_SETTINGS = {
  enabled: true,
  hideSidebar: true,
  hideComments: true,
  hideHomeGrid: true,
  whitelistedChannels: [],
  blacklistedChannels: []
};

// Load settings from storage
async function loadSettings() {
  try {
    const data = await chrome.storage.local.get(Object.keys(DEFAULT_SETTINGS));
    return { ...DEFAULT_SETTINGS, ...data };
  } catch (error) {
    console.error('Error loading settings:', error);
    return DEFAULT_SETTINGS;
  }
}

// Save settings to storage
async function saveSettings(settings) {
  try {
    await chrome.storage.local.set(settings);
    updateStatus(settings.enabled);
  } catch (error) {
    console.error('Error saving settings:', error);
  }
}

// Extract channel name from URL or text
function extractChannelName(input) {
  if (!input || !input.trim()) return null;
  
  const trimmed = input.trim();
  
  // Check if it's a YouTube URL
  const urlPatterns = [
    /youtube\.com\/channel\/([^\/\?]+)/,
    /youtube\.com\/c\/([^\/\?]+)/,
    /youtube\.com\/user\/([^\/\?]+)/,
    /youtube\.com\/@([^\/\?]+)/
  ];
  
  for (const pattern of urlPatterns) {
    const match = trimmed.match(pattern);
    if (match) {
      return match[1].toLowerCase();
    }
  }
  
  // If it's just text, return as is (lowercase for consistency)
  return trimmed.toLowerCase();
}

// Update status indicator
function updateStatus(enabled) {
  const statusEl = document.getElementById('status');
  if (enabled) {
    statusEl.textContent = '✓ Active';
    statusEl.className = 'status active';
  } else {
    statusEl.textContent = '○ Inactive';
    statusEl.className = 'status inactive';
  }
}

// Update channel lists display
function updateChannelLists(whitelist, blacklist) {
  const whitelistEl = document.getElementById('whitelistDisplay');
  const blacklistEl = document.getElementById('blacklistDisplay');
  
  if (whitelist.length === 0 && blacklist.length === 0) {
    whitelistEl.innerHTML = '<div style="color: #909090; font-size: 10px;">No channels added</div>';
    blacklistEl.innerHTML = '';
    return;
  }
  
  if (whitelist.length > 0) {
    whitelistEl.innerHTML = '<div style="color: #4caf50; font-weight: 500; margin-bottom: 4px; font-size: 10px;">Whitelisted:</div>' +
      whitelist.map((channel, idx) => `
        <div class="channel-item">
          <span>${channel}</span>
          <button class="remove" data-type="whitelist" data-index="${idx}">×</button>
        </div>
      `).join('');
  } else {
    whitelistEl.innerHTML = '';
  }
  
  if (blacklist.length > 0) {
    blacklistEl.innerHTML = '<div style="color: #f44336; font-weight: 500; margin-bottom: 4px; font-size: 10px;">Blacklisted:</div>' +
      blacklist.map((channel, idx) => `
        <div class="channel-item">
          <span>${channel}</span>
          <button class="remove" data-type="blacklist" data-index="${idx}">×</button>
        </div>
      `).join('');
  } else {
    blacklistEl.innerHTML = '';
  }
  
  // Add event listeners to remove buttons
  document.querySelectorAll('.channel-item .remove').forEach(btn => {
    btn.addEventListener('click', async (e) => {
      const type = e.target.getAttribute('data-type');
      const index = parseInt(e.target.getAttribute('data-index'));
      const settings = await loadSettings();
      
      if (type === 'whitelist') {
        settings.whitelistedChannels.splice(index, 1);
      } else {
        settings.blacklistedChannels.splice(index, 1);
      }
      
      await saveSettings(settings);
      
      // Track analytics
      if (type === 'whitelist') {
        trackChannelListChange('whitelist', settings.whitelistedChannels.length);
      } else {
        trackChannelListChange('blacklist', settings.blacklistedChannels.length);
      }
      
      updateChannelLists(settings.whitelistedChannels, settings.blacklistedChannels);
      notifyContentScript(settings);
    });
  });
}

// Update UI from settings
function updateUI(settings) {
  document.getElementById('toggleEnabled').checked = settings.enabled;
  document.getElementById('toggleSidebar').checked = settings.hideSidebar;
  document.getElementById('toggleComments').checked = settings.hideComments;
  document.getElementById('toggleHomeGrid').checked = settings.hideHomeGrid;
  
  // Disable individual toggles if master switch is off
  const individualToggles = ['toggleSidebar', 'toggleComments', 'toggleHomeGrid'];
  individualToggles.forEach(id => {
    document.getElementById(id).disabled = !settings.enabled;
  });
  
  updateStatus(settings.enabled);
  updateChannelLists(
    settings.whitelistedChannels || [],
    settings.blacklistedChannels || []
  );
}

// Initialize popup
async function init() {
  const settings = await loadSettings();
  updateUI(settings);

  // Master toggle
  document.getElementById('toggleEnabled').addEventListener('change', async (e) => {
    const newSettings = { ...settings, enabled: e.target.checked };
    await saveSettings(newSettings);
    updateUI(newSettings);
    
    // Notify content script
    try {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      if (tab.url?.includes('youtube.com')) {
        chrome.tabs.sendMessage(tab.id, { action: 'updateSettings', settings: newSettings });
      }
    } catch (error) {
      console.error('Error notifying content script:', error);
    }
  });

  // Individual toggles
  document.getElementById('toggleSidebar').addEventListener('change', async (e) => {
    const newSettings = { ...settings, hideSidebar: e.target.checked };
    await saveSettings(newSettings);
    updateUI(newSettings);
    notifyContentScript(newSettings);
  });

  document.getElementById('toggleComments').addEventListener('change', async (e) => {
    const newSettings = { ...settings, hideComments: e.target.checked };
    await saveSettings(newSettings);
    updateUI(newSettings);
    notifyContentScript(newSettings);
  });

  document.getElementById('toggleHomeGrid').addEventListener('change', async (e) => {
    const newSettings = { ...settings, hideHomeGrid: e.target.checked };
    await saveSettings(newSettings);
    updateUI(newSettings);
    notifyContentScript(newSettings);
  });

  // Channel management
  const channelInput = document.getElementById('channelInput');
  
  document.getElementById('addWhitelist').addEventListener('click', async () => {
    const channelName = extractChannelName(channelInput.value);
    if (!channelName) {
      alert('Please enter a valid channel name or URL');
      return;
    }
    
    const currentSettings = await loadSettings();
    const whitelist = currentSettings.whitelistedChannels || [];
    
    if (whitelist.includes(channelName)) {
      alert('Channel already in whitelist');
      return;
    }
    
    whitelist.push(channelName);
    const newSettings = { ...currentSettings, whitelistedChannels: whitelist };
    await saveSettings(newSettings);
    
    // Track analytics
    trackChannelListChange('whitelist', whitelist.length);
    
    updateUI(newSettings);
    notifyContentScript(newSettings);
    channelInput.value = '';
  });
  
  document.getElementById('addBlacklist').addEventListener('click', async () => {
    const channelName = extractChannelName(channelInput.value);
    if (!channelName) {
      alert('Please enter a valid channel name or URL');
      return;
    }
    
    const currentSettings = await loadSettings();
    const blacklist = currentSettings.blacklistedChannels || [];
    
    if (blacklist.includes(channelName)) {
      alert('Channel already in blacklist');
      return;
    }
    
    blacklist.push(channelName);
    const newSettings = { ...currentSettings, blacklistedChannels: blacklist };
    await saveSettings(newSettings);
    
    // Track analytics
    trackChannelListChange('blacklist', blacklist.length);
    
    updateUI(newSettings);
    notifyContentScript(newSettings);
    channelInput.value = '';
  });
  
  // Allow Enter key to add to whitelist
  channelInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
      document.getElementById('addWhitelist').click();
    }
  });
}

// Notify content script of settings change
async function notifyContentScript(settings) {
  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (tab.url?.includes('youtube.com')) {
      chrome.tabs.sendMessage(tab.id, { action: 'updateSettings', settings });
    }
  } catch (error) {
    // Content script might not be loaded yet, that's okay
    console.log('Content script not ready:', error);
  }
}

// Analytics tracking functions
const ANALYTICS_KEY = 'focusFlowAnalytics';

function trackChannelListChange(type, count) {
  chrome.storage.local.get([ANALYTICS_KEY], (result) => {
    const analytics = result[ANALYTICS_KEY] || {};
    if (type === 'whitelist') {
      analytics.channelsWhitelisted = count;
    } else if (type === 'blacklist') {
      analytics.channelsBlacklisted = count;
    }
    analytics.lastActiveDate = Date.now();
    chrome.storage.local.set({ [ANALYTICS_KEY]: analytics });
  });
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
