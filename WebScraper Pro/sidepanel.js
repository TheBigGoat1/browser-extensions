/**
 * Scrape Orange v2.0 - Sidepanel Controller
 * Complete end-to-end functionality with proper communication
 */

// ============================================================================
// GLOBAL STATE
// ============================================================================

let currentSitemap = null;
let currentSelector = null;
let visualSelectorActive = false;
let currentTabId = null;

// ============================================================================
// INITIALIZATION
// ============================================================================

document.addEventListener('DOMContentLoaded', async () => {
  await initializeApp();
});

async function initializeApp() {
  console.log('[Sidepanel] Initializing v2.0...');
  
  // Get current tab
  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    currentTabId = tab?.id;
    console.log('[Sidepanel] Current tab:', currentTabId);
  } catch (error) {
    console.warn('[Sidepanel] Could not get current tab:', error);
  }
  
  // Load data
  await loadSitemaps();
  await loadJobs();
  
  // Set up event listeners
  setupEventListeners();
  
  // Set up message listeners
  setupMessageListeners();
  
  console.log('[Sidepanel] Initialized successfully');
}

// ============================================================================
// EVENT LISTENERS
// ============================================================================

function setupEventListeners() {
  // Tab switching
  document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      switchTab(e.target.dataset.tab);
    });
  });

  // Create sitemap
  document.getElementById('createSitemapBtn').addEventListener('click', createNewSitemap);
  document.getElementById('closeEditorBtn').addEventListener('click', closeSitemapEditor);
  document.getElementById('saveSitemapBtn').addEventListener('click', saveSitemap);
  document.getElementById('testSitemapBtn').addEventListener('click', testSitemap);
  document.getElementById('addSelectorBtn').addEventListener('click', addSelector);

  // Visual selector controls
  document.getElementById('stopSelectorBtn').addEventListener('click', deactivateVisualSelector);
  document.getElementById('clearSelectionsBtn').addEventListener('click', clearSelections);

  // Export all results
  document.getElementById('exportAllResultsBtn')?.addEventListener('click', exportResults);
  document.getElementById('validateDataBtn')?.addEventListener('click', validateDataQuality);
  document.getElementById('previewDataBtn')?.addEventListener('click', showDataPreview);
  document.getElementById('closeQualityPanel')?.addEventListener('click', () => {
    document.getElementById('dataQualityPanel').style.display = 'none';
  });
  document.getElementById('closePreviewPanel')?.addEventListener('click', () => {
    document.getElementById('previewPanel').style.display = 'none';
  });

  // Selector modal
  document.getElementById('closeModalBtn').addEventListener('click', closeSelectorModal);
  document.getElementById('cancelSelectorBtn').addEventListener('click', closeSelectorModal);
  document.getElementById('saveSelectorBtn').addEventListener('click', saveSelector);
  document.getElementById('selectorType').addEventListener('change', (e) => {
    const attributeGroup = document.getElementById('attributeGroup');
    attributeGroup.style.display = e.target.value === 'SelectorAttribute' ? 'block' : 'none';
  });
}

// ============================================================================
// MESSAGE LISTENERS
// ============================================================================

function setupMessageListeners() {
  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    console.log('[Sidepanel] Received message:', message);
    
    if (message.action === 'elementSelected') {
      handleElementSelected(message.data);
      sendResponse({ success: true });
    } else if (message.action === 'scrapingProgress') {
      updateJobProgress(message.jobId, message.progress);
      sendResponse({ success: true });
    } else if (message.action === 'scrapingComplete') {
      handleScrapingComplete(message);
      sendResponse({ success: true });
    } else if (message.action === 'jobStopped') {
      // Reload jobs when a job is stopped
      console.log('[Sidepanel] Job stopped, reloading jobs list');
      loadJobs();
      showNotification('Job stopped successfully', 'success');
      sendResponse({ success: true });
    }
    
    return true; // Keep channel open
  });
}

// ============================================================================
// TAB MANAGEMENT
// ============================================================================

function switchTab(tabName) {
  document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.tab === tabName);
  });

  document.querySelectorAll('.tab-panel').forEach(panel => {
    panel.classList.toggle('active', panel.id === `panel${tabName.charAt(0).toUpperCase() + tabName.slice(1)}`);
  });

  if (tabName === 'quickscrape') {
    // Quick Scrape tab - no special loading needed
  } else if (tabName === 'sitemaps') {
    loadSitemaps();
  } else if (tabName === 'jobs') {
    loadJobs();
  } else if (tabName === 'results') {
    // Load all results automatically
    loadResults();
  }
}

// ============================================================================
// SITEMAP MANAGEMENT
// ============================================================================

async function loadSitemaps() {
  try {
    const sitemaps = await StorageManager.getSitemaps();
    const list = document.getElementById('sitemapList');
    
    if (sitemaps.length === 0) {
      list.innerHTML = '<div class="empty-state"><p>No sitemaps yet. Create your first sitemap to get started.</p></div>';
      return;
    }

    list.innerHTML = sitemaps.map(sitemap => `
      <div class="sitemap-item" data-id="${sitemap.id}">
        <div class="sitemap-info">
          <h3>${sitemap.name || sitemap.id}</h3>
          <p class="sitemap-url">${sitemap.startUrl || 'No URL'}</p>
          <p class="sitemap-meta">${sitemap.selectors?.length || 0} selectors</p>
        </div>
        <div class="sitemap-actions">
          <button class="btn-icon sitemap-edit-btn" data-sitemap-id="${sitemap.id}" title="Edit">
            <svg><use href="#icon-edit"></use></svg>
          </button>
          <button class="btn-icon sitemap-play-btn" data-sitemap-id="${sitemap.id}" title="Run">
            <svg><use href="#icon-play"></use></svg>
          </button>
          <button class="btn-icon sitemap-delete-btn" data-sitemap-id="${sitemap.id}" title="Delete">
            <svg><use href="#icon-delete"></use></svg>
          </button>
        </div>
      </div>
    `).join('');
    
    // Add event listeners using event delegation
    document.querySelectorAll('.sitemap-edit-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const id = btn.dataset.sitemapId;
        editSitemap(id);
      });
    });
    
    document.querySelectorAll('.sitemap-play-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const id = btn.dataset.sitemapId;
        startScraping(id);
      });
    });
    
    document.querySelectorAll('.sitemap-delete-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const id = btn.dataset.sitemapId;
        deleteSitemap(id);
      });
    });
  } catch (error) {
    console.error('[Sidepanel] Error loading sitemaps:', error);
    showNotification('Error loading sitemaps', 'error');
  }
}

