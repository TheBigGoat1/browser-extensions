/**
 * AI Command Center Pro - Content Script
 * Universal text selection detection and job monitoring
 * Works on all websites with enhanced selection detection
 */

(function() {
  'use strict';

  console.log('[CommandCenter] Content script loaded on:', window.location.href);

  let lastSelectedText = '';
  let selectionCheckInterval = null;

  // ============================================================================
  // ENHANCED TEXT SELECTION DETECTION
  // ============================================================================

  /**
   * Get selected text using multiple methods
   */
  function getSelectedText() {
    let text = '';
    
    // Method 1: Standard window.getSelection() - PRIMARY METHOD
    try {
      const selection = window.getSelection();
      if (selection && selection.rangeCount > 0) {
        text = selection.toString().trim();
        if (text && text.length > 0) {
          return text;
        }
      }
    } catch (e) {
      console.log('[CommandCenter] window.getSelection() failed:', e);
    }

    // Method 2: Try document.getSelection() (fallback)
    try {
      const selection = document.getSelection();
      if (selection && selection.rangeCount > 0) {
        text = selection.toString().trim();
        if (text && text.length > 0) {
          return text;
        }
      }
    } catch (e) {
      // Ignore
    }

    // Method 3: Try active element selection
    try {
      const activeElement = document.activeElement;
      if (activeElement && (activeElement.tagName === 'INPUT' || activeElement.tagName === 'TEXTAREA')) {
        const start = activeElement.selectionStart || 0;
        const end = activeElement.selectionEnd || 0;
        if (start !== end) {
          text = activeElement.value.substring(start, end).trim();
          if (text && text.length > 0) {
            return text;
          }
        }
      }
    } catch (e) {
      // Ignore
    }

    // Method 4: Try iframes (if accessible)
    try {
      const iframes = document.querySelectorAll('iframe');
      for (const iframe of iframes) {
        try {
          const iframeDoc = iframe.contentDocument || iframe.contentWindow?.document;
          if (iframeDoc) {
            const iframeSelection = iframeDoc.getSelection();
            if (iframeSelection && iframeSelection.rangeCount > 0) {
              text = iframeSelection.toString().trim();
              if (text && text.length > 0) {
                return text;
              }
            }
          }
        } catch (e) {
          // Cross-origin - expected, continue
        }
      }
    } catch (e) {
      // Ignore
    }

    return text;
  }

  /**
   * Enhanced text selection monitoring
   * Detects blue highlight (text selection) across all websites
   */
  function enhanceTextSelection() {
    // Monitor mouseup events (when user releases mouse after selecting)
    document.addEventListener('mouseup', handleSelection, true);
    
    // Monitor selection change events
    document.addEventListener('selectionchange', handleSelection, true);
    
    // Monitor keyboard selection (Shift+Arrow keys)
    document.addEventListener('keyup', (e) => {
      if (e.shiftKey && (e.key === 'ArrowLeft' || e.key === 'ArrowRight' || 
          e.key === 'ArrowUp' || e.key === 'ArrowDown')) {
        setTimeout(handleSelection, 50);
      }
    }, true);

    // Periodic check for selection (catches edge cases)
    selectionCheckInterval = setInterval(() => {
      const text = getSelectedText();
      if (text && text !== lastSelectedText && text.length > 10) {
        lastSelectedText = text;
        saveSelection(text);
      }
    }, 300);
  }

  /**
   * Handle text selection event
   */
  function handleSelection() {
    setTimeout(() => {
      const text = getSelectedText();
      
      if (text && text !== lastSelectedText && text.length > 10) {
        lastSelectedText = text;
        saveSelection(text);
      }
    }, 100); // Small delay to ensure selection is complete
  }

  /**
   * Save selection to storage
   */
  function saveSelection(text) {
    if (!text || text.length < 10) return;
    
    chrome.storage.local.set({
      lastSelection: text,
      lastSelectionTime: Date.now(),
      lastSelectionUrl: window.location.href,
      lastSelectionHost: window.location.hostname
    });
    
    console.log('[CommandCenter] Text selected:', text.substring(0, 50));
  }

  // ============================================================================
  // JOB DETECTION (Freelancer.com specific)
  // ============================================================================

  /**
   * Enhanced job extraction with MutationObserver (Freelancer.com)
   */
  function setupJobObserver() {
    // Only run on Freelancer.com
    if (!window.location.hostname.includes('freelancer.com')) {
      return;
    }

    const observer = new MutationObserver((mutations) => {
      let hasNewJobs = false;
      
      mutations.forEach((mutation) => {
        if (mutation.addedNodes.length > 0) {
          mutation.addedNodes.forEach((node) => {
            if (node.nodeType === Node.ELEMENT_NODE) {
              const jobSelectors = [
                '.JobSearchCard-primary-card',
                '.JobSearchCard-item',
                '[data-job-id]',
                '.JobCard',
                '.project-item'
              ];
              
              jobSelectors.forEach(selector => {
                if (node.matches && node.matches(selector)) {
                  hasNewJobs = true;
                }
                if (node.querySelector && node.querySelector(selector)) {
                  hasNewJobs = true;
                }
              });
            }
          });
        }
      });
      
      if (hasNewJobs) {
        chrome.runtime.sendMessage({
          action: 'checkJobs'
        }).catch(() => {
          // Ignore errors
        });
      }
    });
    
    observer.observe(document.body, {
      childList: true,
      subtree: true
    });
    
    console.log('[CommandCenter] Job observer started (Freelancer.com)');
  }

  // ============================================================================
  // INITIALIZATION
  // ============================================================================

  function init() {
    // Always set up text selection (works on all sites)
    enhanceTextSelection();
    
    // Set up job observer (only for Freelancer.com)
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => {
        setupJobObserver();
      });
    } else {
      setupJobObserver();
    }

    // Also set up observer after a delay to catch dynamically loaded content
    setTimeout(() => {
      setupJobObserver();
    }, 3000);
  }

  // Initialize
  init();

  // Cleanup on page unload
  window.addEventListener('beforeunload', () => {
    if (selectionCheckInterval) {
      clearInterval(selectionCheckInterval);
    }
  });

})();
