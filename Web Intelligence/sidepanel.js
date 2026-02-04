// Cortex AI - Premium Side Panel Orchestrator
// Professional-grade UI coordination and feature management

let currentPageData = null;
let streamBuffer = '';
let isStreaming = false;
let currentResults = '';

// Initialize Cortex AI
async function init() {
  await loadPageInfo();
  setupEventListeners();
  setupMessageListeners();
  loadHistory();
}

// Load current page information
async function loadPageInfo() {
  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (tab && tab.url) {
      document.getElementById('pageTitle').textContent = tab.title || 'Untitled Page';
      document.getElementById('pageUrl').textContent = new URL(tab.url).hostname;
      
      // Extract content from page
      await extractPageContent(tab.id);
    } else {
      document.getElementById('pageTitle').textContent = 'No active tab';
      document.getElementById('pageUrl').textContent = '';
    }
  } catch (error) {
    console.error('[Cortex AI] Error loading page info:', error);
    document.getElementById('pageTitle').textContent = 'Error loading page';
  }
}

// Extract content from current page
async function extractPageContent(tabId) {
  try {
    const response = await chrome.tabs.sendMessage(tabId, { action: 'extractContent' });
    if (response && response.success) {
      currentPageData = response.data;
      
      // Update page stats
      document.getElementById('contentLength').textContent = formatContentLength(currentPageData.contentLength);
      document.getElementById('siteType').textContent = capitalizeFirst(currentPageData.siteType);
      document.getElementById('pageStats').style.display = 'flex';
      
      console.log('[Cortex AI] Content extracted:', {
        title: currentPageData.title,
        contentLength: currentPageData.contentLength,
        siteType: currentPageData.siteType
      });
    } else {
      console.warn('[Cortex AI] Content extraction failed:', response?.error);
      currentPageData = response?.data || null;
    }
  } catch (error) {
    console.error('[Cortex AI] Error extracting content:', error);
    // Try to get basic page info
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (tab) {
      currentPageData = {
        url: tab.url,
        title: tab.title,
        content: '',
        siteType: 'default'
      };
    }
  }
}

// Format content length
function formatContentLength(length) {
  if (length < 1000) return `${length} chars`;
  if (length < 1000000) return `${(length / 1000).toFixed(1)}K`;
  return `${(length / 1000000).toFixed(1)}M`;
}

// Capitalize first letter
function capitalizeFirst(str) {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

// Setup all event listeners
function setupEventListeners() {
  // Primary actions
  document.getElementById('summarizeBtn').addEventListener('click', handleSummarize);
  document.getElementById('analyzeBtn').addEventListener('click', showAnalyzeDialog);
  
  // Transform buttons
  document.querySelectorAll('.transform-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const format = e.target.closest('.transform-btn').getAttribute('data-format');
      handleRewrite(format);
    });
  });
  
  // Custom query
  document.getElementById('queryBtn').addEventListener('click', handleCustomQuery);
  document.getElementById('customQuery').addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
      handleCustomQuery();
    }
  });
  
  // Results actions
  document.getElementById('copyBtn').addEventListener('click', copyResults);
  document.getElementById('exportBtn').addEventListener('click', showExportModal);
  document.getElementById('emailBtn').addEventListener('click', showEmailModal);
  document.getElementById('clearBtn').addEventListener('click', clearResults);
  
  // Settings
  document.getElementById('settingsBtn').addEventListener('click', () => {
    chrome.runtime.openOptionsPage();
  });
  
  // Footer links
  document.getElementById('historyBtn').addEventListener('click', showHistory);
  document.getElementById('helpBtn').addEventListener('click', showHelp);
  
  // Modal controls
  document.getElementById('closeExportModal').addEventListener('click', closeExportModal);
  document.getElementById('closeEmailModal').addEventListener('click', closeEmailModal);
  document.getElementById('cancelEmailBtn').addEventListener('click', closeEmailModal);
  document.getElementById('sendEmailBtn').addEventListener('click', sendEmail);
  
  // Export options
  document.querySelectorAll('.export-option').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const format = e.target.closest('.export-option').getAttribute('data-format');
      handleExport(format);
    });
  });
  
  // Close modals on backdrop click
  document.querySelectorAll('.modal').forEach(modal => {
    modal.addEventListener('click', (e) => {
      if (e.target === modal) {
        modal.style.display = 'none';
      }
    });
  });
}