async function createNewSitemap() {
  currentSitemap = {
    id: `sitemap_${Date.now()}`,
    name: '',
    startUrl: '',
    selectors: []
  };
  openSitemapEditor();
}

async function editSitemap(id) {
  try {
    currentSitemap = await StorageManager.getSitemap(id);
    if (!currentSitemap) {
      showNotification('Sitemap not found', 'error');
      return;
    }
    openSitemapEditor();
  } catch (error) {
    console.error('[Sidepanel] Error editing sitemap:', error);
    showNotification('Error loading sitemap', 'error');
  }
}

function openSitemapEditor() {
  document.getElementById('sitemapEditor').style.display = 'block';
  document.getElementById('sitemapList').style.display = 'none';
  
  document.getElementById('editorTitle').textContent = currentSitemap.name || 'New Sitemap';
  document.getElementById('sitemapName').value = currentSitemap.name || '';
  document.getElementById('sitemapStartUrl').value = currentSitemap.startUrl || '';
  
  loadSelectorsTree();
}

function closeSitemapEditor() {
  document.getElementById('sitemapEditor').style.display = 'none';
  document.getElementById('sitemapList').style.display = 'block';
  currentSitemap = null;
}

async function saveSitemap() {
  const name = document.getElementById('sitemapName').value.trim();
  const startUrl = document.getElementById('sitemapStartUrl').value.trim();

  if (!name) {
    showNotification('Please enter a sitemap name', 'warning');
    return;
  }

  if (!startUrl) {
    showNotification('Please enter a start URL', 'warning');
    return;
  }

  try {
    currentSitemap.name = name;
    currentSitemap.startUrl = startUrl;

    await StorageManager.saveSitemap(currentSitemap);
    
    showNotification('Sitemap saved successfully', 'success');
    closeSitemapEditor();
    loadSitemaps();
  } catch (error) {
    console.error('[Sidepanel] Error saving sitemap:', error);
    showNotification('Error saving sitemap', 'error');
  }
}

function loadSelectorsTree() {
  const tree = document.getElementById('selectorsTree');
  
  if (!currentSitemap.selectors || currentSitemap.selectors.length === 0) {
    tree.innerHTML = '<p class="empty-state">No selectors. Click "Add Selector" to create one.</p>';
    return;
  }

  const rootSelectors = currentSitemap.selectors.filter(s => 
    s.parentSelectors.includes('_root')
  );

  tree.innerHTML = rootSelectors.map(sel => 
    renderSelectorNode(sel, currentSitemap.selectors)
  ).join('');
  
  // Add event listeners for selector buttons
  document.querySelectorAll('.selector-edit-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const id = btn.dataset.selectorId;
      editSelector(id);
    });
  });
  
  document.querySelectorAll('.selector-delete-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const id = btn.dataset.selectorId;
      deleteSelector(id);
    });
  });
}

function renderSelectorNode(selector, allSelectors) {
  const children = allSelectors.filter(s => 
    s.parentSelectors.includes(selector.id)
  );

  const iconId = getSelectorIconId(selector.type);

  return `
    <div class="selector-node" data-id="${selector.id}">
      <div class="selector-header">
        <span class="selector-icon">
          <svg><use href="#${iconId}"></use></svg>
        </span>
        <span class="selector-name">${selector.id}</span>
        <span class="selector-type">${selector.type}</span>
        <button class="btn-icon-small selector-edit-btn" data-selector-id="${selector.id}" title="Edit">
          <svg><use href="#icon-edit"></use></svg>
        </button>
        <button class="btn-icon-small selector-delete-btn" data-selector-id="${selector.id}" title="Delete">
          <svg><use href="#icon-delete"></use></svg>
        </button>
      </div>
      ${children.length > 0 ? `
        <div class="selector-children">
          ${children.map(child => renderSelectorNode(child, allSelectors)).join('')}
        </div>
      ` : ''}
    </div>
  `;
}

function getSelectorIconId(type) {
  const iconMap = {
    'SelectorElement': 'icon-element',
    'SelectorText': 'icon-text',
    'SelectorLink': 'icon-link',
    'SelectorImage': 'icon-image',
    'SelectorAttribute': 'icon-text',
    'SelectorHTML': 'icon-text',
    'SelectorTable': 'icon-table'
  };
  return iconMap[type] || 'icon-element';
}

async function addSelector() {
  if (!currentTabId) {
    showNotification('Please navigate to a webpage first', 'warning');
    return;
  }
  
  // Activate visual selector
  await activateVisualSelector();
}

async function activateVisualSelector() {
  try {
    visualSelectorActive = true;
    document.getElementById('visualSelectorControls').style.display = 'flex';
    document.getElementById('selectorStatus').textContent = 'Click elements on the page to select them';
    
    // Send message to content script
    const response = await chrome.tabs.sendMessage(currentTabId, {
      action: 'activateVisualSelector'
    });
    
    if (!response || !response.success) {
      throw new Error('Failed to activate visual selector');
    }
    
    showNotification('Visual selector activated', 'success');
  } catch (error) {
    console.error('[Sidepanel] Error activating visual selector:', error);
    showNotification('Error activating visual selector. Make sure you are on a webpage.', 'error');
    visualSelectorActive = false;
    document.getElementById('visualSelectorControls').style.display = 'none';
  }
}

