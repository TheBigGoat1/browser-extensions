/**
 * WebScraper Pro - Background Service Worker
 * Orchestrator for queue management and data aggregation
 */

// Import storage manager (must be at top level, synchronous)
importScripts('storage-manager.js');

// Verify StorageManager is loaded
if (typeof StorageManager === 'undefined') {
  console.error('[Background] StorageManager not loaded!');
}

// ============================================================================
// BACKGROUND SERVICE WORKER
// ============================================================================

class BackgroundOrchestrator {
  constructor() {
    this.activeJobs = new Map();
    this.urlQueue = [];
    this.processing = false;
  }

  /**
   * Initialize background worker
   */
  async init() {
    console.log('[Background] Initialized');
    
    // Set up storage cleanup alarm
    chrome.alarms.onAlarm.addListener(async (alarm) => {
      if (alarm.name === 'storageCleanup') {
        try {
          const settings = await StorageManager.getSettings();
          const retentionDays = settings?.retentionDays || 30;
          const cleaned = await StorageManager.cleanupOldData(retentionDays);
          console.log(`[Background] Storage cleanup completed: ${cleaned} jobs cleaned`);
        } catch (error) {
          console.error('[Background] Storage cleanup error:', error);
        }
      }
    });
    
    // StorageManager is already loaded via importScripts at top level
    
    // Store reference to this for event listeners
    const self = this;
    
    // Listen for messages
    chrome.runtime.onMessage.addListener(function(message, sender, sendResponse) {
      self.handleMessage(message, sender, sendResponse).catch(error => {
        console.error('[Background] Message handler error:', error);
        sendResponse({ success: false, error: error.message });
      });
      return true; // Keep channel open
    });
    
    // Listen for alarms (scheduler)
    chrome.alarms.onAlarm.addListener(function(alarm) {
      self.handleAlarm(alarm).catch(error => {
        console.error('[Background] Alarm handler error:', error);
      });
    });
    
    // Listen for tab updates (for navigation tracking)
    chrome.tabs.onUpdated.addListener(function(tabId, changeInfo, tab) {
      self.handleTabUpdate(tabId, changeInfo, tab);
    });
    
    // Handle extension icon click - open side panel
    chrome.action.onClicked.addListener(function(tab) {
      chrome.sidePanel.open({ windowId: tab.windowId });
    });
  }

  /**
   * Handle messages
   */
  async handleMessage(message, sender, sendResponse) {
    try {
      switch (message.action) {
        case 'startScraping':
          const job = await this.startScraping(message.sitemapId, message.config);
          sendResponse({ success: true, job });
          break;

        case 'stopScraping':
          try {
            await this.stopScraping(message.jobId);
            sendResponse({ success: true, message: 'Job stopped successfully' });
          } catch (error) {
            console.error('[Background] Error stopping job:', error);
            sendResponse({ success: false, error: error.message });
          }
          break;

        case 'getJobStatus':
          const status = await this.getJobStatus(message.jobId);
          sendResponse({ success: true, status });
          break;

        case 'getResults':
          const results = await StorageManager.getResults(message.jobId);
          sendResponse({ success: true, results });
          break;

        case 'exportResults':
          await this.exportResults(message.jobId, message.format);
          sendResponse({ success: true });
          break;

        case 'scrapingComplete':
          await this.handleScrapingComplete(message);
          // Notify sidepanel with full details
          chrome.runtime.sendMessage({
            action: 'scrapingComplete',
            jobId: message.jobId,
            resultsCount: message.results?.length || 0,
            sitemapId: message.sitemapId,
            url: message.url
          }).catch(() => {});
          sendResponse({ success: true });
          break;

        case 'scrapingError':
          console.error('[Background] Scraping error:', message.error);
          if (message.jobId) {
            await StorageManager.updateJobStatus(message.jobId, 'error', {
              error: message.error
            });
          }
          sendResponse({ success: true });
          break;

        case 'elementSelected':
          // Forward to sidepanel
          chrome.runtime.sendMessage(message);
          sendResponse({ success: true });
          break;

        case 'scheduleJob':
          await this.scheduleJob(message.jobId, message.schedule);
          sendResponse({ success: true });
          break;

        default:
          sendResponse({ success: false, error: 'Unknown action' });
      }
    } catch (error) {
      console.error('[Background] Error:', error);
      sendResponse({ success: false, error: error.message });
    }
  }