// Setup message listeners for streaming
function setupMessageListeners() {
  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.action === 'streamChunk') {
      appendStreamChunk(message.chunk);
    } else if (message.action === 'pageChanged') {
      loadPageInfo();
    }
  });
}

// Handle summarize action
async function handleSummarize() {
  if (!currentPageData || !currentPageData.content) {
    showError('No content available. Please refresh the page and try again.');
    return;
  }
  
  showLoading();
  clearResults();
  
  try {
    const response = await chrome.runtime.sendMessage({
      action: 'summarize',
      data: currentPageData
    });
    
    if (response && response.success) {
      currentResults = response.data.content;
      displayResults(response.data.content);
      saveToHistory('Summarize', response.data.content);
    } else {
      showError(response?.error || 'Failed to summarize content');
    }
  } catch (error) {
    showError(`Error: ${error.message}`);
  } finally {
    hideLoading();
  }
}

// Show analyze dialog (better than browser prompt)
function showAnalyzeDialog() {
  const query = prompt('What would you like to analyze about this page?\n\nExamples:\n• What are the key risks?\n• What are the main takeaways?\n• What should I do next?');
  if (query && query.trim()) {
    handleAnalyze(query.trim());
  }
}

// Handle analyze with query
async function handleAnalyze(query) {
  if (!currentPageData || !currentPageData.content) {
    showError('No content available. Please refresh the page and try again.');
    return;
  }
  
  if (!query || !query.trim()) {
    showError('Please enter a question');
    return;
  }
  
  showLoading();
  clearResults();
  
  try {
    const response = await chrome.runtime.sendMessage({
      action: 'analyze',
      data: currentPageData,
      query: query.trim()
    });
    
    if (response && response.success) {
      currentResults = response.data.content;
      displayResults(`**Question:** ${query}\n\n**Answer:**\n\n${response.data.content}`);
      saveToHistory(`Analyze: ${query}`, response.data.content);
    } else {
      showError(response?.error || 'Failed to analyze content');
    }
  } catch (error) {
    showError(`Error: ${error.message}`);
  } finally {
    hideLoading();
  }
}

// Handle rewrite action
async function handleRewrite(format) {
  if (!currentPageData || !currentPageData.content) {
    showError('No content available. Please refresh the page and try again.');
    return;
  }
  
  showLoading();
  clearResults();
  
  try {
    const response = await chrome.runtime.sendMessage({
      action: 'rewrite',
      data: currentPageData,
      format: format
    });
    
    if (response && response.success) {
      currentResults = response.data.content;
      displayResults(response.data.content);
      saveToHistory(`Rewrite: ${format}`, response.data.content);
    } else {
      showError(response?.error || 'Failed to rewrite content');
    }
  } catch (error) {
    showError(`Error: ${error.message}`);
  } finally {
    hideLoading();
  }
}

// Handle custom query
async function handleCustomQuery() {
  const query = document.getElementById('customQuery').value.trim();
  if (!query) {
    showError('Please enter a question');
    return;
  }
  
  await handleAnalyze(query);
  document.getElementById('customQuery').value = '';
}

