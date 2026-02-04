// Lumina Write - The Transformer
// Comprehensive orchestration with all premium features

let selectedText = '';
let humanizedText = '';
let currentMetrics = null;
let currentStyle = 'professional';
let streamPort = null;
let totalChars = 0;
let streamedChars = 0;

// Initialize
document.addEventListener('DOMContentLoaded', async () => {
  await initializeUI();
  setupEventListeners();
  setupKeyboardShortcuts();
  await loadSettings();
  checkForSelectedText();
  
  // Listen for text selection from content script
  chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === 'textSelected') {
      handleTextSelection(request.text);
    }
  });

  // Listen for keyboard shortcuts
  chrome.runtime.onMessage.addListener((request) => {
    if (request.action === 'humanize') {
      if (selectedText) humanizeText(selectedText);
    } else if (request.action === 'copy') {
      copyHumanizedText();
    } else if (request.action === 'replace') {
      replaceOriginalText();
    }
  });
});

// Initialize UI
async function initializeUI() {
  updateStatus('ready', 'Ready');
  await loadHistory();
}

// Setup event listeners
function setupEventListeners() {
  // Humanize button
  document.getElementById('humanizeBtn').addEventListener('click', () => {
    if (selectedText) {
      humanizeText(selectedText);
    } else {
      checkForSelectedText();
    }
  });

  // Action buttons
  document.getElementById('copyBtn').addEventListener('click', copyHumanizedText);
  document.getElementById('replaceBtn').addEventListener('click', replaceOriginalText);
  document.getElementById('exportBtn').addEventListener('click', exportText);
  document.getElementById('metricsBtn').addEventListener('click', toggleMetrics);

  // Settings
  document.getElementById('settingsToggle').addEventListener('click', toggleSettings);
  document.getElementById('closeSettings').addEventListener('click', toggleSettings);
  document.getElementById('temperature').addEventListener('input', (e) => {
    document.getElementById('temperatureValue').textContent = e.target.value;
    saveSettings({ temperature: parseFloat(e.target.value) });
  });
  document.getElementById('model').addEventListener('change', (e) => {
    saveSettings({ model: e.target.value });
  });
  document.getElementById('autoSave').addEventListener('change', (e) => {
    saveSettings({ autoSave: e.target.checked });
  });
  document.getElementById('showMetrics').addEventListener('change', (e) => {
    saveSettings({ showMetrics: e.target.checked });
  });
  document.getElementById('compareView').addEventListener('change', (e) => {
    saveSettings({ compareView: e.target.checked });
    if (e.target.checked && humanizedText) {
      showCompareView();
    }
  });

  // Writing style buttons
  document.querySelectorAll('.style-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const style = btn.dataset.style;
      selectWritingStyle(style);
    });
  });

  // View toggle
  document.getElementById('viewHumanizedBtn').addEventListener('click', () => showHumanizedView());
  document.getElementById('viewCompareBtn').addEventListener('click', () => showCompareView());

  // History
  document.getElementById('historyToggle').addEventListener('click', toggleHistory);
  document.getElementById('closeHistory').addEventListener('click', toggleHistory);
  document.getElementById('clearHistoryBtn').addEventListener('click', clearHistory);

  // Metrics
  document.getElementById('closeMetrics').addEventListener('click', toggleMetrics);
}

// Setup keyboard shortcuts
function setupKeyboardShortcuts() {
  document.addEventListener('keydown', (e) => {
    // Ctrl+Shift+H - Humanize
    if (e.ctrlKey && e.shiftKey && e.key === 'H') {
      e.preventDefault();
      if (selectedText) humanizeText(selectedText);
    }
    // Ctrl+Shift+C - Copy
    else if (e.ctrlKey && e.shiftKey && e.key === 'C') {
      e.preventDefault();
      copyHumanizedText();
    }
    // Ctrl+Shift+R - Replace
    else if (e.ctrlKey && e.shiftKey && e.key === 'R') {
      e.preventDefault();
      replaceOriginalText();
    }
  });
}

// Load settings
async function loadSettings() {
  if (typeof luminaStorage === 'undefined') {
    // Wait for storage.js to load
    setTimeout(loadSettings, 100);
    return;
  }

  const settings = await luminaStorage.getSettings();
  document.getElementById('temperature').value = settings.temperature;
  document.getElementById('temperatureValue').textContent = settings.temperature;
  document.getElementById('model').value = settings.model;
  document.getElementById('autoSave').checked = settings.autoSave;
  document.getElementById('showMetrics').checked = settings.showMetrics;
  document.getElementById('compareView').checked = settings.compareView;
  
  currentStyle = settings.writingStyle || 'professional';
  selectWritingStyle(currentStyle, false);
}

