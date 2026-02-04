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

  // Export results
  document.getElementById('exportResultsBtn').addEventListener('click', exportResults);

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

  if (tabName === 'sitemaps') {
    loadSitemaps();
  } else if (tabName === 'jobs') {
    loadJobs();
  } else if (tabName === 'results') {
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
          <button class="btn-icon" onclick="editSitemap('${sitemap.id}')" title="Edit">
            <svg><use href="#icon-edit"></use></svg>
          </button>
          <button class="btn-icon" onclick="startScraping('${sitemap.id}')" title="Run">
            <svg><use href="#icon-play"></use></svg>
          </button>
          <button class="btn-icon" onclick="deleteSitemap('${sitemap.id}')" title="Delete">
            <svg><use href="#icon-delete"></use></svg>
          </button>
        </div>
      </div>
    `).join('');
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
        <button class="btn-icon-small" onclick="editSelector('${selector.id}')" title="Edit">
          <svg><use href="#icon-edit"></use></svg>
        </button>
        <button class="btn-icon-small" onclick="deleteSelector('${selector.id}')" title="Delete">
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

    list.innerHTML = jobs.map(job => `
      <div class="job-item" data-id="${job.id}">
        <div class="job-info">
          <h3>${job.sitemapName}</h3>
          <span class="job-status status-${job.status}">${job.status}</span>
          <p class="job-meta">
            ${job.stats?.pagesProcessed || 0} pages • ${job.stats?.resultsCount || 0} results
          </p>
        </div>
        <div class="job-actions">
          ${job.status === 'running' ? `
            <button class="btn-secondary" onclick="stopJob('${job.id}')">Stop</button>
          ` : ''}
          <button class="btn-secondary" onclick="viewJobResults('${job.id}')">View Results</button>
        </div>
      </div>
    `).join('');
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
    await chrome.runtime.sendMessage({
      action: 'stopScraping',
      jobId: jobId
    });
    await loadJobs();
    showNotification('Job stopped', 'success');
  } catch (error) {
    console.error('[Sidepanel] Error stopping job:', error);
    showNotification('Error stopping job', 'error');
  }
}

async function viewJobResults(jobId) {
  switchTab('results');
  document.getElementById('resultsJobSelect').value = jobId;
  await loadResults();
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

function handleScrapingComplete(message) {
  showNotification(`Scraping complete: ${message.resultsCount || 0} results`, 'success');
  loadJobs();
}

// ============================================================================
// RESULTS
// ============================================================================

async function loadResults() {
  const jobId = document.getElementById('resultsJobSelect').value;
  
  if (!jobId) {
    document.getElementById('resultsTableBody').innerHTML = '<tr><td colspan="100%">Select a job to view results</td></tr>';
    return;
  }

  try {
    const results = await StorageManager.getResults(jobId);
    const job = await StorageManager.getJob(jobId);
    
    document.getElementById('resultsStats').innerHTML = `
      <div class="stat-item">
        <span class="stat-label">Total Results</span>
        <span class="stat-value">${results.length}</span>
      </div>
      <div class="stat-item">
        <span class="stat-label">Job Status</span>
        <span class="stat-value">${job?.status || 'unknown'}</span>
      </div>
    `;
    
    if (results.length === 0) {
      document.getElementById('resultsTableBody').innerHTML = '<tr><td colspan="100%">No results yet</td></tr>';
      return;
    }

    const allKeys = new Set();
    results.forEach(r => Object.keys(r).forEach(k => allKeys.add(k)));
    const headers = Array.from(allKeys);

    const thead = document.getElementById('resultsTableHead');
    thead.innerHTML = `<tr>${headers.map(h => `<th>${h}</th>`).join('')}</tr>`;

    const tbody = document.getElementById('resultsTableBody');
    tbody.innerHTML = results.map(row => `
      <tr>${headers.map(h => `<td>${formatCellValue(row[h])}</td>`).join('')}</tr>
    `).join('');
  } catch (error) {
    console.error('[Sidepanel] Error loading results:', error);
    showNotification('Error loading results', 'error');
  }
}

function formatCellValue(value) {
  if (value === null || value === undefined) return '';
  if (typeof value === 'object') return JSON.stringify(value);
  return String(value).substring(0, 100);
}

async function exportResults() {
  const jobId = document.getElementById('resultsJobSelect').value;
  if (!jobId) {
    showNotification('Please select a job', 'warning');
    return;
  }

  const format = prompt('Export format (csv/json):', 'csv');
  if (!format) return;

  try {
    const results = await StorageManager.getResults(jobId);
    const job = await StorageManager.getJob(jobId);
    
    if (format === 'csv') {
      ExportManager.exportToCSV(results, `${job.sitemapName}_${Date.now()}.csv`);
    } else {
      ExportManager.exportToJSON(results, `${job.sitemapName}_${Date.now()}.json`);
    }
    
    showNotification('Export complete', 'success');
  } catch (error) {
    console.error('[Sidepanel] Error exporting:', error);
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

// Export functions to global scope
window.editSitemap = editSitemap;
window.startScraping = startScraping;
window.deleteSitemap = deleteSitemap;
window.editSelector = editSelector;
window.deleteSelector = deleteSelector;
window.stopJob = stopJob;
window.viewJobResults = viewJobResults;