  /**
   * Start scraping job
   */
  async startScraping(sitemapId, config = {}) {
    console.log('[Background] Starting scraping for sitemap:', sitemapId);
    
    // Get sitemap
    const sitemap = await StorageManager.getSitemap(sitemapId);
    if (!sitemap) {
      throw new Error(`Sitemap not found: ${sitemapId}`);
    }

    if (!sitemap.startUrl) {
      throw new Error('Sitemap has no start URL');
    }

    // Create job
    const job = {
      id: `job_${Date.now()}`,
      sitemapId: sitemap.id,
      sitemapName: sitemap.name || sitemap.id,
      status: 'running',
      startUrl: sitemap.startUrl,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      config: {
        maxPages: config.maxPages || 100,
        delay: config.delay || 1000,
        handleInfiniteScroll: config.handleInfiniteScroll || false,
        ...config
      },
      stats: {
        pagesProcessed: 0,
        resultsCount: 0,
        errors: 0
      }
    };

    // Save job
    await StorageManager.saveJob(job);
    this.activeJobs.set(job.id, job);

    // Get or create tab
    let tab;
    try {
      tab = await this.getOrCreateTab(sitemap.startUrl);
      console.log('[Background] Tab created/opened:', tab.id);
    } catch (error) {
      console.error('[Background] Error creating tab:', error);
      await StorageManager.updateJobStatus(job.id, 'error', {
        error: 'Failed to open tab: ' + error.message
      });
      throw error;
    }
    
    // Wait for page to load
    await new Promise((resolve) => {
      const listener = (tabId, changeInfo) => {
        if (tabId === tab.id && changeInfo.status === 'complete') {
          chrome.tabs.onUpdated.removeListener(listener);
          setTimeout(resolve, 1000); // Wait 1 second for page to fully load
        }
      };
      chrome.tabs.onUpdated.addListener(listener);
      
      // Timeout after 10 seconds
      setTimeout(() => {
        chrome.tabs.onUpdated.removeListener(listener);
        resolve();
      }, 10000);
    });

    // Inject content script and execute
    try {
      console.log('[Background] Injecting scripts into tab:', tab.id);
      
      // Content scripts are already injected via manifest, but ensure they're ready
      // Send execute command
      setTimeout(async () => {
        try {
          await chrome.tabs.sendMessage(tab.id, {
            action: 'executeSitemap',
            sitemap: sitemap,
            jobId: job.id
          });
          console.log('[Background] Execute command sent to content script');
        } catch (error) {
          console.error('[Background] Error sending execute command:', error);
          // Try injecting scripts manually
          try {
            await chrome.scripting.executeScript({
              target: { tabId: tab.id },
              files: ['content.js', 'selector-engine.js']
            });
            // Retry sending message
            await chrome.tabs.sendMessage(tab.id, {
              action: 'executeSitemap',
              sitemap: sitemap,
              jobId: job.id
            });
          } catch (injectError) {
            console.error('[Background] Error injecting scripts:', injectError);
            await StorageManager.updateJobStatus(job.id, 'error', {
              error: 'Failed to inject scripts: ' + injectError.message
            });
          }
        }
      }, 500);
    } catch (error) {
      console.error('[Background] Error executing sitemap:', error);
      await StorageManager.updateJobStatus(job.id, 'error', {
        error: error.message
      });
      throw error;
    }

    return job;
  }

  /**
   * Stop scraping job
   */
  async stopScraping(jobId) {
    console.log('[Background] Stopping job:', jobId);
    
    // Get job from storage (might not be in activeJobs if already completed)
    const job = await StorageManager.getJob(jobId);
    if (!job) {
      // Try activeJobs as fallback
      const activeJob = this.activeJobs.get(jobId);
      if (!activeJob) {
        throw new Error(`Job not found: ${jobId}`);
      }
    }

    // Update status to 'stopped' with proper data
    await StorageManager.updateJobStatus(jobId, 'stopped', {
      stoppedAt: Date.now(),
      stoppedBy: 'user'
    });
    
    // Remove from active jobs
    this.activeJobs.delete(jobId);
    
    console.log('[Background] Job stopped successfully:', jobId);

    // Notify sidepanel
    try {
      chrome.runtime.sendMessage({
        action: 'jobStopped',
        jobId: jobId
      }).catch(() => {}); // Ignore if sidepanel not open
    } catch (e) {
      // Ignore
    }

    console.log('[Background] Job stopped and status updated:', jobId);
    return true;
  }

  /**
   * Get job status
   */
  async getJobStatus(jobId) {
    const job = await StorageManager.getJob(jobId);
    if (!job) {
      return null;
    }

    const results = await StorageManager.getResults(jobId);
    const pendingUrls = await StorageManager.getPendingUrls(jobId);
    const failedUrls = await StorageManager.getFailedUrls(jobId);

    return {
      ...job,
      resultsCount: results.length,
      pendingUrlsCount: pendingUrls.length,
      failedUrlsCount: failedUrls.length
    };
  }