function deactivateVisualSelector() {
  visualSelectorActive = false;
  document.getElementById('visualSelectorControls').style.display = 'none';
  
  if (currentTabId) {
    chrome.tabs.sendMessage(currentTabId, { action: 'deactivateVisualSelector' }).catch(() => {});
  }
}

function clearSelections() {
  if (currentTabId) {
    chrome.tabs.sendMessage(currentTabId, { action: 'clearSelections' }).catch(() => {});
  }
}

function handleElementSelected(data) {
  console.log('[Sidepanel] Element selected:', data);
  
  // Auto-fill selector form
  document.getElementById('selectorCss').value = data.selector || '';
  document.getElementById('selectorMultiple').checked = data.similarCount > 1;
  
  if (!document.getElementById('selectorId').value) {
    const suggestedId = data.element + '_' + Date.now().toString().slice(-4);
    document.getElementById('selectorId').value = suggestedId;
  }
  
  if (document.getElementById('selectorModal').style.display === 'none') {
    openSelectorModal();
  }
}

async function editSelector(id) {
  currentSelector = currentSitemap.selectors.find(s => s.id === id);
  if (!currentSelector) return;
  openSelectorModal();
}

function openSelectorModal() {
  document.getElementById('selectorModal').style.display = 'flex';
  
  if (currentSelector) {
    document.getElementById('selectorId').value = currentSelector.id;
    document.getElementById('selectorType').value = currentSelector.type;
    document.getElementById('selectorCss').value = currentSelector.selector || '';
    document.getElementById('selectorMultiple').checked = currentSelector.multiple || false;
    document.getElementById('selectorAttribute').value = currentSelector.attribute || '';
    
    const parentSelect = document.getElementById('selectorParent');
    parentSelect.innerHTML = `
      <option value="_root">_root</option>
      ${currentSitemap.selectors.filter(s => s.id !== currentSelector?.id).map(s => 
        `<option value="${s.id}" ${currentSelector?.parentSelectors?.includes(s.id) ? 'selected' : ''}>${s.id}</option>`
      ).join('')}
    `;
  } else {
    document.getElementById('selectorId').value = '';
    document.getElementById('selectorType').value = 'SelectorText';
    document.getElementById('selectorCss').value = '';
    document.getElementById('selectorMultiple').checked = false;
    document.getElementById('selectorAttribute').value = '';
  }
}

function closeSelectorModal() {
  document.getElementById('selectorModal').style.display = 'none';
  currentSelector = null;
}

function saveSelector() {
  const id = document.getElementById('selectorId').value.trim();
  const type = document.getElementById('selectorType').value;
  const css = document.getElementById('selectorCss').value.trim();
  const multiple = document.getElementById('selectorMultiple').checked;
  const attribute = document.getElementById('selectorAttribute').value.trim();
  const parents = Array.from(document.getElementById('selectorParent').selectedOptions).map(o => o.value);

  if (!id) {
    showNotification('Please enter a selector ID', 'warning');
    return;
  }

  if (!css) {
    showNotification('Please enter a CSS selector', 'warning');
    return;
  }

  const selector = {
    id: id,
    type: type,
    selector: css,
    parentSelectors: parents,
    multiple: multiple
  };

  if (type === 'SelectorAttribute' && attribute) {
    selector.attribute = attribute;
  }

  if (currentSelector) {
    const index = currentSitemap.selectors.findIndex(s => s.id === currentSelector.id);
    currentSitemap.selectors[index] = selector;
  } else {
    currentSitemap.selectors.push(selector);
  }

  closeSelectorModal();
  loadSelectorsTree();
  showNotification('Selector saved', 'success');
}

function deleteSelector(id) {
  if (!confirm('Delete this selector?')) return;
  
  currentSitemap.selectors = currentSitemap.selectors.filter(s => s.id !== id);
  currentSitemap.selectors.forEach(s => {
    s.parentSelectors = s.parentSelectors.filter(p => p !== id);
  });
  
  loadSelectorsTree();
  showNotification('Selector deleted', 'success');
}

async function deleteSitemap(id) {
  if (!confirm('Delete this sitemap?')) return;
  
  try {
    await StorageManager.deleteSitemap(id);
    loadSitemaps();
    showNotification('Sitemap deleted', 'success');
  } catch (error) {
    console.error('[Sidepanel] Error deleting sitemap:', error);
    showNotification('Error deleting sitemap', 'error');
  }
}

// ============================================================================
// JOB MANAGEMENT
// ============================================================================

async function loadJobs() {
  try {
    const jobs = await StorageManager.getJobs();
    const list = document.getElementById('jobsList');
    
    if (jobs.length === 0) {
      list.innerHTML = '<div class="empty-state"><p>No jobs yet. Run a sitemap to create a job.</p></div>';
      return;
    }

    list.innerHTML = jobs.map(job => {
      // Format status display
      let statusText = job.status;
      let statusClass = `status-${job.status}`;
      
      // Capitalize status for display
      if (statusText) {
        statusText = statusText.charAt(0).toUpperCase() + statusText.slice(1);
      }
      
      return `
      <div class="job-item" data-id="${job.id}">
        <div class="job-info">
          <h3>${job.sitemapName}</h3>
          <span class="job-status ${statusClass}">${statusText}</span>
          <p class="job-meta">
            ${job.stats?.pagesProcessed || 0} pages • ${job.stats?.resultsCount || 0} results
            ${job.status === 'stopped' ? ' • Stopped by user' : ''}
          </p>
        </div>
        <div class="job-actions">
          ${job.status === 'running' ? `
            <button class="btn-secondary job-stop-btn" data-job-id="${job.id}">Stop</button>
          ` : ''}
          <button class="btn-secondary job-view-btn" data-job-id="${job.id}">View Results</button>
        </div>
      </div>
    `;
    }).join('');
    
    // Add event listeners for job buttons
    document.querySelectorAll('.job-stop-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const id = btn.dataset.jobId;
        stopJob(id);
      });
    });
    
    document.querySelectorAll('.job-view-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const id = btn.dataset.jobId;
        viewJobResults(id);
      });
    });
  } catch (error) {
    console.error('[Sidepanel] Error loading jobs:', error);
  }
}