// Save settings
async function saveSettings(updates) {
  if (typeof luminaStorage === 'undefined') return;
  await luminaStorage.saveSettings(updates);
}

// Select writing style
function selectWritingStyle(style, save = true) {
  currentStyle = style;
  
  // Update UI
  document.querySelectorAll('.style-btn').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.style === style);
  });

  if (save) {
    saveSettings({ writingStyle: style });
  }
}

// Check for selected text
async function checkForSelectedText() {
  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    
    if (tab && (tab.url.includes('office.com') || tab.url.includes('office365.com') || 
                tab.url.includes('microsoft.com'))) {
      const tryGetSelection = (attempt = 1) => {
        chrome.tabs.sendMessage(tab.id, { action: 'getSelectedText' }, (response) => {
          if (chrome.runtime.lastError) {
            if (attempt < 3) {
              setTimeout(() => tryGetSelection(attempt + 1), 500);
            }
            return;
          }
          
          if (response && response.success && response.text && response.text.length > 5) {
            handleTextSelection(response.text);
          } else if (attempt < 3) {
            setTimeout(() => tryGetSelection(attempt + 1), 300);
          }
        });
      };
      
      tryGetSelection();
    }
  } catch (error) {
    console.error('[Lumina] Error checking selected text:', error);
  }
}

// Handle text selection
function handleTextSelection(text) {
  if (!text || text.trim().length < 5) {
    updateStatus('error', 'Text too short');
    return;
  }

  selectedText = text.trim();
  
  // Show original text
  const originalSection = document.getElementById('originalSection');
  const originalTextEl = document.getElementById('originalText');
  originalTextEl.textContent = selectedText;
  originalSection.style.display = 'block';

  // Show actions
  document.getElementById('actions').style.display = 'flex';
  
  // Update instructions
  document.getElementById('instructions').innerHTML = 
    `<p>✨ <strong>${selectedText.length}</strong> characters selected. Click "Humanize" to transform.</p>`;

  // Clear previous output
  clearOutput();
  updateStatus('ready', 'Ready to humanize');
}

// Humanize text with streaming
async function humanizeText(text) {
  if (!text || text.trim().length < 5) {
    updateStatus('error', 'Please select at least 5 characters');
    return;
  }

  // Show loading
  showLoading(true);
  clearOutput();
  updateStatus('processing', 'Humanizing...');
  
  // Reset progress
  totalChars = text.length;
  streamedChars = 0;
  updateProgress(0);

  // Get settings
  const settings = await (typeof luminaStorage !== 'undefined' ? luminaStorage.getSettings() : Promise.resolve({}));
  const finalSettings = {
    temperature: parseFloat(document.getElementById('temperature').value),
    model: document.getElementById('model').value,
    writingStyle: currentStyle,
    ...settings
  };

  try {
    // Connect to background for streaming
    streamPort = chrome.runtime.connect({ name: 'lumina-stream' });

    // Send humanize request
    streamPort.postMessage({
      action: 'humanize',
      text: text,
      settings: finalSettings
    });

    // Listen for stream chunks
    streamPort.onMessage.addListener((message) => {
      if (message.type === 'chunk') {
        // Append chunk to output (streaming effect)
        appendToOutput(message.text);
        streamedChars += message.text.length;
        
        // Update progress (rough estimate)
        const progress = Math.min(95, (streamedChars / (totalChars * 1.5)) * 100);
        updateProgress(progress);
      } else if (message.type === 'complete') {
        // Humanization complete
        humanizedText = message.fullText;
        currentMetrics = message.metrics;
        
        updateProgress(100);
        showMetrics(currentMetrics);
        showLoading(false);
        updateStatus('success', 'Humanized successfully');
        
        // Show actions and view toggle
        document.getElementById('actions').style.display = 'flex';
        document.getElementById('viewToggle').style.display = 'flex';
        
        // Update compare view if enabled
        if (settings.compareView) {
          showCompareView();
        }
        
        // Save to history if auto-save enabled
        if (settings.autoSave !== false) {
          saveToHistory(text, humanizedText, currentStyle, currentMetrics);
        }
        
        // Update stats
        if (typeof luminaStorage !== 'undefined') {
          luminaStorage.updateStats('humanize', {
            wordCount: currentMetrics.wordCount.humanized,
            score: currentMetrics.humanScore,
            style: currentStyle
          });
        }
        
        // Close port
        if (streamPort) {
          streamPort.disconnect();
          streamPort = null;
        }
      } else if (message.type === 'error') {
        // Error occurred
        showError(message.error);
        showLoading(false);
        updateProgress(0);
        updateStatus('error', 'Humanization failed');
        
        if (streamPort) {
          streamPort.disconnect();
          streamPort = null;
        }
      }
    });

    streamPort.onDisconnect.addListener(() => {
      if (chrome.runtime.lastError) {
        showError('Connection lost. Please try again.');
        showLoading(false);
        updateProgress(0);
        updateStatus('error', 'Connection error');
      }
    });

  } catch (error) {
    console.error('[Lumina] Humanization error:', error);
    showError(error.message || 'Failed to humanize text');
    showLoading(false);
    updateProgress(0);
    updateStatus('error', 'Error');
  }
}

