/**
 * Freelancer Command Center Pro - Side Panel Controller
 * Premium AI Prompt Library & Intelligence Controller
 * Complete Implementation with Full Functionality
 */

// ============================================================================
// PREMIUM PROMPT LIBRARY
// ============================================================================

const PROMPT_LIBRARY = {
  translate: (text) => `Act as a world-class professional translator. Translate this job to English. Use professional industry terminology. Do not just translate words; translate the intent so I look knowledgeable: "${text}"`,

  proposal: (text) => `As an elite software developer with 8+ years of experience, draft a compelling one-paragraph proposal for this software development project. 

STRATEGY: 
- Showcase deep technical expertise using specific examples of similar successful projects (mention technologies, frameworks, architectures)
- Demonstrate understanding of modern software development practices (CI/CD, testing, scalability, security)
- Highlight your ability to deliver production-ready, maintainable code
- Reference relevant GitHub repositories or portfolio pieces if applicable

TONE: Professional, confident, technically knowledgeable, and client-focused. Never robotic or generic.

GOAL: Make the client want to work exclusively with you by demonstrating you're not just another developer, but a strategic technical partner who understands their business needs.

FORMAT: One cohesive paragraph (150-200 words) that flows naturally and persuasively.

JOB REQUIREMENTS: "${text}"

Craft a response that positions you as the obvious choice - someone who doesn't just code, but solves business problems through elegant software solutions.`,

  urgent: (text) => `Craft an urgent, high-priority bid for the following. Emphasize immediate availability and proven expertise to secure the project now: "${text}"`
};

// ============================================================================
// AI CONFIGURATION
// ============================================================================

const AI_CONFIG = {
  gpt: { name: 'ChatGPT', url: 'https://chatgpt.com', iframeId: 'gpt-iframe' },
  claude: { name: 'Claude', url: 'https://claude.ai', iframeId: 'claude-iframe' },
  deepseek: { name: 'DeepSeek', url: 'https://chat.deepseek.com', iframeId: 'deepseek-iframe' },
  gemini: { name: 'Gemini', url: 'https://gemini.google.com', iframeId: 'gemini-iframe' },
  github: { name: 'GitHub', url: 'https://github.com', iframeId: 'github-iframe' },
  word: { name: 'Word Online', url: 'https://word.cloud.microsoft.com/open/onedrive/?docId=C150B91C2726C2B5%21sfd08fa830ac34e18bf9220ea8726f935&driveId=C150B91C2726C2B5', iframeId: 'word-iframe' }
};

// ============================================================================
// TEXT SELECTION MONITORING
// ============================================================================

let lastSelectedText = '';
let selectionCheckInterval = null;

function startSelectionMonitoring() {
  // Check for text selection every 500ms
  selectionCheckInterval = setInterval(() => {
    chrome.storage.local.get(['lastSelection'], (res) => {
      const currentSelection = res.lastSelection || '';
      if (currentSelection && currentSelection !== lastSelectedText && currentSelection.length > 10) {
        lastSelectedText = currentSelection;
        console.log('[CommandCenter] New text selection detected:', currentSelection.substring(0, 50));
      }
    });
  }, 500);
}

// ============================================================================
// AI INTERACTION FUNCTIONS
// ============================================================================

/**
 * Get currently active AI
 */
function getActiveAI() {
  const activePanel = document.querySelector('.ai-panel-container.active');
  if (!activePanel) return null;
  return activePanel.dataset.ai;
}

/**
 * Focus the active AI iframe
 */
function focusActiveAI() {
  const activeAI = getActiveAI();
  if (!activeAI) return false;
  
  const iframe = document.getElementById(`${activeAI}-iframe`);
  if (iframe) {
    try {
      iframe.focus();
      iframe.contentWindow?.focus();
      return true;
    } catch (e) {
      console.warn('[CommandCenter] Cannot focus iframe (cross-origin):', e);
      return false;
    }
  }
  return false;
}

/**
 * Attempt to paste and send to AI (within security constraints)
 * Uses clipboard + focus + keyboard simulation where possible
 */
