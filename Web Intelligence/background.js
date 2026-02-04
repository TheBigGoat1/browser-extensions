// Cortex AI - Background Service Worker
// Enterprise-grade AI intelligence platform - Secure API communication
// Fully compliant with DeepSeek API specification

const DEEPSEEK_API_KEY = 'sk-58614fb8b5894bc0a119eda739fee8e0';
const DEEPSEEK_BASE_URL = 'https://api.deepseek.com';
const DEEPSEEK_API_URL = `${DEEPSEEK_BASE_URL}/v1/chat/completions`;

// Default system prompt for summarization
const DEFAULT_SYSTEM_PROMPT = `You are an intelligent content analyzer. Your task is to provide clear, concise, and actionable summaries of web content.

Format your response as follows:
1. **Core Thesis**: One sentence summarizing the main point
2. **Key Points**: Bullet points of the main arguments/ideas
3. **Action Items**: What the reader should do based on this information

Be concise, accurate, and actionable.`;

// Initialize extension
chrome.runtime.onInstalled.addListener((details) => {
  if (details.reason === 'install') {
    // Set default settings on first install
    chrome.storage.local.set({
      apiKey: DEEPSEEK_API_KEY,
      systemPrompt: DEFAULT_SYSTEM_PROMPT,
      model: 'deepseek-chat',
      temperature: 0.7,
      maxTokens: 2000
    });
  }
});

// Handle side panel opening
chrome.action.onClicked.addListener((tab) => {
  chrome.sidePanel.open({ windowId: tab.windowId });
});

// Handle keyboard shortcut
chrome.commands.onCommand.addListener((command) => {
  if (command === 'toggle-sidepanel') {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs[0]) {
        chrome.sidePanel.open({ windowId: tabs[0].windowId });
      }
    });
  }
});

// Listen for messages from content script and side panel
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'summarize') {
    handleSummarize(request.data)
      .then(result => sendResponse({ success: true, data: result }))
      .catch(error => {
        console.error('[Cortex AI] Summarize error:', error);
        sendResponse({ success: false, error: error.message || 'Failed to summarize content' });
      });
    return true; // Keep channel open for async
  }
  
  if (request.action === 'analyze') {
    handleAnalyze(request.data, request.query)
      .then(result => sendResponse({ success: true, data: result }))
      .catch(error => {
        console.error('[Cortex AI] Analyze error:', error);
        sendResponse({ success: false, error: error.message || 'Failed to analyze content' });
      });
    return true;
  }
  
  if (request.action === 'rewrite') {
    handleRewrite(request.data, request.format)
      .then(result => sendResponse({ success: true, data: result }))
      .catch(error => {
        console.error('[Cortex AI] Rewrite error:', error);
        sendResponse({ success: false, error: error.message || 'Failed to rewrite content' });
      });
    return true;
  }
  
  return false;
});

// Handle summarization request
async function handleSummarize(pageData) {
  const settings = await chrome.storage.local.get([
    'apiKey', 'systemPrompt', 'model', 'temperature', 'maxTokens'
  ]);
  
  const apiKey = settings.apiKey || DEEPSEEK_API_KEY;
  const systemPrompt = settings.systemPrompt || DEFAULT_SYSTEM_PROMPT;
  
  // Truncate content if too long (to save tokens and ensure API limits)
  const maxContentLength = 12000; // Increased for better context
  const content = pageData.content.length > maxContentLength
    ? pageData.content.substring(0, maxContentLength) + '\n\n[Content truncated for efficiency...]'
    : pageData.content;
  
  const userPrompt = `Please analyze and summarize the following content from a ${pageData.siteType} page:\n\nTitle: ${pageData.title || 'Untitled'}\n\nContent:\n${content}`;
  
  // Stream callback to send chunks to side panel
  const streamCallback = (chunk) => {
    chrome.runtime.sendMessage({
      action: 'streamChunk',
      chunk: chunk
    }).catch(() => {}); // Ignore if no listener
  };
  
  const result = await callDeepSeekAPI(apiKey, systemPrompt, userPrompt, settings, streamCallback);
  await trackAPIUsage('summarize', result.tokensUsed);
  return result;
}

