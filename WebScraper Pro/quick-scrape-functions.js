/**
 * Quick Scrape Functions - v2.1
 * All functions for intelligent scraping
 */

// Global state
let generatedSitemap = null;
let scrapingProgress = 0;
let progressInterval = null;

// Export functions immediately (before DOM ready)
if (typeof window !== 'undefined') {
  // Functions will be assigned below, but we can set up the structure now
  console.log('[QuickScrape] Module loading, will export functions...');
}

// ============================================================================
// QUICK SCRAPE FUNCTIONS
// ============================================================================

async function startQuickScrape() {
  console.log('[QuickScrape] Start scraping clicked');
  
  const urlInput = document.getElementById('quickScrapeUrl');
  const requirementsInput = document.getElementById('quickScrapeRequirements');
  
  if (!urlInput || !requirementsInput) {
    console.error('[QuickScrape] Inputs not found');
    showNotification('Error: Form elements not found', 'error');
    return;
  }
  
  const url = urlInput.value.trim();
  const requirements = requirementsInput.value.trim();

  if (!url) {
    showNotification('Please enter a URL', 'warning');
    return;
  }

  if (!requirements) {
    showNotification('Please describe what you want to extract', 'warning');
    return;
  }

  try {
    // Show progress indicator
    showProgressIndicator('Analyzing page structure...', 0);
    
    // Fast progress to 70%
    simulateFastProgress(70, 1000);

    // Open or navigate to URL
    let tab;
    try {
      const tabs = await chrome.tabs.query({ url: url.split('?')[0] + '*' });
      if (tabs.length > 0) {
        tab = tabs[0];
        await chrome.tabs.update(tab.id, { active: true, url: url });
      } else {
        tab = await chrome.tabs.create({ url: url, active: true });
      }
    } catch (error) {
      tab = await chrome.tabs.create({ url: url, active: true });
    }

    // Wait for page to load
    await new Promise((resolve) => {
      const listener = (tabId, changeInfo) => {
        if (tabId === tab.id && changeInfo.status === 'complete') {
          chrome.tabs.onUpdated.removeListener(listener);
          setTimeout(resolve, 2000);
        }
      };
      chrome.tabs.onUpdated.addListener(listener);
      setTimeout(() => {
        chrome.tabs.onUpdated.removeListener(listener);
        resolve();
      }, 10000);
    });

    updateProgress(75, 'Generating selectors...');

    // Inject intelligent scraper and execute
    try {
      await chrome.scripting.executeScript({
        target: { tabId: tab.id },
        files: ['intelligent-scraper.js', 'selector-engine.js']
      });

      updateProgress(80, 'Extracting data...');

      // Wait for page to be fully ready (use SmartWaiter if available)
      if (typeof SmartWaiter !== 'undefined') {
        try {
          await chrome.scripting.executeScript({
            target: { tabId: tab.id },
            func: async () => {
              if (window.SmartWaiter) {
                await window.SmartWaiter.waitForPageReady({ timeout: 10000 });
              }
            }
          });
        } catch (e) {
          console.warn('[QuickScrape] SmartWaiter not available, using basic wait');
        }
      }

      updateProgress(80, 'Extracting data...');

      // Send message to analyze and extract
      const response = await chrome.tabs.sendMessage(tab.id, {
        action: 'intelligentScrape',
        requirements: requirements
      });

      if (response && response.success && response.sitemap) {
        updateProgress(90, 'Processing results...');
        
        generatedSitemap = response.sitemap;
        generatedSitemap.startUrl = url;
        
        // Execute scraping immediately
        if (response.results && response.results.length > 0) {
          // Save results
          const jobId = `job_${Date.now()}`;
          const job = {
            id: jobId,
            sitemapId: generatedSitemap.id,
            sitemapName: 'Quick Scrape',
            status: 'completed',
            startUrl: url,
            createdAt: Date.now(),
            updatedAt: Date.now(),
            stats: {
              pagesProcessed: 1,
              resultsCount: response.results.length,
              errors: 0
            }
          };
          
          await StorageManager.saveJob(job);
          await StorageManager.saveResults(jobId, response.results);
          
          updateProgress(100, 'Complete!');
          setTimeout(async () => {
            hideProgressIndicator();
            displayGeneratedSitemap(generatedSitemap);
            showNotification(`Scraping complete! Found ${response.results.length} results`, 'success');
            
            // Automatically switch to Results tab and show results
            if (typeof window.switchTab === 'function') {
              window.switchTab('results');
            }
            
            // Wait for tab switch, then load all results
            setTimeout(async () => {
              if (typeof window.loadResults === 'function') {
                await window.loadResults();
              }
            }, 500);
          }, 500);
        } else {
          updateProgress(100, 'Sitemap generated');
          setTimeout(() => {
            hideProgressIndicator();
            displayGeneratedSitemap(generatedSitemap);
            showNotification('Sitemap generated successfully!', 'success');
          }, 500);
        }
      } else {
        throw new Error(response?.error || 'Failed to generate sitemap');
      }
    } catch (error) {
      console.error('[QuickScrape] Intelligent scrape error:', error);
      hideProgressIndicator();
      showNotification('Error: ' + error.message, 'error');
    }
  } catch (error) {
    console.error('[QuickScrape] Quick scrape error:', error);
    hideProgressIndicator();
    showNotification('Error: ' + error.message, 'error');
  }
}

