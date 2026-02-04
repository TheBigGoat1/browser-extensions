// AfriCart - Smart Site-Specific Parser
// Contextual awareness: Knows exactly what store you're on and extracts data accurately

class AfriCartParser {
  constructor() {
    // Site-specific parsing rules with fallbacks
    this.parsingRules = {
      // ============================================
      // AFRICAN STORES - DETAILED RULES
      // ============================================
      
      'jumia.com.ng': {
        name: 'Jumia Nigeria',
        selectors: {
          title: [
            'h1[data-name]',
            'h1.-fs20',
            '.product-title h1',
            'h1.product-title',
            'h1'
          ],
          price: [
            '[data-price]',
            '.price .-b',
            '.price.-fs24',
            '.price',
            '[data-price-value]'
          ],
          originalPrice: [
            '.old-price',
            '.was-price',
            's.-fs16',
            'del.-fs16',
            '.price-was'
          ],
          image: [
            '.image-gallery img[data-src]',
            '.image-gallery img',
            '.product-image img',
            'img[data-src]',
            '.main-image img'
          ],
          description: [
            '.product-description',
            '.markup',
            '.description',
            '#productDescription'
          ],
          availability: [
            '.stock-status',
            '[data-stock]',
            '.availability',
            '.in-stock'
          ],
          rating: [
            '.rating',
            '[data-rating]',
            '.stars',
            '.product-rating'
          ]
        },
        extractors: {
          price: (element) => {
            if (!element) return null;
            const text = element.textContent || element.getAttribute('data-price') || '';
            return text.replace(/[^\d.,]/g, '').trim();
          },
          availability: (element) => {
            if (!element) return 'unknown';
            const text = element.textContent.toLowerCase();
            if (text.includes('in stock') || text.includes('available')) return 'in_stock';
            if (text.includes('out of stock') || text.includes('unavailable')) return 'out_of_stock';
            if (text.includes('pre-order')) return 'pre_order';
            return 'unknown';
          }
        }
      },

      'konga.com': {
        name: 'Konga',
        selectors: {
          title: [
            'h1.product-name',
            '.product-title h1',
            'h1',
            '.product-header h1'
          ],
          price: [
            '.product-price',
            '.price',
            '[data-price]',
            '.current-price'
          ],
          originalPrice: [
            '.old-price',
            '.was-price',
            's',
            'del'
          ],
          image: [
            '.product-image img',
            '.main-image img',
            'img.product-image',
            '.gallery img'
          ],
          description: [
            '.product-description',
            '.description',
            '#productDescription'
          ],
          availability: [
            '.stock-status',
            '.availability',
            '[data-stock]'
          ]
        }
      },

      'takealot.com': {
        name: 'Takealot',
        selectors: {
          title: [
            'h1.product-title',
            'h1',
            '.product-name h1'
          ],
          price: [
            '.currency',
            '.price',
            '[data-price]',
            '.product-price'
          ],
          originalPrice: [
            '.was-price',
            '.old-price',
            's',
            'del'
          ],
          image: [
            '.product-image img',
            '.main-image img',
            'img.product-image'
          ],
          description: [
            '.product-description',
            '.description'
          ],
          availability: [
            '.stock-status',
            '.availability',
            '[data-stock]'
          ]
        }
      },

      // ============================================
      // AMAZON - MULTI-REGION
      // ============================================
      
      'amazon.com': {
        name: 'Amazon',
        selectors: {
          title: [
            '#productTitle',
            'h1.a-size-large',
            'h1',
            '.product-title'
          ],
          price: [
            '.a-price .a-offscreen',
            '.a-price-whole',
            '.price',
            '#priceblock_ourprice',
            '#priceblock_dealprice'
          ],
          originalPrice: [
            '.a-price-was',
            '.a-text-strike',
            '.a-price.a-text-price',
            's',
            'del'
          ],
          image: [
            '#landingImage',
            '#imgBlkFront',
            '.a-dynamic-image',
            '#main-image'
          ],
          description: [
            '#productDescription',
            '#feature-bullets',
            '.product-description'
          ],
          availability: [
            '#availability',
            '.a-color-success',
            '.a-color-state',
            '[data-availability]'
          ],
          rating: [
            '#acrPopover',
            '.a-icon-alt',
            '[data-hook="rating"]'
          ]
        },
        extractors: {
          price: (element) => {
            if (!element) return null;
            // Amazon often has price in aria-label or data attribute
            const priceText = element.getAttribute('aria-label') || 
                            element.textContent || 
                            element.getAttribute('data-a-price') || '';
            return priceText.replace(/[^\d.,]/g, '').trim();
          },
          availability: (element) => {
            if (!element) return 'unknown';
            const text = element.textContent.toLowerCase();
            if (text.includes('in stock')) return 'in_stock';
            if (text.includes('out of stock')) return 'out_of_stock';
            if (text.includes('temporarily out')) return 'out_of_stock';
            if (text.includes('pre-order')) return 'pre_order';
            return 'unknown';
          }
        }
      },

      // ============================================
      // EBAY
      // ============================================
      
      'ebay.com': {
        name: 'eBay',
        selectors: {
          title: [
            'h1#x-item-title-label',
            'h1',
            '.product-title'
          ],
          price: [
            '.notranslate',
            '.price',
            '[data-price]',
            '#prcIsum'
          ],
          originalPrice: [
            '.was-price',
            '.old-price',
            's',
            'del'
          ],
          image: [
            '.img-wrap img',
            '.product-image img',
            '#icImg'
          ],
          description: [
            '.product-description',
            '.description',
            '#viTabs_0_is'
          ],
          availability: [
            '.qtyTxt',
            '.qtySel',
            '[data-stock]'
          ]
        }
      },

      // ============================================
      // WALMART
      // ============================================
      
      'walmart.com': {
        name: 'Walmart',
        selectors: {
          title: [
            'h1.prod-ProductTitle',
            'h1',
            '.product-title'
          ],
          price: [
            '.price-current',
            '.price',
            '[data-price]',
            '.prod-PriceHero .price'
          ],
          originalPrice: [
            '.price-was',
            '.old-price',
            's',
            'del'
          ],
          image: [
            '.prod-hero-image img',
            '.product-image img',
            '[data-testid="product-image"]'
          ],
          description: [
            '.product-description',
            '.description',
            '[data-testid="product-description"]'
          ],
          availability: [
            '.prod-ProductOffer',
            '[data-testid="availability"]',
            '.availability'
          ]
        }
      }
    };
  }