// Update progress bar
function updateProgress(percent) {
  const container = document.getElementById('progressContainer');
  const fill = document.getElementById('progressFill');
  const text = document.getElementById('progressText');
  
  if (percent > 0) {
    container.style.display = 'block';
    fill.style.width = `${percent}%`;
    text.textContent = `${Math.round(percent)}%`;
  } else {
    container.style.display = 'none';
  }
}

// Append text chunk to output (streaming effect)
function appendToOutput(chunk) {
  const output = document.getElementById('output');
  const placeholder = output.querySelector('.placeholder-text');
  
  if (placeholder) {
    placeholder.remove();
  }

  // Create or get text element
  let textEl = output.querySelector('.streaming-text');
  if (!textEl) {
    textEl = document.createElement('div');
    textEl.className = 'streaming-text';
    output.appendChild(textEl);
  }

  // Append chunk with animation
  textEl.textContent += chunk;
  
  // Scroll to bottom
  output.scrollTop = output.scrollHeight;
}

// Clear output
function clearOutput() {
  const output = document.getElementById('output');
  output.innerHTML = `
    <div class="placeholder-text">
      <svg width="48" height="48" viewBox="0 0 48 48" fill="none" opacity="0.3">
        <path d="M24 4L30.27 15.39L43 16.91L34 25.21L36.27 38L24 32.66L11.73 38L14 25.21L5 16.91L17.73 15.39L24 4Z" 
              stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
      </svg>
      <p>Humanized text will appear here...</p>
    </div>
  `;
  humanizedText = '';
  currentMetrics = null;
  document.getElementById('metricsSummary').style.display = 'none';
  document.getElementById('viewToggle').style.display = 'none';
  document.getElementById('compareView').style.display = 'none';
}

// Show metrics
async function showMetrics(metrics) {
  if (!metrics) return;
  
  currentMetrics = metrics;
  
  // Update summary
  const summary = document.getElementById('metricsSummary');
  const scoreEl = document.getElementById('metricScore');
  scoreEl.textContent = `${metrics.humanScore}%`;
  summary.style.display = 'flex';
  
  // Color code
  if (metrics.humanScore >= 90) {
    scoreEl.className = 'metric-value score-excellent';
  } else if (metrics.humanScore >= 75) {
    scoreEl.className = 'metric-value score-good';
  } else {
    scoreEl.className = 'metric-value score-fair';
  }
  
  // Show detailed metrics if panel is open
  if (document.getElementById('metricsPanel').style.display !== 'none') {
    updateDetailedMetrics(metrics);
  }
  
  // Auto-show if setting enabled
  if (typeof luminaStorage !== 'undefined') {
    const settings = await luminaStorage.getSettings();
    if (settings.showMetrics) {
      toggleMetrics(true);
    }
  }
}