async function pasteAndSendToAI(text, actionType = 'translate') {
  const activeAI = getActiveAI();
  if (!activeAI) {
    showStatus('No AI panel active', 'error');
    return false;
  }

  // Copy to clipboard
  try {
    await navigator.clipboard.writeText(text);
    
    // Get active iframe
    const iframe = document.getElementById(`${activeAI}-iframe`);
    if (!iframe) {
      showStatus('AI panel not found', 'error');
      return false;
    }

    // Try to interact with iframe
    try {
      // Focus the iframe
      iframe.focus();
      iframe.contentWindow?.focus();
      
      // Try to access iframe document (may fail due to CORS)
      const iframeDoc = iframe.contentDocument || iframe.contentWindow?.document;
      
      if (iframeDoc) {
        // Same-origin: We can directly interact
        const inputSelectors = [
          'textarea',
          'input[type="text"]',
          '[contenteditable="true"]',
          '[role="textbox"]',
          'div[contenteditable]',
          '.ProseMirror',
          '#prompt-textarea',
          'textarea[placeholder*="message"]',
          'textarea[placeholder*="ask"]',
          'textarea[placeholder*="type"]'
        ];
        
        let inputElement = null;
        
        // Find the input element
        for (const selector of inputSelectors) {
          inputElement = iframeDoc.querySelector(selector);
          if (inputElement) break;
        }
        
        if (inputElement) {
          // Focus and paste
          inputElement.focus();
          
          // Set value for textarea/input
          if (inputElement.tagName === 'TEXTAREA' || inputElement.tagName === 'INPUT') {
            inputElement.value = text;
          } else {
            // For contenteditable
            inputElement.textContent = text;
            inputElement.innerText = text;
          }
          
          // Trigger input event
          const inputEvent = new Event('input', { bubbles: true });
          inputElement.dispatchEvent(inputEvent);
          
          // Try to find and click send button
          setTimeout(() => {
            const sendSelectors = [
              'button[type="submit"]',
              'button[aria-label*="send"]',
              'button[aria-label*="Send"]',
              'button:has(svg)',
              '[data-testid*="send"]',
              'button:last-of-type'
            ];
            
            let sendButton = null;
            for (const selector of sendSelectors) {
              sendButton = iframeDoc.querySelector(selector);
              if (sendButton && sendButton.offsetParent !== null) break; // Visible
            }
            
            if (sendButton) {
              sendButton.click();
              showStatus('✅ Sent to AI automatically!', 'success');
            } else {
              // Try Enter key simulation
              const enterEvent = new KeyboardEvent('keydown', {
                key: 'Enter',
                code: 'Enter',
                keyCode: 13,
                which: 13,
                bubbles: true,
                cancelable: true
              });
              inputElement.dispatchEvent(enterEvent);
              
              const enterUp = new KeyboardEvent('keyup', {
                key: 'Enter',
                code: 'Enter',
                keyCode: 13,
                which: 13,
                bubbles: true,
                cancelable: true
              });
              inputElement.dispatchEvent(enterUp);
              
              showStatus('✅ Text pasted! Press Enter to send.', 'success');
            }
          }, 200);
          
          return true;
        }
      }
    } catch (e) {
      // Cross-origin iframe - use clipboard method
      console.log('[CommandCenter] Cross-origin iframe, using clipboard method');
    }
    
    // Fallback: Clipboard method with visual feedback
    showStatus('✅ Copied! Click AI input → Ctrl+V → Enter', 'success');
    focusActiveAI();
    
    return true;
  } catch (err) {
    console.error('[CommandCenter] Clipboard error:', err);
    showStatus('Error copying text. Please try again.', 'error');
    return false;
  }
}

/**
 * Check if AI has visible content (for draft proposal logic)
 */
function checkAIContent() {
  const activeAI = getActiveAI();
  if (!activeAI) return false;
  
  const iframe = document.getElementById(`${activeAI}-iframe`);
  if (!iframe) return false;
  
  try {
    // Try to access iframe content (may fail due to CORS)
    const iframeDoc = iframe.contentDocument || iframe.contentWindow?.document;
    if (iframeDoc) {
      // Look for common AI response containers
      const responseSelectors = [
        '[data-testid*="message"]',
        '.message',
        '.response',
        '[class*="response"]',
        '[class*="message"]',
        'main',
        'article'
      ];
      
      for (const selector of responseSelectors) {
        const elements = iframeDoc.querySelectorAll(selector);
        if (elements.length > 0) {
          // Check if any element has visible text
          for (const el of elements) {
            const text = el.textContent || el.innerText || '';
            if (text.trim().length > 50) {
              return true; // Found content
            }
          }
        }
      }
    }
  } catch (e) {
    // Cross-origin - cannot access
    console.log('[CommandCenter] Cannot check AI content (cross-origin)');
  }
  
  // If we can't check, assume content exists (user should verify)
  return true;
}

