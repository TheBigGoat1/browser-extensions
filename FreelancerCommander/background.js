/**
 * Freelancer Command Center Pro - Background Service Worker
 * The Watchtower Engine: Monitors Freelancer.com for new jobs
 */

// ============================================================================
// INITIALIZATION
// ============================================================================

chrome.runtime.onInstalled.addListener(() => {
  console.log('[CommandCenter] Extension installed/updated');
  
  // Create context menu for text selection
  chrome.contextMenus.create({
    id: 'sendToCommander',
    title: 'Send to AI Command Center',
    contexts: ['selection']
  });
  
  // Set up initial state
  chrome.storage.local.set({
    lastSelection: '',
    newJob: false,
    jobCount: 0,
    lastCheck: Date.now()
  });
});

// ============================================================================
// CONTEXT MENU HANDLER
// ============================================================================

chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (info.menuItemId === 'sendToCommander') {
    const selectedText = info.selectionText || '';
    
    // Save selection to storage
    chrome.storage.local.set({
      lastSelection: selectedText,
      lastSelectionTime: Date.now(),
      lastSelectionUrl: tab.url
    });
    
    // Open side panel
    chrome.sidePanel.open({ windowId: tab.windowId });
    
    // Show notification
    chrome.notifications.create({
      type: 'basic',
      iconUrl: 'freelance.png',
      title: 'Text Sent to Command Center',
      message: 'Selection saved. Open side panel to use AI prompts.',
      priority: 1
    });
    
    console.log('[CommandCenter] Selection sent to command center:', selectedText.substring(0, 50));
  }
});

// ============================================================================
// THE WATCHTOWER ENGINE - Ghost Monitoring
// ============================================================================

let monitoringInterval = null;
let lastJobCount = 0;
let lastJobHashes = new Set();

/**
 * Start monitoring Freelancer.com for new jobs
 */
function startMonitoring() {
  if (monitoringInterval) {
    return; // Already monitoring
  }
  
  console.log('[CommandCenter] Starting job monitoring...');
  
  monitoringInterval = setInterval(async () => {
    try {
      await checkForNewJobs();
    } catch (error) {
      console.error('[CommandCenter] Monitoring error:', error);
    }
  }, 30000); // Check every 30 seconds
}

/**
 * Stop monitoring
 */
function stopMonitoring() {
  if (monitoringInterval) {
    clearInterval(monitoringInterval);
    monitoringInterval = null;
    console.log('[CommandCenter] Monitoring stopped');
  }
}

/**
 * Check for new jobs on Freelancer.com
 */
async function checkForNewJobs() {
  try {
    // Find Freelancer tabs
    const tabs = await chrome.tabs.query({ 
      url: ['https://*.freelancer.com/*', 'https://www.freelancer.com/*'] 
    });
    
    if (tabs.length === 0) {
      return; // No Freelancer tabs open
    }
    
    // Check the first active Freelancer tab
    const tab = tabs[0];
    
    // Inject content script to check for jobs
    const results = await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      func: extractJobData
    });
    
    if (results && results[0] && results[0].result) {
      const jobData = results[0].result;
      const currentJobCount = jobData.jobCount;
      const currentJobHashes = new Set(jobData.jobHashes);
      
      // Compare with previous state
      if (currentJobCount > lastJobCount) {
        // New jobs detected!
        const newJobs = currentJobCount - lastJobCount;
        
        console.log(`[CommandCenter] ${newJobs} new job(s) detected!`);
        
        // Set new job flag
        chrome.storage.local.set({
          newJob: true,
          jobCount: currentJobCount,
          lastJobData: jobData,
          lastCheck: Date.now()
        });
        
        // Show notification
        chrome.notifications.create({
          type: 'basic',
          iconUrl: 'freelance.png',
          title: `${newJobs} New Job(s) Found!`,
          message: 'Click the side panel to generate your proposal.',
          priority: 2,
          requireInteraction: false
        });
        
        // Update state
        lastJobCount = currentJobCount;
        lastJobHashes = currentJobHashes;
      } else {
        // Update state without notification
        lastJobCount = currentJobCount;
        lastJobHashes = currentJobHashes;
        
        chrome.storage.local.set({
          jobCount: currentJobCount,
          lastCheck: Date.now()
        });
      }
    }
  } catch (error) {
    // Tab might not be accessible, ignore
    if (error.message && !error.message.includes('Cannot access')) {
      console.warn('[CommandCenter] Job check error:', error.message);
    }
  }
}