async function startScraping(sitemapId) {
  try {
    showNotification('Starting scraping job...', 'info');
    
    const response = await chrome.runtime.sendMessage({
      action: 'startScraping',
      sitemapId: sitemapId
    });
    
    if (response && response.success) {
      showNotification('Scraping started successfully', 'success');
      switchTab('jobs');
      await loadJobs();
    } else {
      showNotification(response?.error || 'Failed to start scraping', 'error');
    }
  } catch (error) {
    console.error('[Sidepanel] Error starting scraping:', error);
    showNotification('Error starting scraping: ' + error.message, 'error');
  }
}

async function stopJob(jobId) {
  try {
    showNotification('Stopping job...', 'info');
    
    const response = await chrome.runtime.sendMessage({
      action: 'stopScraping',
      jobId: jobId
    });
    
    if (response && response.success !== false) {
      // Reload jobs to show updated status
      await loadJobs();
      showNotification('Job stopped successfully', 'success');
    } else {
      showNotification(response?.error || 'Failed to stop job', 'error');
      // Still reload to show current state
      await loadJobs();
    }
  } catch (error) {
    console.error('[Sidepanel] Error stopping job:', error);
    showNotification('Error stopping job: ' + error.message, 'error');
    // Still reload jobs to show current state
    await loadJobs();
  }
}

async function viewJobResults(jobId) {
  switchTab('results');
  // Scroll to the specific job's results in the table
  await loadResults();
  
  // Highlight the job's results
  setTimeout(() => {
    const rows = document.querySelectorAll(`.result-row[data-job-id="${jobId}"]`);
    if (rows.length > 0) {
      rows[0].scrollIntoView({ behavior: 'smooth', block: 'center' });
      rows.forEach(row => {
        row.classList.add('highlighted');
        setTimeout(() => row.classList.remove('highlighted'), 2000);
      });
    }
  }, 300);
}

function updateJobProgress(jobId, progress) {
  // Update job display with progress
  const jobItem = document.querySelector(`.job-item[data-id="${jobId}"]`);
  if (jobItem) {
    const meta = jobItem.querySelector('.job-meta');
    if (meta) {
      meta.textContent = `${progress.pagesProcessed || 0} pages • ${progress.resultsCount || 0} results`;
    }
  }
}

async function handleScrapingComplete(message) {
  const resultsCount = message.resultsCount || 0;
  const jobId = message.jobId;
  
  showNotification(`Scraping complete: ${resultsCount} results extracted`, 'success');
  
  // Reload jobs to show updated status
  await loadJobs();
  
  // If Results tab is currently active, automatically refresh it to show new results
  const resultsTab = document.querySelector('.tab-btn[data-tab="results"]');
  if (resultsTab && resultsTab.classList.contains('active')) {
    await loadResults();
  }
}

// ============================================================================
// RESULTS
// ============================================================================

