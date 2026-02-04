// Lumina Write - The Snatcher
// Enhanced text capture for Word Online (handles Office 365 frames and complex structures)

(function() {
  'use strict';

  let selectedText = '';
  let isWordOnline = false;
  let lastSelectionTime = 0;

  // Detect if we're in Word Online
  function detectWordOnline() {
    const hostname = window.location.hostname;
    const pathname = window.location.pathname;
    
    // Check for Word Online indicators
    if (hostname.includes('office.com') || hostname.includes('office365.com') || 
        hostname.includes('microsoft.com')) {
      // Look for Word-specific elements
      const wordIndicators = [
        document.querySelector('[data-app="Word"]'),
        document.querySelector('.WordDocument'),
        document.querySelector('[id*="WAC"]'),
        document.querySelector('[id*="WACContainer"]'),
        document.querySelector('[class*="Word"]'),
        document.querySelector('[class*="wac"]'),
        document.querySelector('iframe[src*="Word"]'),
        document.querySelector('iframe[src*="wac"]'),
        document.querySelector('[role="textbox"]'),
        document.querySelector('[contenteditable="true"]')
      ];
      
      if (wordIndicators.some(el => el !== null) || pathname.includes('/Word/') || 
          pathname.includes('/word/') || document.querySelector('[contenteditable="true"]')) {
        isWordOnline = true;
        return true;
      }
    }
    
    return false;
  }

  // Enhanced text selection - tries multiple methods
  function getSelectedText() {
    let text = '';
    const now = Date.now();
    
    // Prevent too frequent checks
    if (now - lastSelectionTime < 100) {
      return selectedText || '';
    }
    lastSelectionTime = now;

    // Method 1: Standard window.getSelection() - PRIMARY METHOD
    try {
      const selection = window.getSelection();
      if (selection && selection.rangeCount > 0) {
        text = selection.toString().trim();
        if (text && text.length > 0) {
          console.log('[Lumina] Got text via window.getSelection():', text.substring(0, 50));
          return text;
        }
      }
    } catch (e) {
      console.log('[Lumina] window.getSelection() failed:', e);
    }

    // Method 2: Try all iframes recursively
    try {
      const iframes = document.querySelectorAll('iframe');
      for (const iframe of iframes) {
        try {
          // Try to access iframe content (may fail due to CORS)
          const iframeDoc = iframe.contentDocument || iframe.contentWindow?.document;
          if (iframeDoc) {
            const iframeSelection = iframeDoc.getSelection();
            if (iframeSelection && iframeSelection.rangeCount > 0) {
              text = iframeSelection.toString().trim();
              if (text && text.length > 0) {
                console.log('[Lumina] Got text from iframe:', text.substring(0, 50));
                return text;
              }
            }
          }
        } catch (e) {
          // Cross-origin - expected, continue
        }
      }
    } catch (e) {
      console.log('[Lumina] Iframe method failed:', e);
    }

    // Method 3: Try contenteditable divs with selection ranges
    try {
      const editableDivs = document.querySelectorAll('[contenteditable="true"]');
      for (const div of editableDivs) {
        const selection = window.getSelection();
        if (selection && selection.rangeCount > 0) {
          const range = selection.getRangeAt(0);
          
          // Check if selection is within this editable div
          if (div.contains(range.commonAncestorContainer) || 
              div.contains(range.startContainer) || 
              div.contains(range.endContainer)) {
            
            // Try to get text from the range
            const clonedRange = range.cloneRange();
            clonedRange.selectNodeContents(div);
            clonedRange.setStart(range.startContainer, range.startOffset);
            clonedRange.setEnd(range.endContainer, range.endOffset);
            
            text = clonedRange.toString().trim() || selection.toString().trim();
            if (text && text.length > 0) {
              console.log('[Lumina] Got text from contenteditable:', text.substring(0, 50));
              return text;
            }
          }
        }
      }
    } catch (e) {
      console.log('[Lumina] Contenteditable method failed:', e);
    }

    // Method 4: Try document.getSelection() as fallback
    try {
      if (document.getSelection) {
        const selection = document.getSelection();
        if (selection && selection.rangeCount > 0) {
          text = selection.toString().trim();
          if (text && text.length > 0) {
            console.log('[Lumina] Got text via document.getSelection():', text.substring(0, 50));
            return text;
          }
        }
      }
    } catch (e) {
      console.log('[Lumina] document.getSelection() failed:', e);
    }

    // Method 5: Try to find selected text in Word's specific structures
    try {
      // Word Online often uses specific class names
      const wordContainers = document.querySelectorAll('[class*="WAC"], [class*="wac"], [id*="WAC"]');
      for (const container of wordContainers) {
        const selection = window.getSelection();
        if (selection && selection.rangeCount > 0) {
          const range = selection.getRangeAt(0);
          if (container.contains(range.commonAncestorContainer)) {
            text = selection.toString().trim();
            if (text && text.length > 0) {
              console.log('[Lumina] Got text from Word container:', text.substring(0, 50));
              return text;
            }
          }
        }
      }
    } catch (e) {
      console.log('[Lumina] Word container method failed:', e);
    }

    // Method 6: Try parent window (if in iframe)
    try {
      if (window.parent !== window && window.parent.getSelection) {
        const parentSelection = window.parent.getSelection();
        if (parentSelection && parentSelection.rangeCount > 0) {
          text = parentSelection.toString().trim();
          if (text && text.length > 0) {
            console.log('[Lumina] Got text from parent window:', text.substring(0, 50));
            return text;
          }
        }
      }
    } catch (e) {
      // Cross-origin - expected
    }

    return text;
  }

  // Enhanced selection change handler with better detection
  function handleSelectionChange() {
    // Use multiple methods to get selection
    let text = '';
    
    // Method 1: Try window.getSelection() immediately
    try {
      const selection = window.getSelection();
      if (selection && selection.rangeCount > 0) {
        text = selection.toString().trim();
        if (text && text.length > 0) {
          console.log('[Lumina] Got selection via window.getSelection():', text.substring(0, 50));
        }
      }
    } catch (e) {
      console.log('[Lumina] window.getSelection() failed:', e);
    }

    // Method 2: Try document.getSelection() if window failed
    if (!text || text.length < 5) {
      try {
        if (document.getSelection) {
          const selection = document.getSelection();
          if (selection && selection.rangeCount > 0) {
            text = selection.toString().trim();
            if (text && text.length > 0) {
              console.log('[Lumina] Got selection via document.getSelection():', text.substring(0, 50));
            }
          }
        }
      } catch (e) {
        console.log('[Lumina] document.getSelection() failed:', e);
      }
    }

    // Method 3: Try to get from active element (for contenteditable)
    if (!text || text.length < 5) {
      try {
        const activeEl = document.activeElement;
        if (activeEl && (activeEl.contentEditable === 'true' || activeEl.isContentEditable)) {
          const selection = window.getSelection();
          if (selection && selection.rangeCount > 0) {
            const range = selection.getRangeAt(0);
            if (activeEl.contains(range.commonAncestorContainer)) {
              text = selection.toString().trim();
              if (text && text.length > 0) {
                console.log('[Lumina] Got selection from contenteditable:', text.substring(0, 50));
              }
            }
          }
        }
      } catch (e) {
        console.log('[Lumina] Contenteditable selection failed:', e);
      }
    }

    // Method 4: Try all iframes
    if (!text || text.length < 5) {
      try {
        const iframes = document.querySelectorAll('iframe');
        for (const iframe of iframes) {
          try {
            const iframeDoc = iframe.contentDocument || iframe.contentWindow?.document;
            if (iframeDoc) {
              const iframeSelection = iframeDoc.getSelection();
              if (iframeSelection && iframeSelection.rangeCount > 0) {
                const iframeText = iframeSelection.toString().trim();
                if (iframeText && iframeText.length > 5) {
                  text = iframeText;
                  console.log('[Lumina] Got selection from iframe:', text.substring(0, 50));
                  break;
                }
              }
            }
          } catch (e) {
            // Cross-origin - expected
          }
        }
      } catch (e) {
        console.log('[Lumina] Iframe method failed:', e);
      }
    }

    // Process the found text
    if (text && text.length > 5) {
      // Only update if text actually changed
      if (text !== selectedText) {
        selectedText = text;
        
        console.log('[Lumina] ✅ Text selected successfully:', selectedText.length, 'characters');
        
        // Send to sidepanel with retry logic
        sendSelectionToSidepanel(selectedText);
      }
    } else {
      // Clear selection if it was previously set
      if (selectedText) {
        selectedText = '';
        console.log('[Lumina] Selection cleared');
        chrome.runtime.sendMessage({
          action: 'textDeselected'
        }).catch(() => {});
      }
    }
  }

  // Send selection to sidepanel with retry
  function sendSelectionToSidepanel(text) {
    const sendMessage = (attempt = 1) => {
      chrome.runtime.sendMessage({
        action: 'textSelected',
        text: text,
        source: 'word-online',
        length: text.length
      }).then(() => {
        console.log('[Lumina] ✅ Selection sent to sidepanel');
      }).catch((error) => {
        // Retry if sidepanel not ready
        if (attempt < 3) {
          setTimeout(() => sendMessage(attempt + 1), 500);
        } else {
          console.log('[Lumina] Sidepanel not ready after 3 attempts');
        }
      });
    };
    
    sendMessage();
  }

  // Aggressive event listeners for better detection
  function setupSelectionListeners() {
    // Mouse events - PRIMARY METHOD for copy-paste style selection
    document.addEventListener('mouseup', (e) => {
      // Wait a bit for selection to complete
      setTimeout(() => {
        handleSelectionChange();
      }, 200); // Increased delay for Word Online
    }, true); // Use capture phase

    // Also listen on mouseup with longer delay (Word Online sometimes needs more time)
    document.addEventListener('mouseup', () => {
      setTimeout(() => {
        handleSelectionChange();
      }, 300);
    }, false);

    // Mouse move during selection (for drag selection)
    let isSelecting = false;
    document.addEventListener('mousedown', (e) => {
      isSelecting = true;
      // Clear previous selection
      selectedText = '';
    }, true);

    document.addEventListener('mousemove', (e) => {
      if (isSelecting) {
        // Check selection while dragging
        handleSelectionChange();
      }
    }, true);

    // Keyboard selection - IMPORTANT for copy-paste workflow
    document.addEventListener('keyup', (e) => {
      // Shift + Arrow keys (common selection method)
      if (e.shiftKey && (e.key.startsWith('Arrow') || e.key === 'Home' || e.key === 'End' || 
                         e.key === 'PageUp' || e.key === 'PageDown')) {
        setTimeout(() => {
          handleSelectionChange();
        }, 100);
      } 
      // Ctrl+A (Select All)
      else if (e.ctrlKey && e.key === 'a') {
        setTimeout(() => {
          handleSelectionChange();
        }, 200);
      }
      // Ctrl+C (Copy) - user might have selected text before copying
      else if (e.ctrlKey && e.key === 'c') {
        setTimeout(() => {
          handleSelectionChange();
        }, 100);
      }
    }, true);

    // Selection change event - MOST RELIABLE
    document.addEventListener('selectionchange', () => {
      // Immediate check
      handleSelectionChange();
      
      // Also check after a small delay (Word Online sometimes updates selection async)
      setTimeout(() => {
        handleSelectionChange();
      }, 100);
    }, true);

    // Also listen on window for better coverage
    window.addEventListener('mouseup', () => {
      setTimeout(() => {
        handleSelectionChange();
      }, 200);
    }, true);

    window.addEventListener('selectionchange', () => {
      handleSelectionChange();
    }, true);

    // Clipboard events (when user copies, they've selected text)
    document.addEventListener('copy', () => {
      setTimeout(() => {
        handleSelectionChange();
      }, 50);
    }, true);

    // Try to catch selection in all frames
    if (window.frames) {
      for (let i = 0; i < window.frames.length; i++) {
        try {
          const frameDoc = window.frames[i].document;
          if (frameDoc) {
            frameDoc.addEventListener('selectionchange', handleSelectionChange, true);
            frameDoc.addEventListener('mouseup', () => {
              setTimeout(handleSelectionChange, 200);
            }, true);
            frameDoc.addEventListener('keyup', (e) => {
              if (e.shiftKey && e.key.startsWith('Arrow')) {
                setTimeout(handleSelectionChange, 100);
              }
            }, true);
          }
        } catch (e) {
          // Cross-origin - expected
        }
      }
    }

    // Polling as backup (every 500ms when page is active)
    let pollInterval = null;
    document.addEventListener('mouseenter', () => {
      if (!pollInterval) {
        pollInterval = setInterval(() => {
          // Only poll if we don't have a selection
          if (!selectedText || selectedText.length < 5) {
            handleSelectionChange();
          }
        }, 500);
      }
    });

    document.addEventListener('mouseleave', () => {
      if (pollInterval) {
        clearInterval(pollInterval);
        pollInterval = null;
      }
    });
  }

  // Handle messages from sidepanel - Enhanced response with multiple attempts
  chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === 'getSelectedText') {
      // Try multiple methods to get selection
      const tryGetSelection = (attempt = 1) => {
        let text = '';
        
        // Method 1: window.getSelection()
        try {
          const selection = window.getSelection();
          if (selection && selection.rangeCount > 0) {
            text = selection.toString().trim();
          }
        } catch (e) {}
        
        // Method 2: document.getSelection()
        if (!text || text.length < 5) {
          try {
            if (document.getSelection) {
              const selection = document.getSelection();
              if (selection && selection.rangeCount > 0) {
                text = selection.toString().trim();
              }
            }
          } catch (e) {}
        }
        
        // Method 3: Check contenteditable elements
        if (!text || text.length < 5) {
          try {
            const editableDivs = document.querySelectorAll('[contenteditable="true"]');
            for (const div of editableDivs) {
              const selection = window.getSelection();
              if (selection && selection.rangeCount > 0) {
                const range = selection.getRangeAt(0);
                if (div.contains(range.commonAncestorContainer)) {
                  text = selection.toString().trim();
                  if (text && text.length > 5) break;
                }
              }
            }
          } catch (e) {}
        }
        
        // Method 4: Try iframes
        if (!text || text.length < 5) {
          try {
            const iframes = document.querySelectorAll('iframe');
            for (const iframe of iframes) {
              try {
                const iframeDoc = iframe.contentDocument || iframe.contentWindow?.document;
                if (iframeDoc) {
                  const iframeSelection = iframeDoc.getSelection();
                  if (iframeSelection && iframeSelection.rangeCount > 0) {
                    text = iframeSelection.toString().trim();
                    if (text && text.length > 5) break;
                  }
                }
              } catch (e) {
                // Cross-origin
              }
            }
          } catch (e) {}
        }
        
        // If we found text or exhausted attempts
        if (text && text.length >= 5) {
          sendResponse({ 
            success: true,
            text: text,
            isWordOnline: detectWordOnline(),
            length: text.length
          });
        } else if (attempt < 3) {
          // Retry after delay
          setTimeout(() => tryGetSelection(attempt + 1), 200);
        } else {
          // No selection found after 3 attempts
          sendResponse({ 
            success: false,
            text: '',
            isWordOnline: detectWordOnline(),
            length: 0
          });
        }
      };
      
      tryGetSelection();
      return true; // Keep channel open for async response
    } else if (request.action === 'replaceText') {
      // Replace selected text in Word Online
      try {
        const selection = window.getSelection();
        if (selection.rangeCount > 0) {
          const range = selection.getRangeAt(0);
          range.deleteContents();
          range.insertNode(document.createTextNode(request.newText));
          sendResponse({ success: true });
        } else {
          sendResponse({ success: false, error: 'No selection found' });
        }
      } catch (e) {
        sendResponse({ success: false, error: e.message });
      }
    }
    
    return true; // Keep channel open for async response
  });

  // Initialize
  function initialize() {
    if (detectWordOnline()) {
      console.log('[Lumina Write] Word Online detected - Enhanced Snatcher active');
      
      // Setup all listeners
      setupSelectionListeners();
      
      // Periodic check as backup (every 1 second)
      setInterval(() => {
        handleSelectionChange();
      }, 1000);
      
      // Notify background that we're ready
      chrome.runtime.sendMessage({
        action: 'wordOnlineDetected',
        url: window.location.href
      }).catch(() => {});
    } else {
      // Even if not detected as Word, set up listeners (might be in iframe)
      setupSelectionListeners();
      console.log('[Lumina Write] Listeners active (Word detection uncertain)');
    }
  }

  // Initialize when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initialize);
  } else {
    initialize();
  }

  // Also initialize after a short delay to catch dynamically loaded content
  setTimeout(initialize, 500);

})();
