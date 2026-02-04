// Popup script for YouTube Downloader Pro

// Load current video info
async function loadVideoInfo() {
  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    
    if (tab.url && tab.url.includes('youtube.com/watch')) {
      // Get video info from content script
      chrome.tabs.sendMessage(tab.id, { action: 'getVideoInfo' }, (response) => {
        if (response) {
          displayVideoInfo(response);
        } else {
          document.getElementById('videoInfo').innerHTML = 
            '<p style="color: #f00;">⚠️ Please navigate to a YouTube video page</p>';
        }
      });
    } else {
      document.getElementById('videoInfo').innerHTML = 
        '<p style="color: #f00;">⚠️ Please open a YouTube video</p>';
    }
  } catch (error) {
    console.error('Error loading video info:', error);
  }
}

// Display video information
function displayVideoInfo(info) {
  const videoInfoEl = document.getElementById('videoInfo');
  videoInfoEl.innerHTML = `
    <div class="video-card">
      <h3>${info.title || 'Unknown Video'}</h3>
      <p class="channel">📺 ${info.channel || 'Unknown Channel'}</p>
      <p class="video-id">ID: ${info.videoId || 'N/A'}</p>
    </div>
  `;
}

// Load settings
async function loadSettings() {
  const data = await chrome.storage.local.get(['downloadService', 'downloadQuality']);
  
  if (data.downloadService) {
    document.getElementById('downloadService').value = data.downloadService;
  }
  
  if (data.downloadQuality) {
    document.getElementById('downloadQuality').value = data.downloadQuality;
  }
}

// Save settings
async function saveSettings() {
  const service = document.getElementById('downloadService').value;
  const quality = document.getElementById('downloadQuality').value;
  
  await chrome.storage.local.set({
    downloadService: service,
    downloadQuality: quality
  });
}

// Get download service URL
function getServiceUrl(service, videoId, fullUrl) {
  const services = {
    youtubepp: `https://www.youtubepp.com/watch?v=${videoId}`,
    y2mate: `https://www.y2mate.com/en/search/${fullUrl}`,
    savefrom: `https://en.savefrom.net/#url=${fullUrl}`
  };
  return services[service] || services.youtubepp;
}

// Download button handler
document.getElementById('downloadBtn').addEventListener('click', async () => {
  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    
    if (tab.url && tab.url.includes('youtube.com/watch')) {
      chrome.tabs.sendMessage(tab.id, { action: 'getVideoInfo' }, async (response) => {
        if (response) {
          const service = document.getElementById('downloadService').value;
          const serviceUrl = getServiceUrl(service, response.videoId, response.url);
          
          await saveSettings();
          chrome.tabs.create({ url: serviceUrl });
          
          // Track download
          chrome.runtime.sendMessage({
            action: 'trackDownload',
            videoInfo: response
          });
        }
      });
    }
  } catch (error) {
    console.error('Download error:', error);
  }
});

// Audio only button
document.getElementById('downloadAudioBtn').addEventListener('click', async () => {
  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    
    if (tab.url && tab.url.includes('youtube.com/watch')) {
      chrome.tabs.sendMessage(tab.id, { action: 'getVideoInfo' }, async (response) => {
        if (response) {
          // Set quality to audio
          document.getElementById('downloadQuality').value = 'audio';
          await saveSettings();
          
          // Trigger download
          document.getElementById('downloadBtn').click();
        }
      });
    }
  } catch (error) {
    console.error('Audio download error:', error);
  }
});

// Copy link button
document.getElementById('copyLinkBtn').addEventListener('click', async () => {
  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    
    if (tab.url) {
      await navigator.clipboard.writeText(tab.url);
      const btn = document.getElementById('copyLinkBtn');
      const originalText = btn.textContent;
      btn.textContent = '✓ Copied!';
      setTimeout(() => {
        btn.textContent = originalText;
      }, 2000);
    }
  } catch (error) {
    console.error('Copy error:', error);
  }
});

// Open service button
document.getElementById('openServiceBtn').addEventListener('click', async () => {
  const service = document.getElementById('downloadService').value;
  const serviceUrls = {
    youtubepp: 'https://www.youtubepp.com',
    y2mate: 'https://www.y2mate.com',
    savefrom: 'https://en.savefrom.net'
  };
  
  chrome.tabs.create({ url: serviceUrls[service] || serviceUrls.youtubepp });
});

// Options link
document.getElementById('optionsLink').addEventListener('click', (e) => {
  e.preventDefault();
  chrome.runtime.openOptionsPage();
});

// Settings change handlers
document.getElementById('downloadService').addEventListener('change', saveSettings);
document.getElementById('downloadQuality').addEventListener('change', saveSettings);

// Initialize
loadVideoInfo();
loadSettings();

// Refresh video info every 2 seconds (in case user navigates)
setInterval(loadVideoInfo, 2000);