// Handle analysis request
async function handleAnalyze(pageData, query) {
  const settings = await chrome.storage.local.get(['apiKey', 'systemPrompt', 'model', 'temperature', 'maxTokens']);
  const apiKey = settings.apiKey || DEEPSEEK_API_KEY;
  
  const systemPrompt = settings.systemPrompt || `You are an intelligent content analyzer. Answer the user's question about the provided content accurately, concisely, and with actionable insights.`;
  
  // Truncate content if needed
  const maxContentLength = 12000;
  const content = pageData.content.length > maxContentLength
    ? pageData.content.substring(0, maxContentLength) + '\n\n[Content truncated...]'
    : pageData.content;
  
  const userPrompt = `Content from ${pageData.siteType}:\n\nTitle: ${pageData.title || 'Untitled'}\n\nContent:\n${content}\n\nUser Question: ${query}\n\nPlease provide a detailed, accurate answer:`;
  
  const streamCallback = (chunk) => {
    chrome.runtime.sendMessage({
      action: 'streamChunk',
      chunk: chunk
    }).catch(() => {});
  };
  
  const result = await callDeepSeekAPI(apiKey, systemPrompt, userPrompt, settings, streamCallback);
  await trackAPIUsage('analyze', result.tokensUsed);
  return result;
}

// Handle rewrite request
async function handleRewrite(pageData, format) {
  const settings = await chrome.storage.local.get(['apiKey', 'model', 'temperature', 'maxTokens']);
  const apiKey = settings.apiKey || DEEPSEEK_API_KEY;
  
  const formatPrompts = {
    'tweet': 'Rewrite this content as a concise Twitter/X post (280 characters max). Make it engaging, shareable, and include relevant hashtags:',
    'linkedin': 'Rewrite this content as a professional LinkedIn post. Include a compelling hook, key insights, actionable takeaways, and a call-to-action:',
    'email': 'Rewrite this content as a professional email. Include a subject line suggestion, proper greeting, well-structured body, and professional closing:',
    'el5': 'Explain this content like I\'m 5 years old. Use simple language, relatable analogies, avoid jargon, and make it fun and engaging:',
    'bullet': 'Convert this content into clear, actionable bullet points. Make each point concise, valuable, and easy to scan:',
    'blog': 'Rewrite this content as a professional blog post. Include an engaging introduction, well-structured body with clear headings, examples, and a strong conclusion:'
  };
  
  const systemPrompt = `You are a content transformation expert. Rewrite content according to the user's requested format with high quality and attention to detail.`;
  const formatPrompt = formatPrompts[format] || 'Rewrite this content:';
  
  // Truncate content if needed
  const maxContentLength = 12000;
  const content = pageData.content.length > maxContentLength
    ? pageData.content.substring(0, maxContentLength) + '\n\n[Content truncated...]'
    : pageData.content;
  
  const userPrompt = `${formatPrompt}\n\nTitle: ${pageData.title || 'Untitled'}\n\nContent:\n${content}`;
  
  const streamCallback = (chunk) => {
    chrome.runtime.sendMessage({
      action: 'streamChunk',
      chunk: chunk
    }).catch(() => {});
  };
  
  const result = await callDeepSeekAPI(apiKey, systemPrompt, userPrompt, settings, streamCallback);
  await trackAPIUsage(`rewrite_${format}`, result.tokensUsed);
  return result;
}

