/**
 * WebScraper Pro - Sidepanel Controller
 * Main UI logic for sitemap builder and job management
 */

// ============================================================================
// GLOBAL STATE
// ============================================================================

let currentSitemap = null;
let currentSelector = null;
let visualSelectorActive = false;

// ============================================================================
// INITIALIZATION
// ============================================================================

document.addEventListener('DOMContentLoaded', async () => {
  await initializeApp();
});

async function initializeApp() {
  // Load sitemaps
  await loadSitemaps();
  
  // Load jobs
  await loadJobs();
  
  // Set up event listeners
  setupEventListeners();
  
  // Set up message listeners
  setupMessageListeners();
  
  console.log('[Sidepanel] Initialized');
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
  document.getElementById('createSitemapBtn').addEventListener('click', () => {
    createNewSitemap();
  });

  // Close editor
  document.getElementById('closeEditorBtn').addEventListener('click', () => {
    closeSitemapEditor();
  });

  // Save sitemap
  document.getElementById('saveSitemapBtn').addEventListener('click', () => {
    saveSitemap();
  });

  // Test sitemap
  document.getElementById('testSitemapBtn').addEventListener('click', () => {
    testSitemap();
  });

  // Add selector
  document.getElementById('addSelectorBtn').addEventListener('click', () => {
    addSelector();
  });

  // Visual selector controls
  document.getElementById('stopSelectorBtn').addEventListener('click', () => {
    deactivateVisualSelector();
  });

  document.getElementById('clearSelectionsBtn').addEventListener('click', () => {
    clearSelections();
  });

  // Export results
  document.getElementById('exportResultsBtn').addEventListener('click', () => {
    exportResults();
  });

  // Selector modal
  document.getElementById('closeModalBtn').addEventListener('click', () => {
    closeSelectorModal();
  });

  document.getElementById('cancelSelectorBtn').addEventListener('click', () => {
    closeSelectorModal();
  });

  document.getElementById('saveSelectorBtn').addEventListener('click', () => {
    saveSelector();
  });

  // Selector type change
  document.getElementById('selectorType').addEventListener('change', (e) => {
    const type = e.target.value;
    const attributeGroup = document.getElementById('attributeGroup');
    attributeGroup.style.display = type === 'SelectorAttribute' ? 'block' : 'none';
  });
}

// ============================================================================
// TAB MANAGEMENT
// ============================================================================

