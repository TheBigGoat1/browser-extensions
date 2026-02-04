/**
 * WebScraper Pro - Visual Selector
 * Point-and-click DOM highlighter with CSS path finder
 * 
 * This provides the "ParseHub-style" visual selection interface
 */

(function() {
  'use strict';

  // ============================================================================
  // VISUAL SELECTOR CLASS
  // ============================================================================
  
  class VisualSelector {
    constructor() {
      this.isActive = false;
      this.overlay = null;
      this.highlightedElement = null;
      this.selectedElements = [];
      this.mouseX = 0;
      this.mouseY = 0;
      this.clickHandler = null;
      this.mouseMoveHandler = null;
      this.observer = null;
    }

    /**
     * Activate visual selection mode
     */
    activate() {
      if (this.isActive) return;
      
      this.isActive = true;
      this.createOverlay();
      this.attachEventListeners();
      this.addStyles();
      
      console.log('[VisualSelector] Activated');
      
      // Notify background
      chrome.runtime.sendMessage({
        action: 'visualSelectorActivated',
        url: window.location.href
      });
    }

    /**
     * Deactivate visual selection mode
     */
    deactivate() {
      if (!this.isActive) return;
      
      this.isActive = false;
      this.removeOverlay();
      this.removeEventListeners();
      
      console.log('[VisualSelector] Deactivated');
      
      // Notify background
      chrome.runtime.sendMessage({
        action: 'visualSelectorDeactivated',
        url: window.location.href
      });
    }

    /**
     * Create overlay element
     */
    createOverlay() {
      this.overlay = document.createElement('div');
      this.overlay.id = 'webscraper-overlay';
      this.overlay.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        z-index: 999999;
        pointer-events: none;
        background: transparent;
      `;
      document.body.appendChild(this.overlay);
    }

    /**
     * Remove overlay
     */
    removeOverlay() {
      if (this.overlay) {
        this.overlay.remove();
        this.overlay = null;
      }
      this.clearHighlight();
    }

    /**
     * Attach event listeners
     */
    attachEventListeners() {
      this.mouseMoveHandler = (e) => this.handleMouseMove(e);
      this.clickHandler = (e) => this.handleClick(e);
      
      document.addEventListener('mousemove', this.mouseMoveHandler, true);
      document.addEventListener('click', this.clickHandler, true);
      document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
          this.deactivate();
        }
      });
    }

    /**
     * Remove event listeners
     */
    removeEventListeners() {
      if (this.mouseMoveHandler) {
        document.removeEventListener('mousemove', this.mouseMoveHandler, true);
      }
      if (this.clickHandler) {
        document.removeEventListener('click', this.clickHandler, true);
      }
    }

    /**
     * Handle mouse move - highlight element under cursor
     */
    handleMouseMove(e) {
      if (!this.isActive) return;
      
      this.mouseX = e.clientX;
      this.mouseY = e.clientY;

      const element = document.elementFromPoint(e.clientX, e.clientY);
      
      if (element && element !== this.highlightedElement) {
        this.highlightElement(element);
      }
    }

    /**
     * Handle click - select element and calculate CSS path
     */
    handleClick(e) {
      if (!this.isActive) return;
      
      e.preventDefault();
      e.stopPropagation();
      e.stopImmediatePropagation();

      const element = document.elementFromPoint(this.mouseX, this.mouseY);
      
      if (element) {
        this.selectElement(element);
      }
    }

    /**
     * Highlight element with visual feedback
     */
    highlightElement(element) {
      this.clearHighlight();
      
      this.highlightedElement = element;
      const rect = element.getBoundingClientRect();
      
      // Create highlight box
      const highlight = document.createElement('div');
      highlight.className = 'webscraper-highlight';
      highlight.style.cssText = `
        position: fixed;
        left: ${rect.left + window.scrollX}px;
        top: ${rect.top + window.scrollY}px;
        width: ${rect.width}px;
        height: ${rect.height}px;
        border: 2px solid #4CAF50;
        background: rgba(76, 175, 80, 0.1);
        pointer-events: none;
        z-index: 999998;
        box-shadow: 0 0 0 9999px rgba(0, 0, 0, 0.3);
      `;
      
      document.body.appendChild(highlight);
      
      // Show CSS selector hint
      const selector = this.calculateCSSPath(element);
      this.showSelectorHint(rect, selector);
    }

    /**
     * Clear current highlight
     */
    clearHighlight() {
      const highlights = document.querySelectorAll('.webscraper-highlight, .webscraper-selector-hint');
      highlights.forEach(el => el.remove());
      this.highlightedElement = null;
    }

    /**
     * Show CSS selector hint
     */
    showSelectorHint(rect, selector) {
      const hint = document.createElement('div');
      hint.className = 'webscraper-selector-hint';
      hint.textContent = selector;
      hint.style.cssText = `
        position: fixed;
        left: ${rect.left + window.scrollX}px;
        top: ${rect.top + window.scrollY - 30}px;
        background: #4CAF50;
        color: white;
        padding: 4px 8px;
        border-radius: 4px;
        font-size: 12px;
        font-family: monospace;
        z-index: 999999;
        pointer-events: none;
        white-space: nowrap;
        max-width: 400px;
        overflow: hidden;
        text-overflow: ellipsis;
      `;
      
      document.body.appendChild(hint);
    }

    /**
     * Select element and calculate optimal CSS path
     */
    selectElement(element) {
      const selector = this.calculateCSSPath(element);
      const optimizedSelector = this.optimizeSelector(element);
      
      // Find similar elements (for list detection)
      const similarElements = this.findSimilarElements(element, optimizedSelector);
      
      const selectionData = {
        element: element.tagName.toLowerCase(),
        selector: optimizedSelector,
        originalSelector: selector,
        text: element.textContent?.trim().substring(0, 100) || '',
        similarCount: similarElements.length,
        cssPath: this.getFullCSSPath(element),
        xpath: this.getXPath(element)
      };

      this.selectedElements.push(selectionData);
      
      // Highlight all similar elements
      this.highlightSimilarElements(similarElements);
      
      // Send to sidepanel
      chrome.runtime.sendMessage({
        action: 'elementSelected',
        data: selectionData,
        url: window.location.href
      });
      
      console.log('[VisualSelector] Element selected:', selectionData);
    }

    /**
     * Calculate CSS path for element
     */
    calculateCSSPath(element) {
      if (!element || element === document.body) {
        return 'body';
      }

      const path = [];
      let current = element;

      while (current && current !== document.body) {
        let selector = current.tagName.toLowerCase();
        
        // Add ID if available
        if (current.id) {
          selector = `#${current.id}`;
          path.unshift(selector);
          break; // ID is unique, we can stop
        }
        
        // Add class if available
        if (current.className && typeof current.className === 'string') {
          const classes = current.className.trim().split(/\s+/).filter(c => c);
          if (classes.length > 0) {
            selector += '.' + classes.join('.');
          }
        }
        
        // Add nth-child if needed
        const parent = current.parentElement;
        if (parent) {
          const siblings = Array.from(parent.children);
          const index = siblings.indexOf(current);
          if (siblings.length > 1) {
            selector += `:nth-child(${index + 1})`;
          }
        }
        
        path.unshift(selector);
        current = parent;
      }

      return path.join(' > ');
    }

    /**
     * Optimize selector by removing nth-child when possible
     */
    optimizeSelector(element) {
      // Try ID first
      if (element.id) {
        return `#${element.id}`;
      }
      
      // Try class combination
      if (element.className && typeof element.className === 'string') {
        const classes = element.className.trim().split(/\s+/).filter(c => c);
        if (classes.length > 0) {
          const classSelector = `${element.tagName.toLowerCase()}.${classes.join('.')}`;
          const matches = document.querySelectorAll(classSelector);
          if (matches.length === 1) {
            return classSelector;
          }
        }
      }
      
      // Fall back to full path
      return this.calculateCSSPath(element);
    }

    /**
     * Find similar elements (for list detection)
     */
    findSimilarElements(element, selector) {
      try {
        const matches = document.querySelectorAll(selector);
        return Array.from(matches);
      } catch (error) {
        console.warn('[VisualSelector] Could not find similar elements:', error);
        return [element];
      }
    }

    /**
     * Highlight all similar elements
     */
    highlightSimilarElements(elements) {
      elements.forEach((el, index) => {
        setTimeout(() => {
          const rect = el.getBoundingClientRect();
          const highlight = document.createElement('div');
          highlight.className = 'webscraper-similar-highlight';
          highlight.style.cssText = `
            position: fixed;
            left: ${rect.left + window.scrollX}px;
            top: ${rect.top + window.scrollY}px;
            width: ${rect.width}px;
            height: ${rect.height}px;
            border: 2px solid #2196F3;
            background: rgba(33, 150, 243, 0.1);
            pointer-events: none;
            z-index: 999997;
          `;
          document.body.appendChild(highlight);
          
          // Remove after animation
          setTimeout(() => highlight.remove(), 1000);
        }, index * 50);
      });
    }

    /**
     * Get full CSS path (including all ancestors)
     */
    getFullCSSPath(element) {
      const path = [];
      let current = element;

      while (current && current !== document.body) {
        let selector = current.tagName.toLowerCase();
        
        if (current.id) {
          selector = `#${current.id}`;
        } else if (current.className && typeof current.className === 'string') {
          const classes = current.className.trim().split(/\s+/).filter(c => c);
          if (classes.length > 0) {
            selector += '.' + classes.join('.');
          }
        }
        
        path.unshift(selector);
        current = current.parentElement;
      }

      return path.join(' > ');
    }

    /**
     * Get XPath for element
     */
    getXPath(element) {
      if (element.id) {
        return `//*[@id="${element.id}"]`;
      }

      const path = [];
      let current = element;

      while (current && current !== document.body) {
        let selector = current.tagName.toLowerCase();
        const parent = current.parentElement;
        
        if (parent) {
          const siblings = Array.from(parent.children).filter(
            el => el.tagName === current.tagName
          );
          if (siblings.length > 1) {
            const index = siblings.indexOf(current) + 1;
            selector += `[${index}]`;
          }
        }
        
        path.unshift(selector);
        current = parent;
      }

      return '/' + path.join('/');
    }

    /**
     * Add custom styles
     */
    addStyles() {
      if (document.getElementById('webscraper-styles')) return;
      
      const style = document.createElement('style');
      style.id = 'webscraper-styles';
      style.textContent = `
        .webscraper-highlight {
          animation: webscraper-pulse 1s ease-in-out infinite;
        }
        
        @keyframes webscraper-pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.7; }
        }
      `;
      document.head.appendChild(style);
    }

    /**
     * Get selected elements
     */
    getSelectedElements() {
      return this.selectedElements;
    }

    /**
     * Clear selections
     */
    clearSelections() {
      this.selectedElements = [];
      this.clearHighlight();
    }
  }

  // ============================================================================
  // INITIALIZE AND EXPORT
  // ============================================================================
  
  const visualSelector = new VisualSelector();

  // Listen for messages from sidepanel/background
  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    console.log('[VisualSelector] Received message:', message.action);
    
    if (message.action === 'activateVisualSelector') {
      try {
        visualSelector.activate();
        sendResponse({ success: true });
      } catch (error) {
        console.error('[VisualSelector] Activation error:', error);
        sendResponse({ success: false, error: error.message });
      }
      return true;
    } else if (message.action === 'deactivateVisualSelector') {
      try {
        visualSelector.deactivate();
        sendResponse({ success: true });
      } catch (error) {
        console.error('[VisualSelector] Deactivation error:', error);
        sendResponse({ success: false, error: error.message });
      }
      return true;
    } else if (message.action === 'getSelectedElements') {
      sendResponse({ elements: visualSelector.getSelectedElements() });
      return true;
    } else if (message.action === 'clearSelections') {
      try {
        visualSelector.clearSelections();
        sendResponse({ success: true });
      } catch (error) {
        console.error('[VisualSelector] Clear error:', error);
        sendResponse({ success: false, error: error.message });
      }
      return true;
    }
    
    return false;
  });

  // Export to global scope
  window.VisualSelector = VisualSelector;
  window.visualSelector = visualSelector;

  console.log('[VisualSelector] Module loaded');

})();