  /**
   * Handle scraping complete
   */
  async handleScrapingComplete(message) {
    const { url, results, sitemapId } = message;

    // Find active job for this sitemap
    const jobs = await StorageManager.getJobs();
    const job = jobs.find(j => 
      j.sitemapId === sitemapId && j.status === 'running'
    );

    if (job) {
      // Save results
      await StorageManager.saveResults(job.id, results);

      // Update job stats
      job.stats.pagesProcessed++;
      job.stats.resultsCount += results.length;
      job.updatedAt = Date.now();

      // Check if job is complete
      const pendingUrls = await StorageManager.getPendingUrls(job.id);
      if (pendingUrls.length === 0 && job.stats.pagesProcessed >= job.config.maxPages) {
        job.status = 'completed';
        this.activeJobs.delete(job.id);
      }

      await StorageManager.saveJob(job);
      
      // Notify sidepanel immediately with job ID for auto-refresh
      chrome.runtime.sendMessage({
        action: 'scrapingComplete',
        jobId: job.id,
        resultsCount: job.stats.resultsCount,
        sitemapId: sitemapId,
        url: url
      }).catch(() => {});
    }

    // Process pending URLs
    await this.processPendingUrls(sitemapId);
  }

  /**
   * Process pending URLs
   */
  async processPendingUrls(sitemapId) {
    const jobs = await StorageManager.getJobs();
    const job = jobs.find(j => j.sitemapId === sitemapId && j.status === 'running');
    
    if (!job) return;

    const pendingUrls = await StorageManager.getPendingUrls(job.id);
    
    if (pendingUrls.length === 0) return;
    if (job.stats.pagesProcessed >= job.config.maxPages) return;

    // Process next URL
    const nextUrl = pendingUrls.shift();
    await StorageManager.savePendingUrls(job.id, pendingUrls);

    // Navigate to URL and scrape
    const tab = await this.getOrCreateTab(nextUrl);
    
    // Wait for page load
    await new Promise(resolve => {
      const listener = (tabId, changeInfo) => {
        if (tabId === tab.id && changeInfo.status === 'complete') {
          chrome.tabs.onUpdated.removeListener(listener);
          resolve();
        }
      };
      chrome.tabs.onUpdated.addListener(listener);
    });

    // Execute sitemap
    const sitemap = await StorageManager.getSitemap(sitemapId);
    chrome.tabs.sendMessage(tab.id, {
      action: 'executeSitemap',
      sitemap: sitemap
    });
  }

  /**
   * Get or create tab
   */
  async getOrCreateTab(url) {
    // Try to find existing tab
    const tabs = await chrome.tabs.query({ url: url.split('?')[0] + '*' });
    if (tabs.length > 0) {
      return tabs[0];
    }

    // Create new tab
    const tab = await chrome.tabs.create({ url: url, active: false });
    return tab;
  }

  /**
   * Handle tab update
   */
  handleTabUpdate(tabId, changeInfo, tab) {
    // Track navigation for active jobs
    // (Implementation depends on requirements)
  }

  /**
   * Handle alarm (scheduler)
   */
  async handleAlarm(alarm) {
    if (alarm.name.startsWith('scrape_')) {
      const jobId = alarm.name.replace('scrape_', '');
      const job = await StorageManager.getJob(jobId);
      
      if (job && job.schedule) {
        await this.startScraping(job.sitemapId, job.config);
      }
    }
  }

  /**
   * Schedule job
   */
  async scheduleJob(jobId, schedule) {
    const job = await StorageManager.getJob(jobId);
    if (!job) {
      throw new Error(`Job not found: ${jobId}`);
    }

    job.schedule = schedule;
    await StorageManager.saveJob(job);

    // Create alarm
    if (schedule.type === 'daily') {
      chrome.alarms.create(`scrape_${jobId}`, {
        when: schedule.time || Date.now() + 86400000, // 24 hours
        periodInMinutes: 1440 // Daily
      });
    } else if (schedule.type === 'hourly') {
      chrome.alarms.create(`scrape_${jobId}`, {
        periodInMinutes: 60
      });
    }

    return true;
  }

  /**
   * Export results
   */
  async exportResults(jobId, format = 'csv') {
    const results = await StorageManager.getResults(jobId);
    const job = await StorageManager.getJob(jobId);

    if (results.length === 0) {
      throw new Error('No results to export');
    }

    // Send to sidepanel for export (since we can't download from service worker)
    chrome.runtime.sendMessage({
      action: 'exportResults',
      jobId: jobId,
      results: results,
      format: format,
      filename: `${job.sitemapName || 'export'}_${Date.now()}.${format}`
    });

    return true;
  }
}

// ============================================================================
// INITIALIZE
// ============================================================================

// Initialize service worker
try {
  // Wait for StorageManager to be available
  if (typeof StorageManager === 'undefined') {
    console.error('[Background] StorageManager not available after importScripts');
    throw new Error('StorageManager not loaded');
  } else {
    console.log('[Background] StorageManager loaded successfully');
  }

  const orchestrator = new BackgroundOrchestrator();

  // Initialize asynchronously
  orchestrator.init().catch(error => {
    console.error('[Background] Initialization error:', error);
  });

  console.log('[Background] Service worker loaded successfully');
} catch (error) {
  console.error('[Background] Service worker failed to load:', error);
  throw error;
}