function switchTab(tabName) {
  // Update tab buttons
  document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.tab === tabName);
  });

  // Update panels
  document.querySelectorAll('.tab-panel').forEach(panel => {
    panel.classList.toggle('active', panel.id === `panel${tabName.charAt(0).toUpperCase() + tabName.slice(1)}`);
  });

  // Load data for active tab
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
  const sitemaps = await StorageManager.getSitemaps();
  const list = document.getElementById('sitemapList');
  
  if (sitemaps.length === 0) {
    list.innerHTML = `
      <div class="empty-state">
        <p>No sitemaps yet. Create your first sitemap to get started.</p>
      </div>
    `;
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
        <button class="btn-icon" onclick="editSitemap('${sitemap.id}')" title="Edit">✏️</button>
        <button class="btn-icon" onclick="startScraping('${sitemap.id}')" title="Run">▶️</button>
        <button class="btn-icon" onclick="deleteSitemap('${sitemap.id}')" title="Delete">🗑️</button>
      </div>
    </div>
  `).join('');
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
  currentSitemap = await StorageManager.getSitemap(id);
  if (!currentSitemap) {
    alert('Sitemap not found');
    return;
  }

  openSitemapEditor();
}

function openSitemapEditor() {
  document.getElementById('sitemapEditor').style.display = 'block';
  document.getElementById('sitemapList').style.display = 'none';
  
  // Populate form
  document.getElementById('editorTitle').textContent = currentSitemap.name || 'New Sitemap';
  document.getElementById('sitemapName').value = currentSitemap.name || '';
  document.getElementById('sitemapStartUrl').value = currentSitemap.startUrl || '';
  
  // Load selectors
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
    alert('Please enter a sitemap name');
    return;
  }

  if (!startUrl) {
    alert('Please enter a start URL');
    return;
  }

  currentSitemap.name = name;
  currentSitemap.startUrl = startUrl;

  await StorageManager.saveSitemap(currentSitemap);
  
  alert('Sitemap saved!');
  closeSitemapEditor();
  loadSitemaps();
}

function loadSelectorsTree() {
  const tree = document.getElementById('selectorsTree');
  
  if (!currentSitemap.selectors || currentSitemap.selectors.length === 0) {
    tree.innerHTML = '<p class="empty-state">No selectors. Click "Add Selector" to create one.</p>';
    return;
  }

  // Build tree structure
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

  return `
    <div class="selector-node" data-id="${selector.id}">
      <div class="selector-header">
        <span class="selector-icon">${getSelectorIcon(selector.type)}</span>
        <span class="selector-name">${selector.id}</span>
        <span class="selector-type">${selector.type}</span>
        <button class="btn-icon-small" onclick="editSelector('${selector.id}')">✏️</button>
        <button class="btn-icon-small" onclick="deleteSelector('${selector.id}')">🗑️</button>
      </div>
      ${children.length > 0 ? `
        <div class="selector-children">
          ${children.map(child => renderSelectorNode(child, allSelectors)).join('')}
        </div>
      ` : ''}
    </div>
  `;
}

function getSelectorIcon(type) {
  const icons = {
    'SelectorElement': '📦',
    'SelectorText': '📝',
    'SelectorLink': '🔗',
    'SelectorImage': '🖼️',
    'SelectorAttribute': '🏷️',
    'SelectorHTML': '📄',
    'SelectorTable': '📊'
  };
  return icons[type] || '📌';
}

function addSelector() {
  // Activate visual selector
  activateVisualSelector();
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
    
    // Update parent selectors
    const parentSelect = document.getElementById('selectorParent');
    parentSelect.innerHTML = `
      <option value="_root">_root</option>
      ${currentSitemap.selectors.filter(s => s.id !== currentSelector?.id).map(s => 
        `<option value="${s.id}" ${currentSelector?.parentSelectors?.includes(s.id) ? 'selected' : ''}>${s.id}</option>`
      ).join('')}
    `;
  } else {
    // New selector
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
    alert('Please enter a selector ID');
    return;
  }

  if (!css) {
    alert('Please enter a CSS selector');
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

  // Update or add selector
  if (currentSelector) {
    const index = currentSitemap.selectors.findIndex(s => s.id === currentSelector.id);
    currentSitemap.selectors[index] = selector;
  } else {
    currentSitemap.selectors.push(selector);
  }

  closeSelectorModal();
  loadSelectorsTree();
}

function deleteSelector(id) {
  if (!confirm('Delete this selector?')) return;
  
  currentSitemap.selectors = currentSitemap.selectors.filter(s => s.id !== id);
  // Also remove as parent from other selectors
  currentSitemap.selectors.forEach(s => {
    s.parentSelectors = s.parentSelectors.filter(p => p !== id);
  });
  
  loadSelectorsTree();
}

async function deleteSitemap(id) {
  if (!confirm('Delete this sitemap?')) return;
  
  await StorageManager.deleteSitemap(id);
  loadSitemaps();
}

// ============================================================================
// VISUAL SELECTOR
// ============================================================================

async function activateVisualSelector() {
  visualSelectorActive = true;
  document.getElementById('visualSelectorControls').style.display = 'block';
  
  // Get current tab
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  
  // Send message to content script
  chrome.tabs.sendMessage(tab.id, { action: 'activateVisualSelector' });
}

function deactivateVisualSelector() {
  visualSelectorActive = false;
  document.getElementById('visualSelectorControls').style.display = 'none';
  
  chrome.tabs.query({ active: true, currentWindow: true }).then(([tab]) => {
    chrome.tabs.sendMessage(tab.id, { action: 'deactivateVisualSelector' });
  });
}

function clearSelections() {
  chrome.tabs.query({ active: true, currentWindow: true }).then(([tab]) => {
    chrome.tabs.sendMessage(tab.id, { action: 'clearSelections' });
  });
}

// ============================================================================
// MESSAGE LISTENERS
// ============================================================================

function setupMessageListeners() {
  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.action === 'elementSelected') {
      handleElementSelected(message.data);
      sendResponse({ success: true });
    }
  });
}

function handleElementSelected(data) {
  // Auto-fill selector form
  document.getElementById('selectorCss').value = data.selector;
  document.getElementById('selectorMultiple').checked = data.similarCount > 1;
  
  // Suggest ID
  if (!document.getElementById('selectorId').value) {
    const suggestedId = data.element + '_' + Date.now().toString().slice(-4);
    document.getElementById('selectorId').value = suggestedId;
  }
  
  // Open modal if not open
  if (document.getElementById('selectorModal').style.display === 'none') {
    openSelectorModal();
  }
}

// ============================================================================
// JOB MANAGEMENT
// ============================================================================

async function loadJobs() {
  const jobs = await StorageManager.getJobs();
  const list = document.getElementById('jobsList');
  
  if (jobs.length === 0) {
    list.innerHTML = '<div class="empty-state"><p>No jobs yet.</p></div>';
    return;
  }

  list.innerHTML = jobs.map(job => `
    <div class="job-item" data-id="${job.id}">
      <div class="job-info">
        <h3>${job.sitemapName}</h3>
        <p class="job-status status-${job.status}">${job.status}</p>
        <p class="job-meta">
          ${job.stats?.pagesProcessed || 0} pages • 
          ${job.stats?.resultsCount || 0} results
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
}

