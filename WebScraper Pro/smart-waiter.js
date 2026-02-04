/**
 * WebScraper Pro - Smart Waiter
 * Advanced wait strategies for dynamic content
 */

(function() {
  'use strict';

  class SmartWaiter {
    /**
     * Wait for content with multiple strategies
     * @param {string|Function} selector - CSS selector or function
     * @param {Object} options - Wait options
     * @returns {Promise<Element|Array>}
     */
    static async waitForContent(selector, options = {}) {
      const {
        timeout = 10000,
        checkInterval = 500,
        minElements = 1,
        stableFor = 1000, // Content stable for 1s
        strategy = 'multi' // 'visibility', 'network', 'stable', 'multi'
      } = options;

      const startTime = Date.now();

      // Multi-strategy: try all strategies in parallel
      if (strategy === 'multi') {
        return Promise.race([
          this.waitForVisible(selector, { timeout, minElements }),
          this.waitForNetworkIdle({ timeout }),
          this.waitForStableContent(selector, { timeout, stableFor, minElements })
        ]).catch(() => {
          // If all fail, try visibility as fallback
          return this.waitForVisible(selector, { timeout: timeout / 2, minElements });
        });
      }

      // Single strategy
      switch (strategy) {
        case 'visibility':
          return this.waitForVisible(selector, { timeout, minElements });
        case 'network':
          return this.waitForNetworkIdle({ timeout });
        case 'stable':
          return this.waitForStableContent(selector, { timeout, stableFor, minElements });
        default:
          return this.waitForVisible(selector, { timeout, minElements });
      }
    }

    /**
     * Wait for element(s) to be visible
     */
    static async waitForVisible(selector, options = {}) {
      const { timeout = 10000, minElements = 1, checkInterval = 500 } = options;
      const startTime = Date.now();

      return new Promise((resolve, reject) => {
        const check = () => {
          const elements = typeof selector === 'function' 
            ? selector() 
            : Array.from(document.querySelectorAll(selector));

          const visibleElements = elements.filter(el => {
            const rect = el.getBoundingClientRect();
            return rect.width > 0 && rect.height > 0 && 
                   window.getComputedStyle(el).visibility !== 'hidden' &&
                   window.getComputedStyle(el).display !== 'none';
          });

          if (visibleElements.length >= minElements) {
            resolve(minElements === 1 ? visibleElements[0] : visibleElements);
            return;
          }

          if (Date.now() - startTime > timeout) {
            reject(new Error(`Timeout: ${minElements} visible element(s) not found for selector: ${selector}`));
            return;
          }

          setTimeout(check, checkInterval);
        };

        check();
      });
    }

    /**
     * Wait for network to be idle (no pending requests)
     */
    static async waitForNetworkIdle(options = {}) {
      const { timeout = 10000, idleTime = 500 } = options;
      const startTime = Date.now();

      return new Promise((resolve, reject) => {
        let idleTimer = null;
        let pendingRequests = 0;

        const checkIdle = () => {
          if (pendingRequests === 0) {
            if (idleTimer) {
              clearTimeout(idleTimer);
            }
            idleTimer = setTimeout(() => {
              resolve();
            }, idleTime);
          }
        };

        // Monitor fetch requests
        const originalFetch = window.fetch;
        window.fetch = function(...args) {
          pendingRequests++;
          return originalFetch.apply(this, args)
            .finally(() => {
              pendingRequests--;
              checkIdle();
            });
        };

        // Monitor XMLHttpRequest
        const originalOpen = XMLHttpRequest.prototype.open;
        const originalSend = XMLHttpRequest.prototype.send;
        
        XMLHttpRequest.prototype.open = function(...args) {
          this._isRequest = true;
          return originalOpen.apply(this, args);
        };

        XMLHttpRequest.prototype.send = function(...args) {
          if (this._isRequest) {
            pendingRequests++;
            this.addEventListener('loadend', () => {
              pendingRequests--;
              checkIdle();
            }, { once: true });
          }
          return originalSend.apply(this, args);
        };

        // Initial check
        checkIdle();

        // Timeout
        setTimeout(() => {
          window.fetch = originalFetch;
          XMLHttpRequest.prototype.open = originalOpen;
          XMLHttpRequest.prototype.send = originalSend;
          if (pendingRequests === 0) {
            resolve();
          } else {
            reject(new Error(`Timeout: Network not idle after ${timeout}ms`));
          }
        }, timeout);
      });
    }

    /**
     * Wait for content to be stable (no changes for specified time)
     */
    static async waitForStableContent(selector, options = {}) {
      const { timeout = 10000, stableFor = 1000, minElements = 1, checkInterval = 500 } = options;
      const startTime = Date.now();
      let lastContent = null;
      let stableSince = null;

      return new Promise((resolve, reject) => {
        const check = () => {
          const elements = typeof selector === 'function'
            ? selector()
            : Array.from(document.querySelectorAll(selector));

          const visibleElements = elements.filter(el => {
            const rect = el.getBoundingClientRect();
            return rect.width > 0 && rect.height > 0;
          });

          if (visibleElements.length < minElements) {
            stableSince = null;
            lastContent = null;
          } else {
            // Get content hash
            const contentHash = visibleElements.map(el => {
              return el.textContent?.trim() || el.outerHTML?.substring(0, 100);
            }).join('|');

            if (contentHash === lastContent) {
              if (!stableSince) {
                stableSince = Date.now();
              } else if (Date.now() - stableSince >= stableFor) {
                resolve(minElements === 1 ? visibleElements[0] : visibleElements);
                return;
              }
            } else {
              lastContent = contentHash;
              stableSince = null;
            }
          }

          if (Date.now() - startTime > timeout) {
            reject(new Error(`Timeout: Content not stable for selector: ${selector}`));
            return;
          }

          setTimeout(check, checkInterval);
        };

        check();
      });
    }

    /**
     * Wait for page to be fully loaded
     */
    static async waitForPageReady(options = {}) {
      const { timeout = 15000 } = options;

      return Promise.race([
        new Promise(resolve => {
          if (document.readyState === 'complete') {
            resolve();
          } else {
            window.addEventListener('load', resolve, { once: true });
          }
        }),
        this.waitForNetworkIdle({ timeout }),
        new Promise((_, reject) => {
          setTimeout(() => reject(new Error('Page load timeout')), timeout);
        })
      ]).catch(() => {
        // Even if timeout, return if DOM is ready
        if (document.readyState === 'interactive' || document.readyState === 'complete') {
          return;
        }
        throw new Error('Page not ready');
      });
    }

    /**
     * Wait with exponential backoff
     */
    static async waitWithBackoff(attempt, baseDelay = 1000, maxDelay = 10000) {
      const delay = Math.min(baseDelay * Math.pow(2, attempt), maxDelay);
      return new Promise(resolve => setTimeout(resolve, delay));
    }
  }

  // Export
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = SmartWaiter;
  } else {
    window.SmartWaiter = SmartWaiter;
  }

  console.log('[SmartWaiter] Module loaded');

})();