async function analyzeCurrentPage() {
  console.log('[QuickScrape] Analyze current page clicked');
  
  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (!tab || !tab.url || tab.url.startsWith('chrome://')) {
      showNotification('Please navigate to a webpage first', 'warning');
      return;
    }

    const urlInput = document.getElementById('quickScrapeUrl');
    if (urlInput) {
      urlInput.value = tab.url;
    }
    
    showNotification('Analyzing page...', 'info');
    
    await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      files: ['intelligent-scraper.js']
    });

    const response = await chrome.tabs.sendMessage(tab.id, {
      action: 'analyzePage'
    });

    if (response && response.analysis) {
      const suggestions = [];
      if (response.analysis.headings.length > 0) suggestions.push('headings');
      if (response.analysis.links.length > 0) suggestions.push('links');
      if (response.analysis.images.length > 0) suggestions.push('images');
      if (response.analysis.lists.length > 0) suggestions.push('lists');
      if (response.analysis.prices.length > 0) suggestions.push('prices');
      
      const requirementsInput = document.getElementById('quickScrapeRequirements');
      if (requirementsInput) {
        requirementsInput.value = suggestions.length > 0 
          ? `Extract ${suggestions.join(', ')} from this page`
          : 'Extract all content from this page';
      }
      
      showNotification(`Page analyzed! Found ${suggestions.length} content types`, 'success');
    }
  } catch (error) {
    console.error('[QuickScrape] Analyze error:', error);
    showNotification('Error analyzing page: ' + error.message, 'error');
  }
}

function addQuickOption(option) {
  const textarea = document.getElementById('quickScrapeRequirements');
  if (!textarea) return;
  
  const current = textarea.value.trim();
  const options = {
    text: 'text content',
    links: 'links',
    images: 'images',
    prices: 'prices',
    lists: 'lists and items',
    tables: 'tables'
  };
  
  const addition = options[option] || option;
  textarea.value = current ? `${current}, ${addition}` : `Extract ${addition}`;
}

function displayGeneratedSitemap(sitemap) {
  const preview = document.getElementById('generatedSitemapPreview');
  const results = document.getElementById('quickScrapeResults');
  
  if (!preview || !results) return;
  
  preview.innerHTML = `
    <div class="sitemap-preview">
      <p><strong>URL:</strong> ${sitemap.startUrl}</p>
      <p><strong>Selectors Generated:</strong> ${sitemap.selectors.length}</p>
      <div class="selectors-preview">
        ${sitemap.selectors.map(sel => `
          <div class="preview-selector">
            <span class="preview-selector-id">${sel.id}</span>
            <span class="preview-selector-type">${sel.type}</span>
            <span class="preview-selector-css">${sel.selector}</span>
          </div>
        `).join('')}
      </div>
    </div>
  `;
  
  results.style.display = 'block';
}

async function saveGeneratedSitemap() {
  if (!generatedSitemap) {
    showNotification('No sitemap to save', 'warning');
    return;
  }

  const name = prompt('Enter sitemap name:', 'Intelligent Scrape');
  if (!name) return;

  generatedSitemap.name = name;
  generatedSitemap.id = `sitemap_${Date.now()}`;

  try {
    await StorageManager.saveSitemap(generatedSitemap);
    showNotification('Sitemap saved successfully', 'success');
    switchTab('sitemaps');
    loadSitemaps();
  } catch (error) {
    console.error('[QuickScrape] Error saving sitemap:', error);
    showNotification('Error saving sitemap', 'error');
  }
}