async function startScraping(sitemapId) {
  try {
    const response = await chrome.runtime.sendMessage({
      action: 'startScraping',
      sitemapId: sitemapId
    });
    
    if (response.success) {
      alert('Scraping started!');
      switchTab('jobs');
      loadJobs();
    } else {
      alert('Error: ' + response.error);
    }
  } catch (error) {
    alert('Error starting scraping: ' + error.message);
  }
}

async function stopJob(jobId) {
  try {
    await chrome.runtime.sendMessage({
      action: 'stopScraping',
      jobId: jobId
    });
    loadJobs();
  } catch (error) {
    alert('Error stopping job: ' + error.message);
  }
}

async function viewJobResults(jobId) {
  switchTab('results');
  document.getElementById('resultsJobSelect').value = jobId;
  await loadResults();
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

  const results = await StorageManager.getResults(jobId);
  const job = await StorageManager.getJob(jobId);
  
  // Update stats
  document.getElementById('resultsStats').innerHTML = `
    <div class="stat-item">
      <span class="stat-label">Total Results:</span>
      <span class="stat-value">${results.length}</span>
    </div>
    <div class="stat-item">
      <span class="stat-label">Job Status:</span>
      <span class="stat-value">${job?.status || 'unknown'}</span>
    </div>
  `;
  
  if (results.length === 0) {
    document.getElementById('resultsTableBody').innerHTML = '<tr><td colspan="100%">No results yet</td></tr>';
    return;
  }

  // Get all keys
  const allKeys = new Set();
  results.forEach(r => Object.keys(r).forEach(k => allKeys.add(k)));
  const headers = Array.from(allKeys);

  // Build table
  const thead = document.getElementById('resultsTableHead');
  thead.innerHTML = `<tr>${headers.map(h => `<th>${h}</th>`).join('')}</tr>`;

  const tbody = document.getElementById('resultsTableBody');
  tbody.innerHTML = results.map(row => `
    <tr>${headers.map(h => `<td>${formatCellValue(row[h])}</td>`).join('')}</tr>
  `).join('');
}

function formatCellValue(value) {
  if (value === null || value === undefined) return '';
  if (typeof value === 'object') return JSON.stringify(value);
  return String(value).substring(0, 100);
}

async function exportResults() {
  const jobId = document.getElementById('resultsJobSelect').value;
  if (!jobId) {
    alert('Please select a job');
    return;
  }

  const format = prompt('Export format (csv/json):', 'csv');
  if (!format) return;

  try {
    await chrome.runtime.sendMessage({
      action: 'exportResults',
      jobId: jobId,
      format: format
    });
    
    // Handle export in sidepanel (since service worker can't download)
    const results = await StorageManager.getResults(jobId);
    const job = await StorageManager.getJob(jobId);
    
    if (format === 'csv') {
      ExportManager.exportToCSV(results, `${job.sitemapName}_${Date.now()}.csv`);
    } else {
      ExportManager.exportToJSON(results, `${job.sitemapName}_${Date.now()}.json`);
    }
    
    alert('Export complete!');
  } catch (error) {
    alert('Export error: ' + error.message);
  }
}

// ============================================================================
// TEST SITEMAP
// ============================================================================

async function testSitemap() {
  if (!currentSitemap) {
    alert('No sitemap to test');
    return;
  }

  // Save first
  await saveSitemap();
  
  // Start scraping
  await startScraping(currentSitemap.id);
}

// Export functions to global scope
window.editSitemap = editSitemap;
window.startScraping = startScraping;
window.deleteSitemap = deleteSitemap;
window.editSelector = editSelector;
window.deleteSelector = deleteSelector;
window.stopJob = stopJob;
window.viewJobResults = viewJobResults;
