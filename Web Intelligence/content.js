// Web Intelligence - Content Scraper
// Intelligently extracts the "meat" of webpages, avoiding junk content

// Configuration for different site types
const SITE_CONFIGS = {
  youtube: {
    selectors: [
      'ytd-transcript-segment-renderer',
      '#description-text',
      'ytd-watch-metadata h1',
      'ytd-video-primary-info-renderer'
    ],
    transcriptSelector: 'ytd-transcript-segment-renderer',
    titleSelector: 'h1.ytd-watch-metadata, h1.title',
    descriptionSelector: '#description-text'
  },
  github: {
    selectors: [
      'article',
      '.markdown-body',
      '.repository-content',
      'readme-toc',
      '.Box-body'
    ],
    titleSelector: 'h1',
    descriptionSelector: '.markdown-body'
  },
  news: {
    selectors: [
      'article',
      '[role="article"]',
      '.article-body',
      '.post-content',
      '.entry-content'
    ],
    titleSelector: 'h1',
    descriptionSelector: 'article p'
  },
  default: {
    selectors: [
      'main',
      'article',
      '[role="main"]',
      '.content',
      '.post',
      'body'
    ],
    titleSelector: 'h1, h2',
    descriptionSelector: 'p'
  }
};

// Detect site type
function detectSiteType(url) {
  if (url.includes('youtube.com') || url.includes('youtu.be')) {
    return 'youtube';
  } else if (url.includes('github.com')) {
    return 'github';
  } else if (url.match(/\.(com|org|net)\/(news|article|post)/i)) {
    return 'news';
  }
  return 'default';
}

// Clean text content
function cleanText(text) {
  if (!text) return '';
  
  return text
    .replace(/\s+/g, ' ')  // Multiple spaces to single
    .replace(/\n{3,}/g, '\n\n')  // Multiple newlines to double
    .trim();
}

// Extract YouTube transcript
function extractYouTubeTranscript() {
  const segments = document.querySelectorAll('ytd-transcript-segment-renderer');
  if (segments.length === 0) return null;
  
  const transcript = Array.from(segments)
    .map(segment => {
      const time = segment.querySelector('.segment-timestamp')?.textContent || '';
      const text = segment.querySelector('.segment-text')?.textContent || '';
      return `${time} ${text}`;
    })
    .join('\n');
  
  return cleanText(transcript);
}

// Extract main content from page
function extractMainContent(siteType) {
  const config = SITE_CONFIGS[siteType] || SITE_CONFIGS.default;
  let content = '';
  
  // Try each selector until we find content
  for (const selector of config.selectors) {
    const elements = document.querySelectorAll(selector);
    if (elements.length > 0) {
      // Get text from all matching elements
      elements.forEach(el => {
        // Remove script, style, and other junk
        const clone = el.cloneNode(true);
        const scripts = clone.querySelectorAll('script, style, nav, footer, aside, .ad, .advertisement, [class*="ad-"], [id*="ad-"]');
        scripts.forEach(s => s.remove());
        
        const text = clone.textContent || '';
        if (text.length > 100) {  // Only add substantial content
          content += text + '\n\n';
        }
      });
      
      if (content.length > 200) break;  // We have enough content
    }
  }
  
  return cleanText(content);
}

// Extract page title
function extractTitle(siteType) {
  const config = SITE_CONFIGS[siteType] || SITE_CONFIGS.default;
  
  // Try title selector first
  const titleEl = document.querySelector(config.titleSelector);
  if (titleEl) {
    return cleanText(titleEl.textContent);
  }
  
  // Fallback to meta tags
  const metaTitle = document.querySelector('meta[property="og:title"]') || 
                    document.querySelector('title');
  if (metaTitle) {
    return cleanText(metaTitle.getAttribute('content') || metaTitle.textContent);
  }
  
  return document.title || 'Untitled';
}

// Extract page description
function extractDescription(siteType) {
  const config = SITE_CONFIGS[siteType] || SITE_CONFIGS.default;
  
  const descEl = document.querySelector(config.descriptionSelector);
  if (descEl) {
    return cleanText(descEl.textContent).substring(0, 500);
  }
  
  // Fallback to meta description
  const metaDesc = document.querySelector('meta[name="description"]') ||
                   document.querySelector('meta[property="og:description"]');
  if (metaDesc) {
    return cleanText(metaDesc.getAttribute('content') || '');
  }
  
  return '';
}

// Main extraction function
function extractPageContent() {
  const url = window.location.href;
  const siteType = detectSiteType(url);
  
  let content = '';
  let transcript = null;
  
  // Special handling for YouTube
  if (siteType === 'youtube') {
    transcript = extractYouTubeTranscript();
    if (transcript) {
      content = transcript;
    } else {
      // Fallback to description if transcript not available
      content = extractMainContent(siteType);
    }
  } else {
    content = extractMainContent(siteType);
  }
  
  const title = extractTitle(siteType);
  const description = extractDescription(siteType);
  
  // Combine all content
  let fullContent = title ? `Title: ${title}\n\n` : '';
  if (description && !content.includes(description)) {
    fullContent += `Description: ${description}\n\n`;
  }
  fullContent += content;
  
  return {
    url: url,
    title: title,
    content: cleanText(fullContent),
    siteType: siteType,
    hasTranscript: !!transcript,
    contentLength: fullContent.length
  };
}

// Listen for messages from side panel
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'extractContent') {
    try {
      const pageData = extractPageContent();
      sendResponse({ success: true, data: pageData });
    } catch (error) {
      console.error('[Web Intelligence] Extraction error:', error);
      sendResponse({ 
        success: false, 
        error: error.message,
        data: {
          url: window.location.href,
          title: document.title,
          content: '',
          siteType: 'default'
        }
      });
    }
    return true; // Keep channel open for async response
  }
  
  if (request.action === 'getPageInfo') {
    sendResponse({
      url: window.location.href,
      title: document.title,
      siteType: detectSiteType(window.location.href)
    });
    return true;
  }
});

// Notify when page is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    // Page loaded
  });
} else {
  // Page already loaded
}