async function runGeneratedSitemap() {
  if (!generatedSitemap) {
    showNotification('No sitemap to run', 'warning');
    return;
  }

  await saveGeneratedSitemap();
  await startScraping(generatedSitemap.id);
}

// ============================================================================
// PROGRESS INDICATOR
// ============================================================================

function showProgressIndicator(message, progress) {
  let progressBar = document.getElementById('scrapingProgressBar');
  let progressText = document.getElementById('scrapingProgressText');
  
  if (!progressBar) {
    // Create progress indicator
    const progressContainer = document.createElement('div');
    progressContainer.id = 'scrapingProgressContainer';
    progressContainer.className = 'progress-container';
    progressContainer.innerHTML = `
      <div class="progress-header">
        <h3>Scraping in Progress</h3>
        <button class="btn-icon" id="closeProgressBtn">
          <svg><use href="#icon-close"></use></svg>
        </button>
      </div>
      <div class="progress-bar-wrapper">
        <div class="progress-bar" id="scrapingProgressBar">
          <div class="progress-fill" id="scrapingProgressFill"></div>
        </div>
        <div class="progress-text" id="scrapingProgressText">${message}</div>
        <div class="progress-percent" id="scrapingProgressPercent">0%</div>
      </div>
    `;
    document.body.appendChild(progressContainer);
    
    // Close button
    document.getElementById('closeProgressBtn')?.addEventListener('click', () => {
      hideProgressIndicator();
    });
    
    progressBar = document.getElementById('scrapingProgressBar');
    progressText = document.getElementById('scrapingProgressText');
  }
  
  document.getElementById('scrapingProgressContainer').style.display = 'block';
  updateProgress(progress, message);
}

function updateProgress(percent, message) {
  const fill = document.getElementById('scrapingProgressFill');
  const text = document.getElementById('scrapingProgressText');
  const percentEl = document.getElementById('scrapingProgressPercent');
  
  if (fill) {
    fill.style.width = `${Math.min(100, Math.max(0, percent))}%`;
  }
  if (text) {
    text.textContent = message || 'Processing...';
  }
  if (percentEl) {
    percentEl.textContent = `${Math.round(percent)}%`;
  }
  
  scrapingProgress = percent;
}

function simulateFastProgress(targetPercent, duration) {
  const start = scrapingProgress;
  const end = targetPercent;
  const startTime = Date.now();
  
  if (progressInterval) {
    clearInterval(progressInterval);
  }
  
  progressInterval = setInterval(() => {
    const elapsed = Date.now() - startTime;
    const progress = Math.min(end, start + (end - start) * (elapsed / duration));
    
    updateProgress(progress, 'Analyzing page structure...');
    
    if (progress >= end) {
      clearInterval(progressInterval);
      progressInterval = null;
    }
  }, 16); // ~60fps
}

function hideProgressIndicator() {
  const container = document.getElementById('scrapingProgressContainer');
  if (container) {
    container.style.display = 'none';
  }
  if (progressInterval) {
    clearInterval(progressInterval);
    progressInterval = null;
  }
  scrapingProgress = 0;
}

// ============================================================================
// EXPORT TO GLOBAL SCOPE
// ============================================================================

// Make functions available globally - do this immediately after function definitions
(function exportFunctions() {
  if (typeof window !== 'undefined') {
    window.startQuickScrape = startQuickScrape;
    window.analyzeCurrentPage = analyzeCurrentPage;
    window.addQuickOption = addQuickOption;
    window.displayGeneratedSitemap = displayGeneratedSitemap;
    window.saveGeneratedSitemap = saveGeneratedSitemap;
    window.runGeneratedSitemap = runGeneratedSitemap;
    window.showProgressIndicator = showProgressIndicator;
    window.updateProgress = updateProgress;
    window.hideProgressIndicator = hideProgressIndicator;
    
    console.log('[QuickScrape] Functions exported to window:', {
      startQuickScrape: typeof window.startQuickScrape,
      analyzeCurrentPage: typeof window.analyzeCurrentPage
    });
  }
})();
