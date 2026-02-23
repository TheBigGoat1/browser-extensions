// AfriCart - Options Page Script

const DEFAULT_SETTINGS = {
  enabled: true,
  showFlags: true,
  openInNewTab: true,
  affiliateEnabled: false,
  preferredCountry: 'auto',
  locale: 'en'
};

async function loadSettings() {
  try {
    const data = await chrome.storage.local.get(['openInNewTab', 'showFlags', 'affiliateEnabled', 'locale']);
    
    document.getElementById('openInNewTab').checked = data.openInNewTab !== false;
    document.getElementById('showFlags').checked = data.showFlags !== false;
    document.getElementById('affiliateEnabled').checked = data.affiliateEnabled === true;
    const localeEl = document.getElementById('locale');
    if (localeEl && data.locale) localeEl.value = ['en', 'fr', 'es'].includes(data.locale) ? data.locale : 'en';
    
    await loadStats();
  } catch (error) {
    console.error('[AfriCart] Error loading settings:', error);
  }
}

// Load statistics
async function loadStats() {
  try {
    const stats = await chrome.storage.local.get(['usageStats']);
    const usage = stats.usageStats || { totalHops: 0, lastHop: null };
    
    document.getElementById('totalHops').textContent = usage.totalHops || 0;
    
    if (usage.lastHop) {
      const lastHopDate = new Date(usage.lastHop);
      const now = new Date();
      const diffMs = now - lastHopDate;
      const diffMins = Math.floor(diffMs / 60000);
      const diffHours = Math.floor(diffMs / 3600000);
      const diffDays = Math.floor(diffMs / 86400000);
      
      let timeAgo = 'Just now';
      if (diffDays > 0) {
        timeAgo = `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
      } else if (diffHours > 0) {
        timeAgo = `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
      } else if (diffMins > 0) {
        timeAgo = `${diffMins} minute${diffMins > 1 ? 's' : ''} ago`;
      }
      
      document.getElementById('lastHop').textContent = timeAgo;
    } else {
      document.getElementById('lastHop').textContent = 'Never';
    }
  } catch (error) {
    console.error('[AfriCart] Error loading stats:', error);
  }
}

// Save settings
async function saveSettings() {
  try {
    const localeEl = document.getElementById('locale');
    await chrome.storage.local.set({
      openInNewTab: document.getElementById('openInNewTab').checked,
      showFlags: document.getElementById('showFlags').checked,
      affiliateEnabled: document.getElementById('affiliateEnabled').checked,
      locale: localeEl && ['en', 'fr', 'es'].includes(localeEl.value) ? localeEl.value : 'en'
    });
    
    showSuccess();
  } catch (error) {
    console.error('[AfriCart] Error saving settings:', error);
    alert('Error saving settings. Please try again.');
  }
}

// Reset settings
async function resetSettings() {
  if (confirm('Reset all settings to defaults?')) {
    await chrome.storage.local.set(DEFAULT_SETTINGS);
    loadSettings();
    showSuccess();
  }
}

// Show success message
function showSuccess() {
  const message = document.getElementById('successMessage');
  message.style.display = 'block';
  setTimeout(() => {
    message.style.display = 'none';
  }, 3000);
}

// Event listeners
document.getElementById('saveBtn').addEventListener('click', saveSettings);
document.getElementById('resetBtn').addEventListener('click', resetSettings);

// Load on init
loadSettings();

// Refresh stats every 5 seconds
setInterval(loadStats, 5000);