// Update detailed metrics panel
function updateDetailedMetrics(metrics) {
  document.getElementById('metricHumanScore').textContent = `${metrics.humanScore}%`;
  document.getElementById('metricPerplexity').textContent = `${metrics.perplexity}%`;
  document.getElementById('metricBurstiness').textContent = `${metrics.burstiness}%`;
  document.getElementById('metricReadability').textContent = `${metrics.readability}%`;
  document.getElementById('metricAIRisk').textContent = `${metrics.aiDetectionRisk}%`;
  
  // Update progress bars
  document.getElementById('metricPerplexityBar').style.width = `${metrics.perplexity}%`;
  document.getElementById('metricBurstinessBar').style.width = `${metrics.burstiness}%`;
  document.getElementById('metricReadabilityBar').style.width = `${metrics.readability}%`;
  document.getElementById('metricAIRiskBar').style.width = `${metrics.aiDetectionRisk}%`;
  
  // Update stats
  document.getElementById('statWords').textContent = metrics.wordCount.humanized;
  document.getElementById('statSentences').textContent = metrics.sentenceCount.humanized;
}

// Toggle metrics panel
function toggleMetrics(show = null) {
  const panel = document.getElementById('metricsPanel');
  const isVisible = panel.style.display !== 'none';
  const shouldShow = show !== null ? show : !isVisible;
  
  panel.style.display = shouldShow ? 'block' : 'none';
  
  if (shouldShow && currentMetrics) {
    updateDetailedMetrics(currentMetrics);
  }
}

// Show humanized view
function showHumanizedView() {
  document.getElementById('humanizedSection').style.display = 'block';
  document.getElementById('compareView').style.display = 'none';
  document.getElementById('viewHumanizedBtn').classList.add('active');
  document.getElementById('viewCompareBtn').classList.remove('active');
}

// Show compare view
function showCompareView() {
  if (!selectedText || !humanizedText) return;
  
  document.getElementById('humanizedSection').style.display = 'none';
  document.getElementById('compareView').style.display = 'grid';
  document.getElementById('compareOriginal').textContent = selectedText;
  document.getElementById('compareHumanized').textContent = humanizedText;
  document.getElementById('viewHumanizedBtn').classList.remove('active');
  document.getElementById('viewCompareBtn').classList.add('active');
}

// Save to history
async function saveToHistory(original, humanized, style, metrics) {
  if (typeof luminaStorage === 'undefined') return;
  await luminaStorage.saveToHistory(original, humanized, style, metrics);
  await loadHistory();
}

// Load history
async function loadHistory() {
  if (typeof luminaStorage === 'undefined') return;
  
  const history = await luminaStorage.getHistory();
  const container = document.getElementById('historyContent');
  
  if (history.length === 0) {
    container.innerHTML = '<div class="history-empty">No history yet</div>';
    return;
  }
  
  container.innerHTML = history.slice(0, 20).map(entry => {
    const date = new Date(entry.timestamp);
    const styleIcons = {
      professional: '💼',
      casual: '😊',
      academic: '🎓',
      creative: '✨',
      technical: '⚙️'
    };
    
    return `
      <div class="history-item" data-id="${entry.id}">
        <div class="history-item-header">
          <span class="history-style">${styleIcons[entry.style] || '💼'} ${entry.style}</span>
          <span class="history-date">${date.toLocaleDateString()} ${date.toLocaleTimeString()}</span>
        </div>
        <div class="history-item-preview">${entry.original.substring(0, 100)}${entry.original.length > 100 ? '...' : ''}</div>
        <div class="history-item-actions">
          <button class="btn-history" onclick="loadHistoryEntry(${entry.id})">Load</button>
          <button class="btn-history" onclick="deleteHistoryEntry(${entry.id})">Delete</button>
        </div>
      </div>
    `;
  }).join('');
}

// Load history entry
window.loadHistoryEntry = async function(id) {
  if (typeof luminaStorage === 'undefined') return;
  
  const history = await luminaStorage.getHistory();
  const entry = history.find(e => e.id === id);
  
  if (entry) {
    selectedText = entry.original;
    humanizedText = entry.humanized;
    currentMetrics = entry.metrics;
    currentStyle = entry.style;
    
    // Update UI
    document.getElementById('originalText').textContent = entry.original;
    document.getElementById('originalSection').style.display = 'block';
    
    const output = document.getElementById('output');
    output.innerHTML = `<div class="streaming-text">${entry.humanized}</div>`;
    
    showMetrics(entry.metrics);
    selectWritingStyle(entry.style, false);
    showHumanizedView();
    
    document.getElementById('actions').style.display = 'flex';
    document.getElementById('viewToggle').style.display = 'flex';
    
    toggleHistory();
  }
};