  // Main parsing function - tries all selectors in order
  parse(hostname, document) {
    const cleanHost = hostname.replace(/^www\./, '');
    const rules = this.findRules(cleanHost);
    
    if (!rules) {
      return this.fallbackParse(document);
    }

    const result = {
      store: rules.name,
      title: this.extractWithSelectors(document, rules.selectors.title),
      price: this.extractWithSelectors(document, rules.selectors.price, rules.extractors?.price),
      originalPrice: this.extractWithSelectors(document, rules.selectors.originalPrice),
      image: this.extractWithSelectors(document, rules.selectors.image, null, 'src'),
      description: this.extractWithSelectors(document, rules.selectors.description),
      availability: this.extractWithSelectors(document, rules.selectors.availability, rules.extractors?.availability),
      rating: this.extractWithSelectors(document, rules.selectors.rating)
    };

    // Clean and validate
    result.price = this.cleanPrice(result.price);
    result.originalPrice = this.cleanPrice(result.originalPrice);
    result.title = this.cleanText(result.title);
    result.description = this.cleanText(result.description)?.substring(0, 200);

    return result;
  }

  findRules(hostname) {
    // Exact match first
    if (this.parsingRules[hostname]) {
      return this.parsingRules[hostname];
    }

    // Partial match (e.g., jumia.com.ng matches jumia)
    for (const [domain, rules] of Object.entries(this.parsingRules)) {
      if (hostname.includes(domain) || domain.includes(hostname.split('.')[0])) {
        return rules;
      }
    }

    return null;
  }

  extractWithSelectors(document, selectors, extractor = null, attribute = 'textContent') {
    if (!selectors || !Array.isArray(selectors)) return null;

    for (const selector of selectors) {
      try {
        const element = document.querySelector(selector);
        if (element) {
          if (extractor) {
            return extractor(element);
          }
          if (attribute === 'src' || attribute === 'href') {
            return element.getAttribute(attribute) || element.getAttribute('data-src') || element.src;
          }
          return element[attribute] || element.textContent;
        }
      } catch (error) {
        // Continue to next selector
        continue;
      }
    }

    return null;
  }

  fallbackParse(document) {
    // Generic fallback parsing
    return {
      store: 'Unknown',
      title: this.extractWithSelectors(document, ['h1', '.product-title', '.title']),
      price: this.cleanPrice(this.extractWithSelectors(document, ['.price', '[data-price]', '[class*="price"]'])),
      originalPrice: this.cleanPrice(this.extractWithSelectors(document, ['.old-price', '.was-price', 's', 'del'])),
      image: this.extractWithSelectors(document, ['img.product-image', 'img.main-image', '.product-image img'], null, 'src'),
      description: this.extractWithSelectors(document, ['.product-description', '.description']),
      availability: 'unknown',
      rating: null
    };
  }

  cleanPrice(priceText) {
    if (!priceText) return null;
    if (typeof priceText === 'number') return priceText.toString();
    return priceText.toString().replace(/[^\d.,]/g, '').trim();
  }

  cleanText(text) {
    if (!text) return null;
    return text.toString().trim().replace(/\s+/g, ' ');
  }

  // Detect coupon codes on page
  detectCoupons(document) {
    const coupons = [];
    const couponPatterns = [
      /(?:code|promo|voucher|discount)[\s:]*([A-Z0-9]{4,20})/gi,
      /(?:save|get|use)[\s:]*([0-9]+%?)[\s:]*off/gi,
      /([A-Z]{2,}[0-9]{2,})/g, // Pattern like SAVE20, JUMIA5
      /(?:coupon|code)[\s:]*([A-Z0-9-]{4,})/gi
    ];

    // Search in common coupon locations
    const searchAreas = [
      document.body.textContent,
      ...Array.from(document.querySelectorAll('.promo, .coupon, .discount, .voucher, .banner, .popup')).map(el => el.textContent)
    ];

    searchAreas.forEach(text => {
      if (!text) return;
      
      couponPatterns.forEach(pattern => {
        const matches = text.matchAll(pattern);
        for (const match of matches) {
          const code = match[1] || match[0];
          if (code && code.length >= 4 && code.length <= 20) {
            coupons.push({
              code: code.toUpperCase(),
              foundIn: match[0],
              context: text.substring(Math.max(0, match.index - 20), match.index + match[0].length + 20)
            });
          }
        }
      });
    });

    // Remove duplicates
    const uniqueCoupons = [];
    const seenCodes = new Set();
    coupons.forEach(coupon => {
      if (!seenCodes.has(coupon.code)) {
        seenCodes.add(coupon.code);
        uniqueCoupons.push(coupon);
      }
    });

    return uniqueCoupons;
  }
}

// Export singleton instance
const africartParser = new AfriCartParser();

// Make available globally
if (typeof window !== 'undefined') {
  window.africartParser = africartParser;
}