async function loadResults() {
  try {
    console.log('[Sidepanel] Loading ALL results from all jobs...');
    
    // Get all jobs
    const jobs = await StorageManager.getJobs();
    
    // Get all results from all jobs
    const allResults = [];
    const resultsByJob = {};
    const sitemapStats = {};
    
    for (const job of jobs) {
      try {
        const jobResults = await StorageManager.getResults(job.id);
        if (jobResults && jobResults.length > 0) {
          // Add job metadata to each result
          const resultsWithMetadata = jobResults.map(result => ({
            ...result,
            _jobId: job.id,
            _jobName: job.sitemapName || 'Unknown',
            _sitemapId: job.sitemapId,
            _status: job.status,
            _date: job.createdAt
          }));
          
          allResults.push(...resultsWithMetadata);
          resultsByJob[job.id] = {
            job: job,
            results: resultsWithMetadata
          };
          
          // Track by sitemap
          if (!sitemapStats[job.sitemapId]) {
            sitemapStats[job.sitemapId] = {
              sitemapId: job.sitemapId,
              sitemapName: job.sitemapName || 'Unknown',
              totalResults: 0,
              jobs: []
            };
          }
          sitemapStats[job.sitemapId].totalResults += resultsWithMetadata.length;
          sitemapStats[job.sitemapId].jobs.push(job.id);
        }
      } catch (error) {
        console.warn('[Sidepanel] Error loading results for job', job.id, error);
      }
    }
    
    console.log('[Sidepanel] Total results loaded:', allResults.length, 'from', Object.keys(resultsByJob).length, 'jobs');
    
    // Update stats
    const totalJobs = Object.keys(resultsByJob).length;
    const totalSitemaps = Object.keys(sitemapStats).length;
    
    document.getElementById('resultsStats').innerHTML = `
      <div class="stat-item">
        <span class="stat-label">Total Results</span>
        <span class="stat-value">${allResults.length}</span>
      </div>
      <div class="stat-item">
        <span class="stat-label">Total Jobs</span>
        <span class="stat-value">${totalJobs}</span>
      </div>
      <div class="stat-item">
        <span class="stat-label">Total Sitemaps</span>
        <span class="stat-value">${totalSitemaps}</span>
      </div>
      <div class="stat-item">
        <span class="stat-label">Status</span>
        <span class="stat-value">All Scraped Data</span>
      </div>
    `;
    
    if (allResults.length === 0) {
      document.getElementById('resultsTableHead').innerHTML = '';
      document.getElementById('resultsTableBody').innerHTML = '<tr><td colspan="100%" class="empty-cell">No scraped results yet. Run a scraping job to see results here.</td></tr>';
      document.getElementById('resultsGroups').innerHTML = '<div class="empty-state"><p>No results available</p></div>';
      return;
    }
    
    // Get all unique keys from all results
    const allKeys = new Set();
    allResults.forEach(r => {
      if (r && typeof r === 'object') {
        Object.keys(r).forEach(k => {
          // Exclude metadata keys from display
          if (!k.startsWith('_')) {
            allKeys.add(k);
          }
        });
      }
    });
    const headers = Array.from(allKeys).sort();
    
    // Add metadata columns at the end
    headers.push('_jobName', '_status', '_date');

    // Build table header
    const thead = document.getElementById('resultsTableHead');
    thead.innerHTML = `<tr>
      ${headers.filter(h => !h.startsWith('_')).map(h => `<th>${h}</th>`).join('')}
      <th>Job</th>
      <th>Status</th>
      <th>Date</th>
    </tr>`;

    // Build table body with all results
    const tbody = document.getElementById('resultsTableBody');
    tbody.innerHTML = allResults.map((row, index) => {
      const dataHeaders = headers.filter(h => !h.startsWith('_'));
      return `
      <tr class="result-row" data-index="${index}" data-job-id="${row._jobId}">
        ${dataHeaders.map(h => `<td class="result-cell" title="${formatCellValue(row[h])}">${formatCellValue(row[h])}</td>`).join('')}
        <td class="result-cell job-name-cell">${row._jobName || 'Unknown'}</td>
        <td class="result-cell status-cell"><span class="status-badge status-${row._status || 'unknown'}">${row._status || 'unknown'}</span></td>
        <td class="result-cell date-cell">${row._date ? new Date(row._date).toLocaleString() : 'Unknown'}</td>
      </tr>
    `;
    }).join('');
    
    // Build grouped view by sitemap
    const groupsContainer = document.getElementById('resultsGroups');
    groupsContainer.innerHTML = Object.values(sitemapStats).map(stat => {
      const jobResults = stat.jobs.map(jobId => resultsByJob[jobId]).filter(Boolean);
      return `
        <div class="results-group">
          <div class="group-header">
            <h3>${stat.sitemapName}</h3>
            <span class="group-count">${stat.totalResults} results from ${stat.jobs.length} job(s)</span>
          </div>
          <div class="group-jobs">
            ${jobResults.map(({job, results}) => `
              <div class="job-results-card">
                <div class="card-header">
                  <span class="job-name">${job.sitemapName || 'Unknown Job'}</span>
                  <span class="job-status status-${job.status}">${job.status}</span>
                  <span class="job-count">${results.length} results</span>
                </div>
                <div class="card-preview">
                  ${results.slice(0, 3).map((r, i) => `
                    <div class="preview-row">
                      ${Object.keys(r).filter(k => !k.startsWith('_')).slice(0, 3).map(k => 
                        `<span class="preview-item"><strong>${k}:</strong> ${formatCellValue(r[k]).substring(0, 50)}</span>`
                      ).join('')}
                    </div>
                  `).join('')}
                  ${results.length > 3 ? `<div class="preview-more">+ ${results.length - 3} more results</div>` : ''}
                </div>
              </div>
            `).join('')}
          </div>
        </div>
      `;
    }).join('');
    
    console.log('[Sidepanel] Results table rendered with', headers.length, 'columns and', allResults.length, 'rows');
    
    // Store all results for export
    window.allScrapedResults = allResults;
    
    showNotification(`Loaded ${allResults.length} results from ${totalJobs} jobs`, 'success');
  } catch (error) {
    console.error('[Sidepanel] Error loading results:', error);
    document.getElementById('resultsStats').innerHTML = `<div class="error-state">Error: ${error.message}</div>`;
    document.getElementById('resultsTableBody').innerHTML = '<tr><td colspan="100%" class="error-cell">Error loading results</td></tr>';
    showNotification('Error loading results: ' + error.message, 'error');
  }
}

// Removed populateJobSelector - no longer needed as we show all results

