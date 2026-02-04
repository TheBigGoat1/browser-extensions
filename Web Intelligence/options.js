// Cortex AI - Options Page Script

const DEFAULT_SETTINGS = {
  apiKey: 'sk-58614fb8b5894bc0a119eda739fee8e0',
  systemPrompt: `You are an intelligent content analyzer. Your task is to provide clear, concise, and actionable summaries of web content.

Format your response as follows:
1. **Core Thesis**: One sentence summarizing the main point
2. **Key Points**: Bullet points of the main arguments/ideas
3. **Action Items**: What the reader should do based on this information

Be concise, accurate, and actionable.`,
  model: 'deepseek-chat',
  temperature: 0.7,
  maxTokens: 2000
};

// Load settings
async function loadSettings() {
  try {
    const data = await chrome.storage.local.get(['apiKey', 'systemPrompt', 'model', 'temperature', 'maxTokens']);
    
    document.getElementById('apiKey').value = data.apiKey || DEFAULT_SETTINGS.apiKey;
    document.getElementById('model').value = data.model || DEFAULT_SETTINGS.model;
    document.getElementById('temperature').value = data.temperature || DEFAULT_SETTINGS.temperature;
    document.getElementById('maxTokens').value = data.maxTokens || DEFAULT_SETTINGS.maxTokens;
    document.getElementById('systemPrompt').value = data.systemPrompt || DEFAULT_SETTINGS.systemPrompt;
  } catch (error) {
    console.error('[Cortex AI] Error loading settings:', error);
  }
}

// Save settings
async function saveSettings() {
  try {
    const apiKey = document.getElementById('apiKey').value.trim();
    const model = document.getElementById('model').value;
    const temperature = parseFloat(document.getElementById('temperature').value) || 0.7;
    const maxTokens = parseInt(document.getElementById('maxTokens').value) || 2000;
    const systemPrompt = document.getElementById('systemPrompt').value.trim() || DEFAULT_SETTINGS.systemPrompt;
    
    // Validate
    if (temperature < 0 || temperature > 1) {
      alert('Temperature must be between 0 and 1');
      return;
    }
    
    if (maxTokens < 100 || maxTokens > 4000) {
      alert('Max tokens must be between 100 and 4000');
      return;
    }
    
    await chrome.storage.local.set({
      apiKey: apiKey || DEFAULT_SETTINGS.apiKey,
      model: model,
      temperature: temperature,
      maxTokens: maxTokens,
      systemPrompt: systemPrompt
    });
    
    showSuccess();
  } catch (error) {
    console.error('[Cortex AI] Error saving settings:', error);
    alert('Error saving settings. Please try again.');
  }
}

// Reset settings
async function resetSettings() {
  if (confirm('Reset all settings to defaults?')) {
    await chrome.storage.local.set(DEFAULT_SETTINGS);
    loadSettings();
    showSuccess();
  }
}

// Show success message
function showSuccess() {
  const message = document.getElementById('successMessage');
  message.style.display = 'block';
  setTimeout(() => {
    message.style.display = 'none';
  }, 3000);
}

// Event listeners
document.getElementById('saveBtn').addEventListener('click', saveSettings);
document.getElementById('resetBtn').addEventListener('click', resetSettings);

// Load on init
loadSettings();