// Display results
function displayResults(content) {
  const container = document.getElementById('resultsContainer');
  const contentEl = document.getElementById('resultsContent');
  
  // Format markdown-like content
  const formatted = formatContent(content);
  contentEl.innerHTML = formatted;
  
  container.style.display = 'block';
  document.getElementById('errorContainer').style.display = 'none';
  
  // Scroll to results
  container.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

// Append streaming chunk
function appendStreamChunk(chunk) {
  if (!isStreaming) {
    isStreaming = true;
    showLoading();
    clearResults();
    document.getElementById('resultsContainer').style.display = 'block';
  }
  
  streamBuffer += chunk;
  currentResults = streamBuffer;
  const contentEl = document.getElementById('resultsContent');
  const formatted = formatContent(streamBuffer);
  contentEl.innerHTML = formatted;
  
  // Auto-scroll to bottom
  contentEl.scrollTop = contentEl.scrollHeight;
}

// Enhanced content formatting
function formatContent(text) {
  if (!text) return '';
  
  return text
    // Headers
    .replace(/^### (.*$)/gim, '<h3>$1</h3>')
    .replace(/^## (.*$)/gim, '<h2>$1</h2>')
    .replace(/^# (.*$)/gim, '<h1>$1</h1>')
    // Bold and italic
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.*?)\*/g, '<em>$1</em>')
    // Lists
    .replace(/^\d+\.\s+(.*$)/gim, '<li>$1</li>')
    .replace(/^[-*]\s+(.*$)/gim, '<li>$1</li>')
    // Paragraphs
    .split('\n\n')
    .map(para => {
      if (para.trim().startsWith('<h') || para.trim().startsWith('<li>') || para.trim().startsWith('<ul>')) {
        return para;
      }
      return para.trim() ? `<p>${para.trim()}</p>` : '';
    })
    .join('')
    // Wrap consecutive list items in ul
    .replace(/(<li>.*?<\/li>\s*)+/g, '<ul>$&</ul>')
    .replace(/<\/ul>\s*<ul>/g, '');
}

// Show loading indicator
function showLoading() {
  document.getElementById('loadingIndicator').style.display = 'block';
  isStreaming = true;
}

// Hide loading indicator
function hideLoading() {
  document.getElementById('loadingIndicator').style.display = 'none';
  isStreaming = false;
  streamBuffer = '';
}

// Clear results
function clearResults() {
  document.getElementById('resultsContent').innerHTML = '';
  document.getElementById('resultsContainer').style.display = 'none';
  streamBuffer = '';
  currentResults = '';
}

// Show error
function showError(message) {
  const errorContainer = document.getElementById('errorContainer');
  const errorMessage = document.getElementById('errorMessage');
  errorMessage.textContent = message;
  errorContainer.style.display = 'flex';
  hideLoading();
  
  // Auto-hide after 5 seconds
  setTimeout(() => {
    errorContainer.style.display = 'none';
  }, 5000);
}

// Copy results to clipboard
async function copyResults() {
  if (!currentResults) {
    showError('No results to copy');
    return;
  }
  
  try {
    await navigator.clipboard.writeText(currentResults);
    const btn = document.getElementById('copyBtn');
    const original = btn.innerHTML;
    btn.innerHTML = '<svg width="18" height="18" viewBox="0 0 18 18" fill="none"><path d="M6 8L8 10L12 6" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>';
    btn.style.color = 'var(--success)';
    setTimeout(() => {
      btn.innerHTML = original;
      btn.style.color = '';
    }, 2000);
  } catch (error) {
    showError('Failed to copy to clipboard');
  }
}

// Show export modal
function showExportModal() {
  if (!currentResults) {
    showError('No results to export');
    return;
  }
  document.getElementById('exportModal').style.display = 'flex';
}

// Close export modal
function closeExportModal() {
  document.getElementById('exportModal').style.display = 'none';
}

// Handle export
function handleExport(format) {
  if (!currentResults) {
    showError('No results to export');
    return;
  }
  
  const filename = `cortex-ai-${Date.now()}.${format}`;
  let content = currentResults;
  let mimeType = 'text/plain';
  
  if (format === 'md') {
    mimeType = 'text/markdown';
  } else if (format === 'pdf') {
    // For PDF, we'll create a text file (true PDF requires library)
    showError('PDF export coming soon. Exporting as text file instead.');
    format = 'txt';
  }
  
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
  
  closeExportModal();
  showSuccess('File downloaded successfully!');
}

// Show email modal
function showEmailModal() {
  if (!currentResults) {
    showError('No results to email');
    return;
  }
  
  // Pre-fill subject
  const subject = currentPageData?.title 
    ? `AI Analysis: ${currentPageData.title.substring(0, 50)}`
    : 'AI Analysis Results';
  document.getElementById('emailSubject').value = subject;
  
  document.getElementById('emailModal').style.display = 'flex';
}

// Close email modal
function closeEmailModal() {
  document.getElementById('emailModal').style.display = 'none';
  document.getElementById('emailRecipient').value = '';
  document.getElementById('emailSubject').value = '';
  document.getElementById('emailMessage').value = '';
}

// Send email
function sendEmail() {
  const recipient = document.getElementById('emailRecipient').value.trim();
  const subject = document.getElementById('emailSubject').value.trim();
  const message = document.getElementById('emailMessage').value.trim();
  
  if (!recipient) {
    showError('Please enter a recipient email');
    return;
  }
  
  if (!validateEmail(recipient)) {
    showError('Please enter a valid email address');
    return;
  }
  
  // Create mailto link
  const body = `${message ? message + '\n\n' : ''}${currentResults}`;
  const mailtoLink = `mailto:${recipient}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  
  window.location.href = mailtoLink;
  closeEmailModal();
  showSuccess('Email client opened!');
}

// Validate email
function validateEmail(email) {
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return re.test(email);
}

// Show success message
function showSuccess(message) {
  const errorContainer = document.getElementById('errorContainer');
  const errorMessage = document.getElementById('errorMessage');
  errorContainer.className = 'error-card';
  errorContainer.style.background = 'linear-gradient(135deg, #D1FAE5 0%, #A7F3D0 100%)';
  errorContainer.style.borderColor = '#6EE7B7';
  errorMessage.textContent = message;
  errorContainer.style.display = 'flex';
  
  setTimeout(() => {
    errorContainer.style.display = 'none';
    errorContainer.className = 'error-card';
    errorContainer.style.background = '';
    errorContainer.style.borderColor = '';
  }, 3000);
}

// Save to history
async function saveToHistory(action, content) {
  try {
    const history = await chrome.storage.local.get(['analysisHistory']);
    const historyList = history.analysisHistory || [];
    
    historyList.unshift({
      id: Date.now(),
      action: action,
      content: content.substring(0, 500), // Store preview
      fullContent: content,
      url: currentPageData?.url || '',
      title: currentPageData?.title || '',
      timestamp: new Date().toISOString()
    });
    
    // Keep only last 50 items
    if (historyList.length > 50) {
      historyList.splice(50);
    }
    
    await chrome.storage.local.set({ analysisHistory: historyList });
  } catch (error) {
    console.error('[Cortex AI] Error saving history:', error);
  }
}

// Load history
async function loadHistory() {
  try {
    const history = await chrome.storage.local.get(['analysisHistory']);
    // History loaded, can be displayed in UI if needed
  } catch (error) {
    console.error('[Cortex AI] Error loading history:', error);
  }
}

// Show history
function showHistory() {
  alert('History feature coming soon! Your analysis history is being saved automatically.');
}

// Show help
function showHelp() {
  alert('Cortex AI Help\n\n' +
    '• Click "Summarize" to get AI-powered summaries\n' +
    '• Use "Analyze" to ask questions about the page\n' +
    '• Transform content into different formats\n' +
    '• Export results or email them\n' +
    '• All your analysis is saved automatically\n\n' +
    'Keyboard Shortcut: Ctrl+Shift+I (Cmd+Shift+I on Mac)');
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
