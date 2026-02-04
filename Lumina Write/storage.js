// Lumina Write - Storage Manager
// Handles history, settings, and data persistence

const STORAGE_KEYS = {
  HISTORY: 'lumina_history',
  SETTINGS: 'lumina_settings',
  STATS: 'lumina_stats'
};

// Default settings
const DEFAULT_SETTINGS = {
  writingStyle: 'professional',
  temperature: 0.9,
  model: 'deepseek-chat',
  autoSave: true,
  showMetrics: true,
  compareView: false
};

// Save humanization to history
async function saveToHistory(originalText, humanizedText, style, metrics) {
  try {
    const history = await getHistory();
    const entry = {
      id: Date.now(),
      original: originalText,
      humanized: humanizedText,
      style: style,
      metrics: metrics,
      timestamp: new Date().toISOString(),
      wordCount: {
        original: originalText.split(/\s+/).length,
        humanized: humanizedText.split(/\s+/).length
      }
    };
    
    history.unshift(entry); // Add to beginning
    
    // Keep only last 100 entries
    if (history.length > 100) {
      history.splice(100);
    }
    
    await chrome.storage.local.set({ [STORAGE_KEYS.HISTORY]: history });
    return entry;
  } catch (error) {
    console.error('[Lumina] Error saving to history:', error);
    return null;
  }
}

// Get history
async function getHistory() {
  try {
    const result = await chrome.storage.local.get([STORAGE_KEYS.HISTORY]);
    return result[STORAGE_KEYS.HISTORY] || [];
  } catch (error) {
    console.error('[Lumina] Error getting history:', error);
    return [];
  }
}

// Clear history
async function clearHistory() {
  try {
    await chrome.storage.local.remove(STORAGE_KEYS.HISTORY);
    return true;
  } catch (error) {
    console.error('[Lumina] Error clearing history:', error);
    return false;
  }
}

// Delete history entry
async function deleteHistoryEntry(id) {
  try {
    const history = await getHistory();
    const filtered = history.filter(entry => entry.id !== id);
    await chrome.storage.local.set({ [STORAGE_KEYS.HISTORY]: filtered });
    return true;
  } catch (error) {
    console.error('[Lumina] Error deleting history entry:', error);
    return false;
  }
}

// Get settings
async function getSettings() {
  try {
    const result = await chrome.storage.local.get([STORAGE_KEYS.SETTINGS]);
    return { ...DEFAULT_SETTINGS, ...(result[STORAGE_KEYS.SETTINGS] || {}) };
  } catch (error) {
    console.error('[Lumina] Error getting settings:', error);
    return DEFAULT_SETTINGS;
  }
}

// Save settings
async function saveSettings(settings) {
  try {
    const current = await getSettings();
    const updated = { ...current, ...settings };
    await chrome.storage.local.set({ [STORAGE_KEYS.SETTINGS]: updated });
    return updated;
  } catch (error) {
    console.error('[Lumina] Error saving settings:', error);
    return null;
  }
}

// Update stats
async function updateStats(action, data = {}) {
  try {
    const result = await chrome.storage.local.get([STORAGE_KEYS.STATS]);
    const stats = result[STORAGE_KEYS.STATS] || {
      totalHumanizations: 0,
      totalWords: 0,
      averageScore: 0,
      styleUsage: {},
      lastUsed: null
    };
    
    if (action === 'humanize') {
      stats.totalHumanizations++;
      stats.totalWords += (data.wordCount || 0);
      stats.lastUsed = new Date().toISOString();
      
      if (data.style) {
        stats.styleUsage[data.style] = (stats.styleUsage[data.style] || 0) + 1;
      }
      
      if (data.score) {
        const currentAvg = stats.averageScore || 0;
        const total = stats.totalHumanizations;
        stats.averageScore = ((currentAvg * (total - 1)) + data.score) / total;
      }
    }
    
    await chrome.storage.local.set({ [STORAGE_KEYS.STATS]: stats });
    return stats;
  } catch (error) {
    console.error('[Lumina] Error updating stats:', error);
    return null;
  }
}

// Get stats
async function getStats() {
  try {
    const result = await chrome.storage.local.get([STORAGE_KEYS.STATS]);
    return result[STORAGE_KEYS.STATS] || {
      totalHumanizations: 0,
      totalWords: 0,
      averageScore: 0,
      styleUsage: {},
      lastUsed: null
    };
  } catch (error) {
    console.error('[Lumina] Error getting stats:', error);
    return null;
  }
}

// Export for use in other files
if (typeof window !== 'undefined') {
  window.luminaStorage = {
    saveToHistory,
    getHistory,
    clearHistory,
    deleteHistoryEntry,
    getSettings,
    saveSettings,
    updateStats,
    getStats
  };
}