/**
 * Extract job data from Freelancer page
 * This function runs in the page context
 */
function extractJobData() {
  const jobs = [];
  const jobHashes = [];
  
  try {
    // Common Freelancer.com selectors (adapt based on actual site structure)
    const jobSelectors = [
      '.JobSearchCard-primary-card',
      '.JobSearchCard-item',
      '[data-job-id]',
      '.JobCard',
      '.project-item'
    ];
    
    let jobElements = [];
    
    // Try each selector
    for (const selector of jobSelectors) {
      jobElements = document.querySelectorAll(selector);
      if (jobElements.length > 0) {
        break; // Found jobs with this selector
      }
    }
    
    // Extract job data
    jobElements.forEach((element, index) => {
      try {
        const title = element.querySelector('h3, .JobSearchCard-item-title, .project-title')?.textContent?.trim() || '';
        const description = element.querySelector('.JobSearchCard-item-description, .project-description')?.textContent?.trim() || '';
        const budget = element.querySelector('.JobSearchCard-item-price, .project-budget')?.textContent?.trim() || '';
        const link = element.querySelector('a')?.href || '';
        
        if (title || description) {
          // Create hash for job identification
          const jobHash = btoa(title + description).substring(0, 20);
          jobHashes.push(jobHash);
          
          jobs.push({
            index: index,
            title: title,
            description: description.substring(0, 200), // Limit description length
            budget: budget,
            link: link,
            hash: jobHash
          });
        }
      } catch (e) {
        // Skip invalid elements
      }
    });
    
    return {
      jobCount: jobs.length,
      jobs: jobs,
      jobHashes: jobHashes,
      timestamp: Date.now()
    };
  } catch (error) {
    console.error('[CommandCenter] Error extracting jobs:', error);
    return {
      jobCount: 0,
      jobs: [],
      jobHashes: [],
      timestamp: Date.now(),
      error: error.message
    };
  }
}

// ============================================================================
// TAB MONITORING
// ============================================================================

// Start monitoring when Freelancer tab is active
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.status === 'complete' && tab.url && tab.url.includes('freelancer.com')) {
    // Delay to ensure page is fully loaded
    setTimeout(() => {
      checkForNewJobs();
    }, 2000);
  }
});

// Start monitoring when Freelancer tab is activated
chrome.tabs.onActivated.addListener(async (activeInfo) => {
  try {
    const tab = await chrome.tabs.get(activeInfo.tabId);
    if (tab.url && tab.url.includes('freelancer.com')) {
      checkForNewJobs();
    }
  } catch (error) {
    // Ignore errors
  }
});

// ============================================================================
// MESSAGE HANDLER
// ============================================================================

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  switch (message.action) {
    case 'startMonitoring':
      startMonitoring();
      sendResponse({ success: true });
      break;
      
    case 'stopMonitoring':
      stopMonitoring();
      sendResponse({ success: true });
      break;
      
    case 'checkJobs':
      checkForNewJobs().then(() => {
        sendResponse({ success: true });
      });
      return true; // Keep channel open
      
    case 'getStatus':
      chrome.storage.local.get(['jobCount', 'lastCheck', 'newJob'], (data) => {
        sendResponse({
          success: true,
          monitoring: monitoringInterval !== null,
          jobCount: data.jobCount || 0,
          lastCheck: data.lastCheck || 0,
          newJob: data.newJob || false
        });
      });
      return true; // Keep channel open
      
    default:
      sendResponse({ success: false, error: 'Unknown action' });
  }
});

// ============================================================================
// ACTION BUTTON HANDLER
// ============================================================================

chrome.action.onClicked.addListener((tab) => {
  chrome.sidePanel.open({ windowId: tab.windowId });
});

// ============================================================================
// AUTO-START MONITORING
// ============================================================================

// Start monitoring automatically
startMonitoring();

console.log('[CommandCenter] Background service worker initialized');