function formatCellValue(value, fullText = false) {
  if (value === null || value === undefined) return '';
  
  // Handle arrays - extract clean values
  if (Array.isArray(value)) {
    const cleanArray = value
      .map(v => {
        if (typeof v === 'string') {
          // Filter CSS content
          if (v.length > 500 && /\._[a-zA-Z0-9_-]+{/.test(v)) return null;
          return v;
        }
        if (typeof v === 'object' && v !== null) {
          if (v.url) return v.url;
          if (v.text) return v.text;
          if (v.src) return v.src;
          return null;
        }
        return String(v);
      })
      .filter(v => v !== null && v.trim().length > 0);
    const result = cleanArray.join(', ');
    return fullText ? result : (result.length > 100 ? result.substring(0, 100) + '...' : result);
  }
  
  // Handle objects - extract meaningful data
  if (typeof value === 'object') {
    if (value.url) return value.url;
    if (value.text) return value.text;
    if (value.src) return value.src;
    try {
      const str = JSON.stringify(value);
      // Filter CSS dumps
      if (str.length > 500 && /\._[a-zA-Z0-9_-]+{/.test(str)) {
        return '[CSS content - filtered]';
      }
      return fullText ? str : (str.length > 100 ? str.substring(0, 100) + '...' : str);
    } catch (e) {
      return '[Object]';
    }
  }
  
  // Handle strings - filter CSS
  const strValue = String(value);
  if (strValue.length > 1000 && /\._[a-zA-Z0-9_-]+{/.test(strValue)) {
    return '[CSS content - filtered]';
  }
  
  return fullText ? strValue : (strValue.length > 100 ? strValue.substring(0, 100) + '...' : strValue);
}

/**
 * Validate data quality
 */
async function validateDataQuality() {
  try {
    const allResults = window.allScrapedResults || [];
    
    if (allResults.length === 0) {
      showNotification('No data to validate', 'warning');
      return;
    }
    
    // Use DataValidator if available
    if (typeof DataValidator === 'undefined') {
      showNotification('Data validator not loaded', 'error');
      return;
    }
    
    showNotification('Validating data quality...', 'info');
    
    // Clean results first
    const cleanedResults = DataValidator.clean(allResults);
    
    // Validate
    const validation = DataValidator.validate(cleanedResults);
    
    // Display validation results
    const panel = document.getElementById('dataQualityPanel');
    const content = document.getElementById('qualityContent');
    
    const scoreColor = validation.score >= 80 ? 'var(--success)' : 
                       validation.score >= 60 ? 'var(--warning)' : 'var(--error)';
    
    content.innerHTML = `
      <div class="quality-score" style="background: ${scoreColor}20; border-left: 4px solid ${scoreColor}; padding: var(--spacing-md); margin-bottom: var(--spacing-md); border-radius: var(--radius-md);">
        <div style="display: flex; justify-content: space-between; align-items: center;">
          <div>
            <h4 style="margin: 0 0 var(--spacing-xs) 0; color: ${scoreColor};">Quality Score: ${validation.score}/100</h4>
            <p style="margin: 0; color: var(--text-secondary); font-size: 12px;">
              ${validation.validRecords} of ${validation.totalRecords} records are valid (${validation.validPercentage}%)
            </p>
          </div>
          <div style="font-size: 32px; font-weight: bold; color: ${scoreColor};">
            ${validation.score}
          </div>
        </div>
      </div>
      
      ${validation.issues.length > 0 ? `
        <div class="quality-issues">
          <h4 style="margin: 0 0 var(--spacing-sm) 0;">Issues Found (${validation.issues.length})</h4>
          <div style="max-height: 200px; overflow-y: auto;">
            ${validation.issues.slice(0, 10).map(issue => `
              <div style="padding: var(--spacing-sm); background: var(--black-tertiary); border-radius: var(--radius-sm); margin-bottom: var(--spacing-xs);">
                <strong>Record ${issue.recordIndex}</strong> (Score: ${Math.round(issue.score)}/100)
                <ul style="margin: var(--spacing-xs) 0 0 0; padding-left: var(--spacing-lg); font-size: 12px;">
                  ${issue.issues.map(i => `<li>${i}</li>`).join('')}
                </ul>
              </div>
            `).join('')}
            ${validation.issues.length > 10 ? `<p style="text-align: center; color: var(--text-tertiary); font-size: 12px;">... and ${validation.issues.length - 10} more issues</p>` : ''}
          </div>
        </div>
      ` : '<p style="color: var(--success);">No issues found! Data looks good.</p>'}
      
      ${validation.suggestions.length > 0 ? `
        <div class="quality-suggestions" style="margin-top: var(--spacing-md);">
          <h4 style="margin: 0 0 var(--spacing-sm) 0;">Suggestions</h4>
          <ul style="margin: 0; padding-left: var(--spacing-lg);">
            ${validation.suggestions.map(s => `<li style="margin-bottom: var(--spacing-xs);">${s}</li>`).join('')}
          </ul>
        </div>
      ` : ''}
      
      ${validation.emptyFields.length > 0 ? `
        <div class="quality-empty-fields" style="margin-top: var(--spacing-md);">
          <h4 style="margin: 0 0 var(--spacing-sm) 0;">Fields with Many Empty Values</h4>
          <div style="display: flex; flex-wrap: wrap; gap: var(--spacing-sm);">
            ${validation.emptyFields.map(f => `
              <span style="padding: var(--spacing-xs) var(--spacing-sm); background: var(--black-tertiary); border-radius: var(--radius-sm); font-size: 12px;">
                ${f.field} (${f.emptyPercentage}% empty)
              </span>
            `).join('')}
          </div>
        </div>
      ` : ''}
    `;
    
    panel.style.display = 'block';
    showNotification(`Validation complete: ${validation.score}/100 score`, validation.valid ? 'success' : 'warning');
    
  } catch (error) {
    console.error('[Sidepanel] Error validating data:', error);
    showNotification('Error validating data: ' + error.message, 'error');
  }
}

/**
 * Show data preview
 */
async function showDataPreview() {
  try {
    const allResults = window.allScrapedResults || [];
    
    if (allResults.length === 0) {
      showNotification('No data to preview', 'warning');
      return;
    }
    
    const panel = document.getElementById('previewPanel');
    const content = document.getElementById('previewContent');
    const count = document.getElementById('previewCount');
    
    // Show first 10 records
    const previewResults = allResults.slice(0, 10);
    count.textContent = `Showing ${previewResults.length} of ${allResults.length} items`;
    
    // Get all keys
    const allKeys = new Set();
    previewResults.forEach(r => {
      if (r && typeof r === 'object') {
        Object.keys(r).forEach(k => {
          if (!k.startsWith('_')) {
            allKeys.add(k);
          }
        });
      }
    });
    const headers = Array.from(allKeys).sort();
    
    content.innerHTML = `
      <div class="preview-table-container" style="max-height: 400px; overflow-y: auto;">
        <table style="width: 100%; border-collapse: collapse; font-size: 12px;">
          <thead style="position: sticky; top: 0; background: var(--black-tertiary); z-index: 10;">
            <tr>
              ${headers.map(h => `<th style="padding: var(--spacing-sm); text-align: left; border-bottom: 1px solid var(--black-quaternary);">${h}</th>`).join('')}
            </tr>
          </thead>
          <tbody>
            ${previewResults.map((row, index) => `
              <tr style="border-bottom: 1px solid var(--black-quaternary);">
                ${headers.map(h => `
                  <td style="padding: var(--spacing-sm); max-width: 200px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;" title="${formatCellValue(row[h], true)}">
                    ${formatCellValue(row[h])}
                  </td>
                `).join('')}
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
      ${allResults.length > 10 ? `
        <div style="padding: var(--spacing-md); text-align: center; color: var(--text-tertiary); font-size: 12px;">
          Showing first 10 records. Export to see all ${allResults.length} records.
        </div>
      ` : ''}
    `;
    
    panel.style.display = 'block';
    
  } catch (error) {
    console.error('[Sidepanel] Error showing preview:', error);
    showNotification('Error showing preview: ' + error.message, 'error');
  }
}

async function exportResults() {
  // Export all results
  const allResults = window.allScrapedResults || [];
  
  if (!allResults || allResults.length === 0) {
    showNotification('No results to export', 'warning');
    return;
  }
  
  // Remove metadata fields for export
  const cleanResults = allResults.map(r => {
    const clean = {};
    Object.keys(r).forEach(k => {
      if (!k.startsWith('_')) {
        clean[k] = r[k];
      }
    });
    return clean;
  });
  
  // Open export modal
  openExportModal({ sitemapName: 'All Scraped Results' }, cleanResults);
}

function openExportModal(job, results) {
  const modal = document.getElementById('exportModal');
  if (!modal) {
    // Create export modal if it doesn't exist
    createExportModal();
  }
  
  const modalEl = document.getElementById('exportModal');
  modalEl.dataset.jobId = job.id;
  modalEl.dataset.results = JSON.stringify(results);
  modalEl.dataset.jobName = job.sitemapName || 'export';
  
  modalEl.style.display = 'flex';
}

function createExportModal() {
  const modal = document.createElement('div');
  modal.id = 'exportModal';
  modal.className = 'modal';
  modal.style.display = 'none';
  modal.innerHTML = `
    <div class="modal-content">
      <div class="modal-header">
        <h2>Export Results</h2>
        <button class="btn-icon" id="closeExportModalBtn">
          <svg><use href="#icon-close"></use></svg>
        </button>
      </div>
      <div class="modal-body">
        <div class="form-group">
          <label>Export Format</label>
          <div class="export-format-options">
            <label class="format-option">
              <input type="radio" name="exportFormat" value="csv" checked>
              <span>CSV (Comma Separated Values)</span>
            </label>
            <label class="format-option">
              <input type="radio" name="exportFormat" value="json">
              <span>JSON (JavaScript Object Notation)</span>
            </label>
            <label class="format-option">
              <input type="radio" name="exportFormat" value="xlsx">
              <span>Excel (XLSX)</span>
            </label>
            <label class="format-option">
              <input type="radio" name="exportFormat" value="txt">
              <span>Text (TXT)</span>
            </label>
          </div>
        </div>
        <div class="form-group">
          <label>
            <input type="checkbox" id="exportIncludeHeaders" checked>
            Include headers/column names
          </label>
        </div>
        <div class="form-group">
          <label>
            <input type="checkbox" id="exportFlattenNested">
            Flatten nested objects
          </label>
        </div>
      </div>
      <div class="modal-footer">
        <button class="btn-secondary" id="cancelExportBtn">Cancel</button>
        <button class="btn-primary" id="confirmExportBtn">Export</button>
      </div>
    </div>
  `;
  
  document.body.appendChild(modal);
  
  // Event listeners
  document.getElementById('closeExportModalBtn').addEventListener('click', closeExportModal);
  document.getElementById('cancelExportBtn').addEventListener('click', closeExportModal);
  document.getElementById('confirmExportBtn').addEventListener('click', performExport);
}

function closeExportModal() {
  const modal = document.getElementById('exportModal');
  if (modal) {
    modal.style.display = 'none';
  }
}

async function performExport() {
  const modal = document.getElementById('exportModal');
  if (!modal) return;
  
  const jobId = modal.dataset.jobId;
  const jobName = modal.dataset.jobName || 'export';
  const results = JSON.parse(modal.dataset.results);
  
  const format = document.querySelector('input[name="exportFormat"]:checked').value;
  const includeHeaders = document.getElementById('exportIncludeHeaders').checked;
  const flattenNested = document.getElementById('exportFlattenNested').checked;
  
  try {
    let dataToExport = results;
    
    if (flattenNested) {
      dataToExport = ExportManager.flattenResults(results);
    }
    
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
    const filename = `${jobName}_${timestamp}`;
    
    switch (format) {
      case 'csv':
        ExportManager.exportToCSV(dataToExport, `${filename}.csv`);
        break;
      case 'json':
        ExportManager.exportToJSON(dataToExport, `${filename}.json`);
        break;
      case 'xlsx':
        ExportManager.exportToXLSX(dataToExport, `${filename}.xlsx`);
        break;
      case 'txt':
        ExportManager.exportToTXT(dataToExport, `${filename}.txt`);
        break;
      default:
        throw new Error('Unknown export format');
    }
    
    showNotification(`Exported ${results.length} results to ${format.toUpperCase()}`, 'success');
    closeExportModal();
  } catch (error) {
    console.error('[Sidepanel] Export error:', error);
    showNotification('Export error: ' + error.message, 'error');
  }
}

// ============================================================================
// TEST SITEMAP
// ============================================================================

async function testSitemap() {
  if (!currentSitemap) {
    showNotification('No sitemap to test', 'warning');
    return;
  }

  await saveSitemap();
  await startScraping(currentSitemap.id);
}

// ============================================================================
// NOTIFICATIONS
// ============================================================================

function showNotification(message, type = 'info') {
  const notification = document.createElement('div');
  notification.className = `notification ${type}`;
  notification.textContent = message;
  document.body.appendChild(notification);
  
  setTimeout(() => {
    notification.remove();
  }, 3000);
}

// ============================================================================
// SETTINGS
// ============================================================================

function openSettings() {
  const modal = document.getElementById('settingsModal');
  if (!modal) return;
  
  // Load current settings
  loadSettings();
  
  modal.style.display = 'flex';
}

function closeSettings() {
  const modal = document.getElementById('settingsModal');
  if (modal) {
    modal.style.display = 'none';
  }
}

async function loadSettings() {
  try {
    const settings = await StorageManager.getSettings();
    
    if (settings.autoScroll !== undefined) {
      document.getElementById('settingAutoScroll').checked = settings.autoScroll;
    }
    if (settings.waitForImages !== undefined) {
      document.getElementById('settingWaitForImages').checked = settings.waitForImages;
    }
    if (settings.pageDelay !== undefined) {
      document.getElementById('settingPageDelay').value = settings.pageDelay;
    }
    if (settings.maxPages !== undefined) {
      document.getElementById('settingMaxPages').value = settings.maxPages;
    }
    if (settings.exportFormat) {
      document.getElementById('settingExportFormat').value = settings.exportFormat;
    }
    if (settings.includeHeaders !== undefined) {
      document.getElementById('settingIncludeHeaders').checked = settings.includeHeaders;
    }
    if (settings.debugMode !== undefined) {
      document.getElementById('settingDebugMode').checked = settings.debugMode;
    }
    if (settings.autoSave !== undefined) {
      document.getElementById('settingAutoSave').checked = settings.autoSave;
    }
  } catch (error) {
    console.error('[Sidepanel] Error loading settings:', error);
  }
}

async function saveSettings() {
  try {
    const settings = {
      autoScroll: document.getElementById('settingAutoScroll').checked,
      waitForImages: document.getElementById('settingWaitForImages').checked,
      pageDelay: parseInt(document.getElementById('settingPageDelay').value) || 1000,
      maxPages: parseInt(document.getElementById('settingMaxPages').value) || 100,
      exportFormat: document.getElementById('settingExportFormat').value,
      includeHeaders: document.getElementById('settingIncludeHeaders').checked,
      debugMode: document.getElementById('settingDebugMode').checked,
      autoSave: document.getElementById('settingAutoSave').checked
    };
    
    await StorageManager.saveSettings(settings);
    showNotification('Settings saved successfully', 'success');
    closeSettings();
  } catch (error) {
    console.error('[Sidepanel] Error saving settings:', error);
    showNotification('Error saving settings', 'error');
  }
}

async function clearAllData() {
  if (!confirm('Are you sure you want to clear all data? This cannot be undone.')) {
    return;
  }
  
  try {
    await StorageManager.clearAll();
    showNotification('All data cleared', 'success');
    loadSitemaps();
    loadJobs();
    loadResults();
  } catch (error) {
    console.error('[Sidepanel] Error clearing data:', error);
    showNotification('Error clearing data', 'error');
  }
}

async function exportAllData() {
  try {
    const allData = await StorageManager.exportAll();
    const blob = new Blob([JSON.stringify(allData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `scrape-orange-backup-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
    showNotification('All data exported', 'success');
  } catch (error) {
    console.error('[Sidepanel] Error exporting data:', error);
    showNotification('Error exporting data', 'error');
  }
}

  // Settings button
  document.getElementById('settingsBtn')?.addEventListener('click', openSettings);
  document.getElementById('closeSettingsBtn')?.addEventListener('click', closeSettings);
  document.getElementById('cancelSettingsBtn')?.addEventListener('click', closeSettings);
  document.getElementById('saveSettingsBtn')?.addEventListener('click', saveSettings);
  document.getElementById('clearAllDataBtn')?.addEventListener('click', clearAllData);
  document.getElementById('exportAllDataBtn')?.addEventListener('click', exportAllData);

  // Quick Scrape buttons (functions defined in quick-scrape-functions.js)
  const quickScrapeBtn = document.getElementById('quickScrapeBtn');
  if (quickScrapeBtn) {
    quickScrapeBtn.addEventListener('click', () => {
      // Try window object first, then global
      const func = window.startQuickScrape || startQuickScrape;
      if (typeof func === 'function') {
        func();
      } else {
        console.error('[Sidepanel] startQuickScrape function not found');
        console.log('[Sidepanel] Available:', typeof window.startQuickScrape, typeof startQuickScrape);
        showNotification('Error: Scraping function not loaded. Please refresh the extension.', 'error');
      }
    });
  }
  
  const analyzePageBtn = document.getElementById('analyzePageBtn');
  if (analyzePageBtn) {
    analyzePageBtn.addEventListener('click', () => {
      // Try window object first, then global
      const func = window.analyzeCurrentPage || analyzeCurrentPage;
      if (typeof func === 'function') {
        func();
      } else {
        console.error('[Sidepanel] analyzeCurrentPage function not found');
        showNotification('Error: Analysis function not loaded. Please refresh the extension.', 'error');
      }
    });
  }
  
  const saveGeneratedBtn = document.getElementById('saveGeneratedSitemapBtn');
  if (saveGeneratedBtn) {
    saveGeneratedBtn.addEventListener('click', () => {
      if (typeof saveGeneratedSitemap === 'function') {
        saveGeneratedSitemap();
      }
    });
  }
  
  const runGeneratedBtn = document.getElementById('runGeneratedSitemapBtn');
  if (runGeneratedBtn) {
    runGeneratedBtn.addEventListener('click', () => {
      if (typeof runGeneratedSitemap === 'function') {
        runGeneratedSitemap();
      }
    });
  }

  // Quick options buttons
  document.querySelectorAll('.btn-option').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      const option = btn.dataset.option;
      const func = window.addQuickOption || addQuickOption;
      if (typeof func === 'function') {
        func(option);
      }
    });
  });
