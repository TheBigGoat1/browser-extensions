// Options page script

// Load settings
async function loadSettings() {
  const data = await chrome.storage.local.get(['downloadService', 'downloadQuality']);
  
  if (data.downloadService) {
    document.getElementById('defaultService').value = data.downloadService;
  }
  
  if (data.downloadQuality) {
    document.getElementById('defaultQuality').value = data.downloadQuality;
  }
}

// Save settings
async function saveSettings() {
  const service = document.getElementById('defaultService').value;
  const quality = document.getElementById('defaultQuality').value;
  
  await chrome.storage.local.set({
    downloadService: service,
    downloadQuality: quality
  });
  
  alert('Settings saved!');
}

// Reset button
document.getElementById('resetBtn').addEventListener('click', async () => {
  if (confirm('Reset all settings to defaults?')) {
    await chrome.storage.local.set({
      downloadService: 'youtubepp',
      downloadQuality: 'best'
    });
    loadSettings();
    alert('Settings reset!');
  }
});

// Save on change
document.getElementById('defaultService').addEventListener('change', saveSettings);
document.getElementById('defaultQuality').addEventListener('change', saveSettings);

// Initialize
loadSettings();