// ============================================================================
// ACTION HANDLERS
// ============================================================================

/**
 * Handle Translate action
 */
async function handleTranslate() {
  const btn = document.getElementById('btn-translate');
  const label = btn?.querySelector('.btn-label');
  const originalText = label ? label.textContent : (btn?.textContent || '');
  
  chrome.storage.local.get(['lastSelection'], async (res) => {
    const text = res.lastSelection || '';
    
    if (!text || text.length < 10) {
      showStatus('No text selected. Highlight text on any website first.', 'error');
      return;
    }
    
    if (btn) {
      if (label) label.textContent = 'Ready';
      else btn.textContent = 'Ready';
      btn.style.borderColor = 'var(--success)';
      btn.style.color = 'var(--success)';
    }
    
    const prompt = PROMPT_LIBRARY.translate(text);
    const success = await pasteAndSendToAI(prompt, 'translate');
    
    if (success) {
      chrome.storage.local.set({ lastPrompt: prompt, lastPromptType: 'translate' });
    }
    
    setTimeout(() => {
      if (btn) {
        if (label) label.textContent = originalText;
        else btn.textContent = originalText;
        btn.style.borderColor = '';
        btn.style.color = '';
      }
    }, 2000);
  });
}

/**
 * Handle Draft Proposal action
 */
async function handleDraftProposal() {
  const btn = document.getElementById('btn-proposal');
  const label = btn?.querySelector('.btn-label');
  const originalText = label ? label.textContent : (btn?.textContent || '');
  
  chrome.storage.local.get(['lastSelection'], async (res) => {
    const text = res.lastSelection || '';
    
    if (!text || text.length < 10) {
      showStatus('No text selected. Highlight job description first.', 'error');
      return;
    }
    
    if (btn) {
      if (label) label.textContent = 'Ready';
      else btn.textContent = 'Ready';
      btn.style.borderColor = 'var(--success)';
      btn.style.color = 'var(--success)';
    }
    
    const prompt = PROMPT_LIBRARY.proposal(text);
    const success = await pasteAndSendToAI(prompt, 'proposal');
    
    if (success) {
      chrome.storage.local.set({ lastPrompt: prompt, lastPromptType: 'proposal' });
    }
    
    setTimeout(() => {
      if (btn) {
        if (label) label.textContent = originalText;
        else btn.textContent = originalText;
        btn.style.borderColor = '';
        btn.style.color = '';
      }
    }, 2000);
  });
}

/**
 * Handle Urgent Bid action
 */
async function handleUrgentBid() {
  const btn = document.getElementById('btn-urgent');
  const label = btn?.querySelector('.btn-label');
  const originalText = label ? label.textContent : (btn?.textContent || '');
  
  chrome.storage.local.get(['lastSelection'], async (res) => {
    const text = res.lastSelection || '';
    
    if (!text || text.length < 10) {
      showStatus('No text selected. Highlight job description first.', 'error');
      return;
    }
    
    if (btn) {
      if (label) label.textContent = 'Ready';
      else btn.textContent = 'Ready';
      btn.style.borderColor = 'var(--error)';
      btn.style.color = 'var(--error)';
    }
    
    const prompt = PROMPT_LIBRARY.urgent(text);
    const success = await pasteAndSendToAI(prompt, 'urgent');
    
    if (success) {
      chrome.storage.local.set({ lastPrompt: prompt, lastPromptType: 'urgent' });
    }
    
    setTimeout(() => {
      if (btn) {
        if (label) label.textContent = originalText;
        else btn.textContent = originalText;
        btn.style.borderColor = '';
        btn.style.color = '';
      }
    }, 2000);
  });
}

// ============================================================================
// AI SWITCHING & PANEL MANAGEMENT
// ============================================================================

function switchAI(aiId) {
  if (!AI_CONFIG[aiId]) return;

  document.querySelectorAll('.ai-tab').forEach(tab => tab.classList.remove('active'));
  const tab = document.getElementById(`tab-${aiId}`);
  if (tab) tab.classList.add('active');

  document.querySelectorAll('.ai-panel-container').forEach(panel => panel.classList.remove('active'));
  const panel = document.getElementById(`${aiId}-panel`);
  if (panel) panel.classList.add('active');
}

