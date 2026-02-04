/**
 * WebScraper Pro - Content Script
 * Extraction worker that executes selectors on target pages
 */

(function() {
  'use strict';

  // ============================================================================
  // CONTENT SCRIPT HANDLER
  // ============================================================================
  
  class ContentScriptHandler {
    constructor() {
      this.engine = null;
      this.isScraping = false;
      this.infiniteScrollObserver = null;
    }

    /**
     * Initialize content script
     */
    init() {
      console.log('[ContentScript] Initialized on:', window.location.href);
      
      // Listen for messages from background
      chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
        this.handleMessage(message, sender, sendResponse);
        return true; // Keep channel open for async
      });
    }

    /**
     * Handle messages from background/sidepanel
     */
    async handleMessage(message, sender, sendResponse) {
      try {
        switch (message.action) {
          case 'executeSitemap':
            this.executeSitemap(message.sitemap, message.jobId).then(() => {
              sendResponse({ success: true });
            }).catch(error => {
              sendResponse({ success: false, error: error.message });
            });
            return true; // Keep channel open
            break;

          case 'handleInfiniteScroll':
            await this.handleInfiniteScroll(message.config);
            sendResponse({ success: true });
            break;

          case 'extractData':
            const data = await this.extractData(message.selectors);
            sendResponse({ success: true, data });
            break;

          case 'waitForElement':
            await this.waitForElement(message.selector, message.timeout);
            sendResponse({ success: true });
            break;

          case 'scrollToBottom':
            await this.scrollToBottom();
            sendResponse({ success: true });
            break;

          case 'intelligentScrape':
            await this.handleIntelligentScrape(message.requirements).then(result => {
              sendResponse({ success: true, sitemap: result.sitemap, results: result.results });
            }).catch(error => {
              sendResponse({ success: false, error: error.message });
            });
            return true; // Keep channel open
            break;

          case 'analyzePage':
            const analysis = this.analyzePageForIntelligentScraper();
            sendResponse({ success: true, analysis });
            break;

          default:
            sendResponse({ success: false, error: 'Unknown action' });
        }
      } catch (error) {
        console.error('[ContentScript] Error:', error);
        sendResponse({ success: false, error: error.message });
      }
    }

    /**
     * Execute sitemap on current page
     */
    async executeSitemap(sitemap, jobId) {
      console.log('[ContentScript] Executing sitemap:', sitemap.id, 'on:', window.location.href);
      
      if (this.isScraping) {
        console.warn('[ContentScript] Scraping already in progress');
        return;
      }

      this.isScraping = true;
      
      try {
        // Wait for page to be ready
        await this.waitForPageReady();
        console.log('[ContentScript] Page ready');
        
        // Initialize selector engine
        if (typeof SelectorEngine === 'undefined') {
          console.error('[ContentScript] SelectorEngine not loaded');
          throw new Error('SelectorEngine not loaded');
        }
        
        console.log('[ContentScript] Creating SelectorEngine instance');
        this.engine = new SelectorEngine();
        this.engine.initialize(sitemap);
        
        // Execute sitemap
        console.log('[ContentScript] Executing sitemap...');
        const results = await this.engine.execute();
        console.log('[ContentScript] Execution complete. Results:', results.length);
        
        // Send results to background
        chrome.runtime.sendMessage({
          action: 'scrapingComplete',
          url: window.location.href,
          results: results,
          sitemapId: sitemap.id,
          jobId: jobId
        }).catch(error => {
          console.error('[ContentScript] Error sending results:', error);
        });
        
        return results;
      } catch (error) {
        console.error('[ContentScript] Error executing sitemap:', error);
        
        // Send error to background
        chrome.runtime.sendMessage({
          action: 'scrapingError',
          url: window.location.href,
          error: error.message,
          sitemapId: sitemap.id,
          jobId: jobId
        }).catch(() => {});
        
        throw error;
      } finally {
        this.isScraping = false;
      }
    }

    /**
     * Wait for page to be ready
     */
    async waitForPageReady() {
      return new Promise((resolve) => {
        if (document.readyState === 'complete') {
          resolve();
          return;
        }

        const checkReady = () => {
          if (document.readyState === 'complete') {
            resolve();
          } else {
            setTimeout(checkReady, 100);
          }
        };

        window.addEventListener('load', resolve);
        checkReady();
      });
    }

    /**
     * Handle infinite scroll
     */
    async handleInfiniteScroll(config = {}) {
      const {
        maxScrolls = 10,
        scrollDelay = 1000,
        waitForNewContent = 3000
      } = config;

      let scrollCount = 0;
      let lastHeight = document.body.scrollHeight;
      let noChangeCount = 0;

      return new Promise((resolve) => {
        const scrollInterval = setInterval(() => {
          // Scroll to bottom
          window.scrollTo(0, document.body.scrollHeight);
          
          scrollCount++;
          
          // Wait for new content
          setTimeout(() => {
            const newHeight = document.body.scrollHeight;
            
            if (newHeight === lastHeight) {
              noChangeCount++;
              
              // No new content for 3 consecutive checks
              if (noChangeCount >= 3) {
                clearInterval(scrollInterval);
                resolve();
                return;
              }
            } else {
              noChangeCount = 0;
              lastHeight = newHeight;
            }
            
            // Max scrolls reached
            if (scrollCount >= maxScrolls) {
              clearInterval(scrollInterval);
              resolve();
            }
          }, waitForNewContent);
        }, scrollDelay);
      });
    }

    /**
     * Extract data using selectors
     */
    async extractData(selectors) {
      const results = {};
      
      for (const selector of selectors) {
        try {
          const elements = document.querySelectorAll(selector.selector);
          const data = Array.from(elements).map(el => {
            switch (selector.type) {
              case 'text':
                return el.textContent?.trim() || '';
              case 'html':
                return el.innerHTML || '';
              case 'attribute':
                return el.getAttribute(selector.attribute) || '';
              default:
                return el.textContent?.trim() || '';
            }
          });
          
          results[selector.id] = selector.multiple ? data : (data[0] || null);
        } catch (error) {
          console.error(`[ContentScript] Error extracting ${selector.id}:`, error);
          results[selector.id] = null;
        }
      }
      
      return results;
    }

    /**
     * Wait for element to appear - ENHANCED with SmartWaiter
     */
    async waitForElement(selector, timeout = 10000) {
      // Use SmartWaiter if available
      if (typeof SmartWaiter !== 'undefined') {
        try {
          return await SmartWaiter.waitForContent(selector, {
            timeout: timeout,
            strategy: 'multi',
            minElements: 1
          });
        } catch (error) {
          console.warn('[ContentScript] SmartWaiter failed, falling back to basic wait:', error);
        }
      }
      
      // Fallback to basic wait
      return new Promise((resolve, reject) => {
        const startTime = Date.now();
        
        const check = () => {
          const element = document.querySelector(selector);
          if (element) {
            resolve(element);
            return;
          }
          
          if (Date.now() - startTime > timeout) {
            reject(new Error(`Element not found: ${selector}`));
            return;
          }
          
          setTimeout(check, 100);
        };
        
        check();
      });
    }
    
    /**
     * Wait for page to be ready - ENHANCED
     */
    async waitForPageReady(timeout = 15000) {
      // Use SmartWaiter if available
      if (typeof SmartWaiter !== 'undefined') {
        try {
          await SmartWaiter.waitForPageReady({ timeout });
          return;
        } catch (error) {
          console.warn('[ContentScript] SmartWaiter page ready failed:', error);
        }
      }
      
      // Fallback
      return new Promise((resolve) => {
        if (document.readyState === 'complete') {
          resolve();
        } else {
          window.addEventListener('load', resolve, { once: true });
          setTimeout(resolve, timeout);
        }
      });
    }

    /**
     * Scroll to bottom of page
     */
    async scrollToBottom() {
      return new Promise((resolve) => {
        const scrollHeight = document.body.scrollHeight;
        let currentScroll = window.pageYOffset;
        const scrollStep = 500;
        
        const scroll = () => {
          currentScroll += scrollStep;
          window.scrollTo(0, currentScroll);
          
          if (currentScroll >= scrollHeight) {
            resolve();
          } else {
            requestAnimationFrame(scroll);
          }
        };
        
        scroll();
      });
    }

    /**
     * Use MutationObserver to detect new content
     */
    observeNewContent(callback) {
      if (this.infiniteScrollObserver) {
        this.infiniteScrollObserver.disconnect();
      }
      
      this.infiniteScrollObserver = new MutationObserver((mutations) => {
        let hasNewContent = false;
        
        mutations.forEach((mutation) => {
          if (mutation.addedNodes.length > 0) {
            hasNewContent = true;
          }
        });
        
        if (hasNewContent) {
          callback();
        }
      });
      
      this.infiniteScrollObserver.observe(document.body, {
        childList: true,
        subtree: true
      });
    }

    /**
     * Stop observing
     */
    stopObserving() {
      if (this.infiniteScrollObserver) {
        this.infiniteScrollObserver.disconnect();
        this.infiniteScrollObserver = null;
      }
    }

    /**
     * Handle intelligent scraping
     */
    async handleIntelligentScrape(requirements) {
      console.log('[ContentScript] Intelligent scrape with requirements:', requirements);
      
      if (typeof IntelligentScraper === 'undefined') {
        throw new Error('IntelligentScraper not loaded');
      }

      const scraper = new IntelligentScraper();
      const result = await scraper.execute(requirements);
      
      return result;
    }

    /**
     * Analyze page for intelligent scraper
     */
    analyzePageForIntelligentScraper() {
      if (typeof IntelligentScraper === 'undefined') {
        return { headings: [], links: [], images: [], lists: [] };
      }

      const scraper = new IntelligentScraper();
      return scraper.analyzePageStructure();
    }
  }

  // ============================================================================
  // INITIALIZE
  // ============================================================================
  
  const handler = new ContentScriptHandler();
  handler.init();

  // Export for debugging
  window.webScraperContentHandler = handler;

  console.log('[ContentScript] Loaded');

})();
