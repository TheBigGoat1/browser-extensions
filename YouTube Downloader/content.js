// YouTube Downloader Pro - Content Script
// Handles download button injection and video information extraction

// Configuration
const CONFIG = {
  downloadButtonId: 'yt-downloader-btn',
  downloadServices: [
    {
      name: 'YouTubePP',
      url: 'https://www.youtubepp.com/watch?v=',
      enabled: true
    },
    {
      name: 'Y2Mate',
      url: 'https://www.y2mate.com/en/search/',
      enabled: false
    },
    {
      name: 'SaveFrom',
      url: 'https://en.savefrom.net/#url=',
      enabled: false
    }
  ]
};

// Get current video ID
function getVideoId() {
  const urlParams = new URLSearchParams(window.location.search);
  return urlParams.get('v') || null;
}

// Get current video URL
function getVideoUrl() {
  return window.location.href;
}

// Get video title
function getVideoTitle() {
  const titleElement = document.querySelector('h1.ytd-watch-metadata yt-formatted-string, h1.title yt-formatted-string, h1[class*="title"]');
  return titleElement ? titleElement.textContent.trim() : 'YouTube Video';
}

// Get channel name
function getChannelName() {
  const channelElement = document.querySelector('#channel-name a, ytd-channel-name a, #owner-sub-count a');
  return channelElement ? channelElement.textContent.trim() : 'Unknown Channel';
}

// Inject download button into action bar
function injectDownloadButton() {
  // Find the YouTube action bar (where Like/Share buttons live)
  const actionBar = document.querySelector('#top-level-buttons-computed, #menu-container, ytd-menu-renderer');
  
  // Alternative selectors if the above doesn't work
  const alternativeBars = [
    document.querySelector('#actions'),
    document.querySelector('.ytd-watch-flexy #top-level-buttons-computed'),
    document.querySelector('ytd-watch-metadata #menu-container')
  ];
  
  const targetBar = actionBar || alternativeBars.find(bar => bar !== null);
  
  // Prevent duplicate buttons
  if (targetBar && !document.getElementById(CONFIG.downloadButtonId)) {
    const videoId = getVideoId();
    if (!videoId) return; // Not on a video page
    
    // Create download button
    const dlBtn = document.createElement('button');
    dlBtn.id = CONFIG.downloadButtonId;
    dlBtn.className = 'yt-downloader-button';
    dlBtn.innerHTML = `
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
        <polyline points="7 10 12 15 17 10"></polyline>
        <line x1="12" y1="15" x2="12" y2="3"></line>
      </svg>
      <span>Download</span>
    `;
    
    // Style the button
    dlBtn.style.cssText = `
      display: inline-flex;
      align-items: center;
      gap: 6px;
      background-color: #f00;
      color: white;
      border: none;
      padding: 8px 16px;
      margin-left: 8px;
      border-radius: 18px;
      font-weight: 500;
      cursor: pointer;
      font-family: 'Roboto', 'Arial', sans-serif;
      font-size: 14px;
      transition: background-color 0.2s;
    `;
    
    // Hover effect
    dlBtn.onmouseenter = () => {
      dlBtn.style.backgroundColor = '#cc0000';
    };
    dlBtn.onmouseleave = () => {
      dlBtn.style.backgroundColor = '#f00';
    };
    
    // Click handler
    dlBtn.onclick = async (e) => {
      e.preventDefault();
      e.stopPropagation();
      
      // Get user's preferred download service
      const data = await chrome.storage.local.get(['downloadService', 'downloadQuality']);
      const service = data.downloadService || CONFIG.downloadServices[0];
      const quality = data.downloadQuality || 'best';
      
      // Get video info
      const videoInfo = {
        id: videoId,
        url: getVideoUrl(),
        title: getVideoTitle(),
        channel: getChannelName()
      };
      
      // Save video info for background script
      chrome.storage.local.set({ lastVideoInfo: videoInfo });
      
      // Open download service
      if (service.url.includes('youtubepp.com')) {
        window.open(`${service.url}${videoId}`, '_blank');
      } else if (service.url.includes('y2mate.com')) {
        window.open(`${service.url}${videoId}`, '_blank');
      } else if (service.url.includes('savefrom.net')) {
        window.open(`${service.url}${getVideoUrl()}`, '_blank');
      } else {
        // Default: open first enabled service
        const enabledService = CONFIG.downloadServices.find(s => s.enabled);
        if (enabledService) {
          window.open(`${enabledService.url}${videoId}`, '_blank');
        }
      }
      
      // Track download attempt
      chrome.runtime.sendMessage({
        action: 'trackDownload',
        videoInfo: videoInfo
      }).catch(() => {});
    };
    
    // Insert button
    targetBar.appendChild(dlBtn);
  }
}

// Inject download button in video player area (alternative location)
function injectPlayerDownloadButton() {
  const playerContainer = document.querySelector('#movie_player, ytd-player');
  if (playerContainer && !document.getElementById('yt-downloader-player-btn')) {
    const videoId = getVideoId();
    if (!videoId) return;
    
    // Create floating download button
    const floatingBtn = document.createElement('button');
    floatingBtn.id = 'yt-downloader-player-btn';
    floatingBtn.className = 'yt-downloader-floating';
    floatingBtn.innerHTML = '⬇ Download';
    floatingBtn.style.cssText = `
      position: absolute;
      top: 10px;
      right: 10px;
      background: rgba(0, 0, 0, 0.7);
      color: white;
      border: none;
      padding: 8px 12px;
      border-radius: 4px;
      cursor: pointer;
      z-index: 1000;
      font-size: 12px;
      font-weight: 500;
    `;
    
    floatingBtn.onclick = async () => {
      const data = await chrome.storage.local.get(['downloadService']);
      const service = data.downloadService || CONFIG.downloadServices[0];
      window.open(`${service.url}${videoId}`, '_blank');
    };
    
    playerContainer.style.position = 'relative';
    playerContainer.appendChild(floatingBtn);
  }
}

// Main injection function
function initializeDownloader() {
  // Only run on watch pages
  if (window.location.pathname.includes('/watch')) {
    injectDownloadButton();
    injectPlayerDownloadButton();
  }
}

// MutationObserver to handle dynamic content (YouTube is a SPA)
const observer = new MutationObserver(() => {
  initializeDownloader();
});

// Start observing
if (document.body) {
  initializeDownloader();
  observer.observe(document.body, {
    childList: true,
    subtree: true
  });
} else {
  document.addEventListener('DOMContentLoaded', () => {
    initializeDownloader();
    observer.observe(document.body, {
      childList: true,
      subtree: true
    });
  });
}

// Listen for navigation (YouTube SPA)
let lastUrl = location.href;
new MutationObserver(() => {
  const url = location.href;
  if (url !== lastUrl) {
    lastUrl = url;
    setTimeout(initializeDownloader, 1000); // Wait for page to load
  }
}).observe(document, { subtree: true, childList: true });

// Listen for messages from popup/background
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'getVideoInfo') {
    sendResponse({
      videoId: getVideoId(),
      url: getVideoUrl(),
      title: getVideoTitle(),
      channel: getChannelName()
    });
  }
  return true;
});
