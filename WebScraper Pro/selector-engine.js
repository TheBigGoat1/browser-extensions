/**
 * WebScraper Pro - Selector Engine
 * Core recursive DFS crawler with parent-child nesting logic
 * 
 * This is the "mechanical heart" that executes sitemap instructions
 */

(function() {
  'use strict';

  // ============================================================================
  // SELECTOR TYPES
  // ============================================================================
  
  const SELECTOR_TYPES = {
    ELEMENT: 'SelectorElement',      // Container/wrapper selector
    TEXT: 'SelectorText',           // Extract text content
    LINK: 'SelectorLink',            // Extract href and navigate
    IMAGE: 'SelectorImage',          // Extract image src
    ATTRIBUTE: 'SelectorAttribute',  // Extract any attribute
    HTML: 'SelectorHTML',            // Extract innerHTML
    TABLE: 'SelectorTable'           // Extract table data
  };

  // ============================================================================
  // SELECTOR ENGINE CLASS
  // ============================================================================
  
  class SelectorEngine {
    constructor() {
      this.sitemap = null;
      this.results = [];
      this.currentContext = null;
      this.visitedUrls = new Set();
      this.pendingUrls = [];
      this.failedUrls = [];
    }

    /**
     * Initialize engine with sitemap
     * @param {Object} sitemap - The sitemap JSON structure
     */
    initialize(sitemap) {
      this.sitemap = sitemap;
      this.results = [];
      this.visitedUrls.clear();
      this.pendingUrls = [sitemap.startUrl];
      this.failedUrls = [];
      
      console.log('[SelectorEngine] Initialized with sitemap:', sitemap.id);
    }

    /**
     * Execute the sitemap - Main entry point
     * @returns {Promise<Array>} Extracted data
     */
    async execute() {
      if (!this.sitemap) {
        throw new Error('Sitemap not initialized');
      }

      console.log('[SelectorEngine] Starting execution...');
      
      // Start from root selectors
      const rootSelectors = this.sitemap.selectors.filter(
        sel => sel.parentSelectors.includes('_root')
      );

      if (rootSelectors.length === 0) {
        throw new Error('No root selectors found in sitemap');
      }

      // Process root level - start from document body for better results
      const rootContext = document.body || document.documentElement;
      
      // Recursively process root selectors
      for (const rootSelector of rootSelectors) {
        try {
          const elements = this.findElements(rootSelector.selector, rootContext);
          console.log(`[SelectorEngine] Found ${elements.length} root elements for selector: ${rootSelector.id} (${rootSelector.selector})`);
          
          if (elements.length === 0) {
            console.warn(`[SelectorEngine] No elements found for root selector: ${rootSelector.selector}`);
            // Try fallback - extract from body
            if (rootSelector.type === SELECTOR_TYPES.TEXT) {
              const fallbackText = document.body?.textContent?.trim() || '';
              if (fallbackText) {
                this.results.push({ [rootSelector.id]: fallbackText.substring(0, 500) });
              }
            }
            continue;
          }
          
          // Process each element
          for (const element of elements) {
            await this.processElement(element, [rootSelector], null);
          }
        } catch (error) {
          console.error(`[SelectorEngine] Error processing root selector ${rootSelector.id}:`, error);
        }
      }

      // If no results, try extracting from body as fallback
      if (this.results.length === 0) {
        console.log('[SelectorEngine] No results, trying fallback extraction from body...');
        const bodyText = document.body?.textContent?.trim() || '';
        if (bodyText) {
          this.results.push({ content: bodyText.substring(0, 1000) });
        }
      }

      console.log('[SelectorEngine] Execution complete. Results:', this.results.length);
      if (this.results.length > 0) {
        console.log('[SelectorEngine] Sample result:', this.results[0]);
      }
      return this.results;
    }

    /**
     * Process a single element and its children (DFS recursion)
     * @param {Element} element - DOM element to process
     * @param {Array} selectors - Selectors to apply
     * @param {Object} parentData - Data from parent element
     */
    async processElement(element, selectors, parentData) {
      const elementData = parentData ? { ...parentData } : {};

      for (const selector of selectors) {
        try {
          const extractedData = await this.extractData(element, selector);
          
          if (selector.multiple) {
            // Multiple elements found
            if (!elementData[selector.id]) {
              elementData[selector.id] = [];
            }
            elementData[selector.id].push(...extractedData);
          } else {
            // Single element
            elementData[selector.id] = extractedData.length > 0 ? extractedData[0] : null;
          }

          // Handle Link selectors - navigate to new pages
          if (selector.type === SELECTOR_TYPES.LINK && extractedData.length > 0) {
            for (const linkData of extractedData) {
              if (linkData.url && !this.visitedUrls.has(linkData.url)) {
                this.pendingUrls.push(linkData.url);
                this.visitedUrls.add(linkData.url);
              }
            }
          }

          // Find child selectors
          const childSelectors = this.sitemap.selectors.filter(
            sel => sel.parentSelectors.includes(selector.id)
          );

          if (childSelectors.length > 0) {
            // Find elements matching this selector
            const matchingElements = this.findElements(selector.selector, element);
            
            // Recursively process each matching element
            for (const childElement of matchingElements) {
              await this.processElement(childElement, childSelectors, elementData);
            }
          }
        } catch (error) {
          console.error(`[SelectorEngine] Error processing selector ${selector.id}:`, error);
        }
      }

      // If this is a leaf node (no children), save the result
      const hasChildren = this.sitemap.selectors.some(
        sel => sel.parentSelectors.includes(selectors[selectors.length - 1]?.id)
      );

      if (!hasChildren || Object.keys(elementData).length > 0) {
        this.results.push(elementData);
      }
    }

    /**
     * Extract data from element based on selector type - ENHANCED with retry logic
     * @param {Element} context - Parent element context
     * @param {Object} selector - Selector definition
     * @param {number} retries - Number of retry attempts
     * @returns {Promise<Array>} Extracted data
     */
    async extractData(context, selector, retries = 3) {
      let elements = [];
      let currentSelector = selector.selector;
      let attempt = 0;

      // Retry logic with fallback selectors
      while (attempt < retries && elements.length === 0) {
        try {
          elements = this.findElements(currentSelector, context);
          
          // If no elements found and we have fallbacks, try them
          if (elements.length === 0 && selector.fallbacks && selector.fallbacks.length > 0 && attempt < retries - 1) {
            const fallbackIndex = Math.min(attempt, selector.fallbacks.length - 1);
            currentSelector = selector.fallbacks[fallbackIndex];
            console.log(`[SelectorEngine] Primary selector failed, trying fallback: ${currentSelector}`);
            attempt++;
            
            // Wait before retry (exponential backoff)
            if (attempt < retries) {
              await this.waitWithBackoff(attempt);
            }
            continue;
          }
          
          // If we found elements or no more fallbacks, break
          break;
        } catch (error) {
          console.warn(`[SelectorEngine] Error finding elements (attempt ${attempt + 1}/${retries}):`, error);
          attempt++;
          
          if (attempt < retries) {
            await this.waitWithBackoff(attempt);
          }
        }
      }

      // If still no elements, log warning
      if (elements.length === 0) {
        console.warn(`[SelectorEngine] No elements found for selector: ${selector.selector} (tried ${attempt} attempts)`);
        return [];
      }

      const results = [];

      // Process elements in batches for performance
      const batchSize = 50;
      for (let i = 0; i < elements.length; i += batchSize) {
        const batch = elements.slice(i, i + batchSize);
        
        // Use requestIdleCallback if available for non-blocking processing
        if (window.requestIdleCallback) {
          await new Promise(resolve => {
            window.requestIdleCallback(() => {
              this.processBatch(batch, selector, results);
              resolve();
            }, { timeout: 1000 });
          });
        } else {
          this.processBatch(batch, selector, results);
        }
      }

      return results;
    }
    
    /**
     * Process a batch of elements
     */
    processBatch(elements, selector, results) {
      for (const element of elements) {
        try {
          let data = null;

          switch (selector.type) {
            case SELECTOR_TYPES.TEXT:
              data = this.extractText(element);
              break;

            case SELECTOR_TYPES.LINK:
              data = this.extractLink(element);
              break;

            case SELECTOR_TYPES.IMAGE:
              data = this.extractImage(element);
              break;

            case SELECTOR_TYPES.ATTRIBUTE:
              data = this.extractAttribute(element, selector.attribute);
              break;

            case SELECTOR_TYPES.HTML:
              data = this.extractHTML(element);
              break;

            case SELECTOR_TYPES.TABLE:
              data = this.extractTable(element);
              break;

            case SELECTOR_TYPES.ELEMENT:
              // Element selector just provides context, no data extraction
              data = { _element: true };
              break;

            default:
              console.warn(`[SelectorEngine] Unknown selector type: ${selector.type}`);
              data = this.extractText(element);
          }

          if (data !== null) {
            results.push(data);
          }
        } catch (error) {
          console.error(`[SelectorEngine] Error extracting data:`, error);
        }
      }
    }
    
    /**
     * Wait with exponential backoff
     */
    async waitWithBackoff(attempt, baseDelay = 100) {
      const delay = Math.min(baseDelay * Math.pow(2, attempt), 2000);
      return new Promise(resolve => setTimeout(resolve, delay));
    }

    /**
     * Find elements matching CSS selector
     * @param {string} selector - CSS selector string
     * @param {Element|null} context - Parent element (null for document)
     * @returns {Array<Element>} Matching elements
     */
    findElements(selector, context) {
      if (selector === '_root') {
        return [document.documentElement];
      }

      try {
        const searchContext = context || document;
        const elements = Array.from(searchContext.querySelectorAll(selector));
        return elements;
      } catch (error) {
        console.error(`[SelectorEngine] Invalid selector "${selector}":`, error);
        return [];
      }
    }

    /**
     * Extract text content - IMPROVED to get actual visible text
     */
    extractText(element) {
      if (!element) return null;
      
      // Get text content, but prefer visible text
      let text = '';
      
      // If element has direct text (not just children)
      const directText = element.childNodes ? 
        Array.from(element.childNodes)
          .filter(node => node.nodeType === Node.TEXT_NODE)
          .map(node => node.textContent?.trim())
          .filter(Boolean)
          .join(' ') : '';
      
      if (directText) {
        text = directText;
      } else {
        // Get all text content
        text = element.textContent?.trim() || element.innerText?.trim() || '';
      }
      
      // Clean up text - remove excessive whitespace
      text = text.replace(/\s+/g, ' ').trim();
      
      // Return null if empty, otherwise return the text
      return text || null;
    }

    /**
     * Extract link (href)
     */
    extractLink(element) {
      if (!element) return null;
      
      const link = element.closest('a') || element;
      const href = link.href || link.getAttribute('href');
      
      if (!href) return null;

      // Resolve relative URLs
      const url = new URL(href, window.location.href).href;
      
      return {
        url: url,
        text: link.textContent?.trim() || ''
      };
    }

    /**
     * Extract image src
     */
    extractImage(element) {
      if (!element) return null;
      
      const img = element.tagName === 'IMG' ? element : element.querySelector('img');
      if (!img) return null;

      const src = img.src || img.getAttribute('src') || img.getAttribute('data-src');
      if (!src) return null;

      // Resolve relative URLs
      const url = new URL(src, window.location.href).href;
      
      return {
        url: url,
        alt: img.alt || '',
        title: img.title || ''
      };
    }

    /**
     * Extract attribute value
     */
    extractAttribute(element, attributeName) {
      if (!element || !attributeName) return null;
      
      const value = element.getAttribute(attributeName);
      return value || null;
    }

    /**
     * Extract innerHTML
     */
    extractHTML(element) {
      if (!element) return null;
      return element.innerHTML || null;
    }

    /**
     * Extract table data
     */
    extractTable(element) {
      if (!element) return null;
      
      const table = element.tagName === 'TABLE' ? element : element.querySelector('table');
      if (!table) return null;

      const rows = Array.from(table.querySelectorAll('tr'));
      const data = [];

      for (const row of rows) {
        const cells = Array.from(row.querySelectorAll('td, th'));
        const rowData = cells.map(cell => cell.textContent?.trim() || '');
        if (rowData.length > 0) {
          data.push(rowData);
        }
      }

      return data.length > 0 ? { rows: data } : null;
    }

    /**
     * Get pending URLs for navigation
     */
    getPendingUrls() {
      return [...this.pendingUrls];
    }

    /**
     * Mark URL as processed
     */
    markUrlProcessed(url) {
      this.visitedUrls.add(url);
    }

    /**
     * Mark URL as failed
     */
    markUrlFailed(url, error) {
      this.failedUrls.push({ url, error: error.message, timestamp: Date.now() });
    }

    /**
     * Get results
     */
    getResults() {
      return this.results;
    }

    /**
     * Clear results
     */
    clearResults() {
      this.results = [];
    }
  }

  // ============================================================================
  // EXPORT TO GLOBAL SCOPE
  // ============================================================================
  
  window.SelectorEngine = SelectorEngine;
  window.SELECTOR_TYPES = SELECTOR_TYPES;

  console.log('[SelectorEngine] Module loaded');

})();