/**
 * Open AI in new tab
 */
function openInNewTab(aiId) {
  const config = AI_CONFIG[aiId];
  if (!config) {
    showStatus('Unknown AI', 'error');
    return;
  }
  
  chrome.tabs.create({ url: config.url });
  showStatus(`Opening ${config.name} in new tab...`, 'success');
}

function refreshAI(aiId) {
  const config = AI_CONFIG[aiId];
  if (!config) return;
  const iframe = document.getElementById(config.iframeId);
  const loading = document.getElementById(`${aiId}-loading`);
  if (iframe && loading) {
    loading.style.display = 'flex';
    iframe.src = iframe.src;
    setTimeout(() => { loading.style.display = 'none'; }, 3000);
  }
}

/**
 * Refresh current active AI
 */
function refreshCurrentAI() {
  const activeAI = getActiveAI();
  if (activeAI) {
    refreshAI(activeAI);
  } else {
    showStatus('No active AI panel', 'error');
  }
}

// ============================================================================
// STATUS & UI HELPERS
// ============================================================================

/**
 * Show status notification
 */
function showStatus(message, type = 'success') {
  const indicator = document.getElementById('statusIndicator');
  if (!indicator) return;
  
  indicator.textContent = message;
  indicator.className = 'status-indicator active status-' + (type === 'error' ? 'error' : 'success');
  
  setTimeout(() => {
    indicator.classList.remove('active');
  }, 4000);
}

// ============================================================================
// EVENT LISTENERS SETUP
// ============================================================================

function setupEventListeners() {
  // AI Tab: switch panel only – chat loads in the side panel iframe (no new tab)
  document.querySelectorAll('.ai-tab').forEach(tab => {
    tab.addEventListener('click', (e) => {
      const aiId = tab.dataset.ai;
      if (aiId) {
        switchAI(aiId);
      }
    });
  });
  
  // Open Full Page buttons
  document.querySelectorAll('[id^="open-"]').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const aiId = btn.id.replace('open-', '');
      openInNewTab(aiId);
    });
  });
  
  // Refresh buttons
  document.querySelectorAll('[id^="refresh-"]').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const aiId = btn.dataset.ai || btn.id.replace('refresh-', '');
      refreshAI(aiId);
    });
  });
  
  // Action buttons
  document.getElementById('btn-translate')?.addEventListener('click', handleTranslate);
  document.getElementById('btn-proposal')?.addEventListener('click', handleDraftProposal);
  document.getElementById('btn-urgent')?.addEventListener('click', handleUrgentBid);
}

// ============================================================================
// IFRAME LOAD HANDLERS
// ============================================================================

function setupIframeHandlers() {
  Object.keys(AI_CONFIG).forEach(aiId => {
    const iframe = document.getElementById(`${aiId}-iframe`);
    const loading = document.getElementById(`${aiId}-loading`);
    
    if (iframe && loading) {
      iframe.addEventListener('load', () => {
        loading.style.display = 'none';
        console.log(`[CommandCenter] ${aiId} panel loaded`);
      });
      
      iframe.addEventListener('error', () => {
        loading.style.display = 'none';
        console.error(`[CommandCenter] ${aiId} panel failed to load`);
        showStatus(`${AI_CONFIG[aiId].name} failed to load`, 'error');
      });
    }
  });
}

// ============================================================================
// STORAGE LISTENERS
// ============================================================================

chrome.storage.onChanged.addListener((changes, areaName) => {
  if (areaName !== 'local') return;
  
  if (changes.lastSelection) {
    const newText = changes.lastSelection.newValue || '';
    if (newText && newText.length > 10 && newText !== lastSelectedText) {
      lastSelectedText = newText;
      console.log('[CommandCenter] New selection detected:', newText.substring(0, 50));
    }
  }
});

// ============================================================================
// INITIALIZATION
// ============================================================================

function init() {
  setupEventListeners();
  setupIframeHandlers();
  startSelectionMonitoring();
  chrome.storage.local.get(['lastSelection'], (res) => {
    if (res.lastSelection) lastSelectedText = res.lastSelection;
  });
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