// Call DeepSeek API - Fully compliant with DeepSeek API specification
// Matches the OpenAI-compatible format: https://api.deepseek.com/v1/chat/completions
async function callDeepSeekAPI(apiKey, systemPrompt, userPrompt, settings, streamCallback) {
  const model = settings.model || 'deepseek-chat';
  const temperature = parseFloat(settings.temperature) || 0.7;
  const maxTokens = parseInt(settings.maxTokens) || 2000;
  
  // Validate settings
  if (temperature < 0 || temperature > 2) {
    throw new Error('Temperature must be between 0 and 2');
  }
  
  if (maxTokens < 1 || maxTokens > 4096) {
    throw new Error('Max tokens must be between 1 and 4096');
  }
  
  // Build request body exactly matching DeepSeek API format
  const requestBody = {
    model: model,
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt }
    ],
    temperature: temperature,
    max_tokens: maxTokens,
    stream: true  // Enable streaming for real-time responses
  };
  
  try {
    console.log('[Cortex AI] Calling DeepSeek API:', {
      model: model,
      temperature: temperature,
      maxTokens: maxTokens,
      contentLength: userPrompt.length
    });
    
    const response = await fetch(DEEPSEEK_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify(requestBody)
    });
    
    // Handle non-OK responses
    if (!response.ok) {
      let errorMessage = `API Error: ${response.status} ${response.statusText}`;
      
      try {
        const errorData = await response.json();
        errorMessage = errorData.error?.message || errorData.error?.code || errorMessage;
        
        // Provide user-friendly error messages
        if (response.status === 401) {
          errorMessage = 'Invalid API key. Please check your settings.';
        } else if (response.status === 429) {
          errorMessage = 'Rate limit exceeded. Please try again later.';
        } else if (response.status === 500) {
          errorMessage = 'DeepSeek API server error. Please try again.';
        }
      } catch (e) {
        // If JSON parsing fails, use default message
      }
      
      throw new Error(errorMessage);
    }
    
    // Handle streaming response
    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let fullResponse = '';
    let buffer = '';
    let chunkCount = 0;
    
    while (true) {
      const { done, value } = await reader.read();
      if (done) {
        console.log('[Cortex AI] Stream complete. Total chunks:', chunkCount);
        break;
      }
      
      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() || '';  // Keep incomplete line in buffer
      
      for (const line of lines) {
        // Skip empty lines
        if (!line.trim()) continue;
        
        // Handle SSE format: "data: {...}" or "data: [DONE]"
        if (line.startsWith('data: ')) {
          const data = line.slice(6).trim();
          
          // Check for completion signal
          if (data === '[DONE]') {
            console.log('[Cortex AI] Received [DONE] signal');
            continue;
          }
          
          try {
            const json = JSON.parse(data);
            
            // Extract content delta from response
            // DeepSeek API format: { choices: [{ delta: { content: "..." } }] }
            const delta = json.choices?.[0]?.delta?.content;
            
            if (delta) {
              fullResponse += delta;
              chunkCount++;
              
              // Stream to callback if provided
              if (streamCallback) {
                streamCallback(delta);
              }
            }
            
            // Check for finish reason
            if (json.choices?.[0]?.finish_reason) {
              console.log('[Cortex AI] Finish reason:', json.choices[0].finish_reason);
            }
            
          } catch (parseError) {
            // Skip invalid JSON lines (may be empty or malformed)
            console.warn('[Cortex AI] Failed to parse JSON:', data.substring(0, 50));
          }
        }
      }
    }
    
    // Return formatted response
    const result = {
      content: fullResponse.trim(),
      model: model,
      tokensUsed: Math.ceil(fullResponse.length / 4), // Rough estimate (4 chars ≈ 1 token)
      chunksReceived: chunkCount
    };
    
    console.log('[Cortex AI] API call successful:', {
      contentLength: result.content.length,
      estimatedTokens: result.tokensUsed,
      chunks: result.chunksReceived
    });
    
    // Track usage
    await trackAPIUsage('api_call', result.tokensUsed);
    
    return result;
    
  } catch (error) {
    console.error('[Cortex AI] API Error:', error);
    
    // Provide more helpful error messages
    if (error.message.includes('Failed to fetch') || error.message.includes('NetworkError')) {
      throw new Error('Network error. Please check your internet connection.');
    }
    
    throw error;
  }
}

// Update side panel when tab changes
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.status === 'complete' && tab.url) {
    // Notify side panel of page change
    chrome.runtime.sendMessage({
      action: 'pageChanged',
      url: tab.url,
      title: tab.title
    }).catch(() => {}); // Ignore if side panel not open
  }
});

// Track API usage for analytics
async function trackAPIUsage(action, tokensUsed) {
  try {
    const analytics = await chrome.storage.local.get(['apiUsage']);
    const usage = analytics.apiUsage || {
      totalCalls: 0,
      totalTokens: 0,
      callsByAction: {}
    };
    
    usage.totalCalls++;
    usage.totalTokens += tokensUsed || 0;
    usage.callsByAction[action] = (usage.callsByAction[action] || 0) + 1;
    usage.lastCall = Date.now();
    
    await chrome.storage.local.set({ apiUsage: usage });
  } catch (error) {
    console.error('[Cortex AI] Error tracking usage:', error);
  }
}