// Delete history entry
window.deleteHistoryEntry = async function(id) {
  if (typeof luminaStorage === 'undefined') return;
  await luminaStorage.deleteHistoryEntry(id);
  await loadHistory();
};

// Clear history
async function clearHistory() {
  if (typeof luminaStorage === 'undefined') return;
  if (confirm('Are you sure you want to clear all history?')) {
    await luminaStorage.clearHistory();
    await loadHistory();
  }
}

// Toggle history panel
function toggleHistory() {
  const panel = document.getElementById('historyPanel');
  panel.style.display = panel.style.display === 'none' ? 'block' : 'none';
  if (panel.style.display !== 'none') {
    loadHistory();
  }
}

// Show loading indicator
function showLoading(show) {
  document.getElementById('loadingIndicator').style.display = show ? 'flex' : 'none';
  document.getElementById('humanizeBtn').disabled = show;
}

// Show error
function showError(message) {
  const output = document.getElementById('output');
  output.innerHTML = `
    <div class="error-message">
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
        <circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="2"/>
        <path d="M12 8V12M12 16H12.01" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
      </svg>
      <p>${message}</p>
    </div>
  `;
}

// Update status
function updateStatus(type, message) {
  const indicator = document.getElementById('statusIndicator');
  const dot = indicator.querySelector('.status-dot');
  const text = indicator.querySelector('.status-text');
  
  text.textContent = message;
  dot.className = `status-dot status-${type}`;
}

// Copy humanized text
async function copyHumanizedText() {
  if (!humanizedText) {
    showError('No humanized text to copy');
    return;
  }

  try {
    await navigator.clipboard.writeText(humanizedText);
    
    // Show success feedback
    const btn = document.getElementById('copyBtn');
    const originalText = btn.innerHTML;
    btn.innerHTML = `
      <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
        <path d="M6 9L8 11L12 7" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
      </svg>
      Copied!
    `;
    btn.disabled = true;
    
    setTimeout(() => {
      btn.innerHTML = originalText;
      btn.disabled = false;
    }, 2000);
  } catch (error) {
    showError('Failed to copy text');
  }
}

// Export text
function exportText() {
  if (!humanizedText) {
    showError('No humanized text to export');
    return;
  }

  // Create export menu
  const formats = [
    { name: 'Plain Text (.txt)', ext: 'txt', content: humanizedText },
    { name: 'Markdown (.md)', ext: 'md', content: `# Humanized Text\n\n${humanizedText}` },
    { name: 'Both (Original + Humanized)', ext: 'txt', content: `ORIGINAL:\n${selectedText}\n\n\nHUMANIZED:\n${humanizedText}` }
  ];

  formats.forEach(format => {
    const link = document.createElement('a');
    link.href = 'data:text/plain;charset=utf-8,' + encodeURIComponent(format.content);
    link.download = `lumina-humanized-${Date.now()}.${format.ext}`;
    link.style.display = 'none';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  });
}

// Replace original text in Word Online
async function replaceOriginalText() {
  if (!humanizedText) {
    showError('No humanized text to replace with');
    return;
  }

  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    
    if (tab && (tab.url.includes('office.com') || tab.url.includes('office365.com') || 
                tab.url.includes('microsoft.com'))) {
      chrome.tabs.sendMessage(tab.id, {
        action: 'replaceText',
        newText: humanizedText
      }, (response) => {
        if (chrome.runtime.lastError) {
          showError('Could not replace text. Please ensure text is selected in Word Online.');
          return;
        }
        
        if (response && response.success) {
          updateStatus('success', 'Text replaced');
          
          // Show success feedback
          const btn = document.getElementById('replaceBtn');
          const originalText = btn.innerHTML;
          btn.innerHTML = `
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
              <path d="M6 9L8 11L12 7" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
            Replaced!
          `;
          btn.disabled = true;
          
          setTimeout(() => {
            btn.innerHTML = originalText;
            btn.disabled = false;
          }, 2000);
        } else {
          showError(response?.error || 'Failed to replace text');
        }
      });
    } else {
      showError('Please open Word Online first');
    }
  } catch (error) {
    showError('Failed to replace text');
  }
}

// Toggle settings panel
function toggleSettings() {
  const panel = document.getElementById('settingsPanel');
  panel.style.display = panel.style.display === 'none' ? 'block' : 'none';
}

// Periodically check for text selection
setInterval(() => {
  if (!selectedText) {
    checkForSelectedText();
  }
}, 2000);
