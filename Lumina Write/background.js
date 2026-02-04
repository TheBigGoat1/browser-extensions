// Lumina Write - The Brain
// Handles DeepSeek API communication with streaming support

const DEEPSEEK_API_KEY = 'sk-58614fb8b5894bc0a119eda739fee8e0';
const DEEPSEEK_API_URL = 'https://api.deepseek.com/v1/chat/completions';

// Writing Styles Configuration
const WRITING_STYLES = {
  professional: {
    name: 'Professional',
    icon: '💼',
    prompt: `You are an expert professional writer. Rewrite the following text in a polished, business-appropriate tone suitable for corporate communications, reports, and professional documents.

CRITICAL REQUIREMENTS:
1. **Professional tone** - Use formal but approachable language. Avoid slang and overly casual expressions
2. **Clear and concise** - Be direct and purposeful. Eliminate unnecessary words
3. **Vary sentence structure** - Mix short impactful statements with longer explanatory sentences
4. **Natural transitions** - Use professional connectors like "Additionally", "However", "Consequently" (but avoid overuse)
5. **Maintain authority** - Sound confident and knowledgeable without being condescending
6. **Avoid AI clichés** - Never use "In conclusion", "It is important to note", "Furthermore" excessively

Rewrite the text below while maintaining all key information and meaning:`
  },
  casual: {
    name: 'Casual',
    icon: '😊',
    prompt: `You are a friendly, conversational writer. Rewrite the following text in a relaxed, approachable tone that feels like a natural conversation.

CRITICAL REQUIREMENTS:
1. **Conversational tone** - Write as if speaking to a friend. Use contractions naturally
2. **Friendly and warm** - Be approachable and engaging. Use everyday language
3. **Varied sentence lengths** - Mix very short sentences (3-5 words) with longer flowing ones
4. **Natural expressions** - Use common phrases and idioms where appropriate
5. **Personal touch** - Add personality and warmth without being unprofessional
6. **Avoid formality** - Skip corporate jargon and overly formal language

Rewrite the text below while maintaining all key information and meaning:`
  },
  academic: {
    name: 'Academic',
    icon: '🎓',
    prompt: `You are a scholarly academic writer. Rewrite the following text in a formal, scholarly tone suitable for research papers, academic articles, and educational content.

CRITICAL REQUIREMENTS:
1. **Formal academic tone** - Use precise, scholarly language. Maintain objectivity
2. **Evidence-based** - Present information in a measured, analytical manner
3. **Complex sentence structures** - Use sophisticated syntax appropriate for academic discourse
4. **Precise terminology** - Use domain-specific vocabulary accurately
5. **Avoid casual language** - No contractions, slang, or conversational expressions
6. **Logical flow** - Structure arguments clearly with appropriate academic transitions

Rewrite the text below while maintaining all key information and meaning:`
  },
  creative: {
    name: 'Creative',
    icon: '✨',
    prompt: `You are a creative writer with a flair for engaging storytelling. Rewrite the following text in a vibrant, expressive style that captivates readers.

CRITICAL REQUIREMENTS:
1. **Vivid language** - Use descriptive, evocative words. Paint pictures with words
2. **Dramatic variation** - Extremely varied sentence lengths for rhythm and impact
3. **Creative expressions** - Use metaphors, similes, and creative phrasing
4. **Emotional resonance** - Connect with readers on an emotional level
5. **Unique voice** - Develop a distinctive writing style that stands out
6. **Engaging flow** - Create a narrative rhythm that keeps readers engaged

Rewrite the text below while maintaining all key information and meaning:`
  },
  technical: {
    name: 'Technical',
    icon: '⚙️',
    prompt: `You are a technical writer specializing in clear, precise documentation. Rewrite the following text in a clear, technical style suitable for documentation, manuals, and technical content.

CRITICAL REQUIREMENTS:
1. **Precision and clarity** - Be exact and unambiguous. Every word should have purpose
2. **Structured information** - Organize content logically with clear hierarchies
3. **Technical accuracy** - Maintain all technical details and terminology
4. **Accessible complexity** - Explain complex concepts clearly without dumbing down
5. **Action-oriented** - Use active voice and imperative mood where appropriate
6. **No fluff** - Eliminate unnecessary words. Be direct and efficient

Rewrite the text below while maintaining all key information and meaning:`
  }
};

// Get prompt for writing style
function getPromptForStyle(style = 'professional') {
  const styleConfig = WRITING_STYLES[style] || WRITING_STYLES.professional;
  return styleConfig.prompt;
}

// Open side panel when extension icon is clicked
chrome.action.onClicked.addListener((tab) => {
  chrome.sidePanel.open({ windowId: tab.windowId });
});

// Handle keyboard shortcuts
chrome.commands.onCommand.addListener((command) => {
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    if (tabs[0]) {
      chrome.sidePanel.open({ windowId: tabs[0].windowId });
      
      // Send message to sidepanel
      setTimeout(() => {
        chrome.runtime.sendMessage({
          action: command === 'humanize' ? 'humanize' : 
                  command === 'copy-humanized' ? 'copy' : 
                  command === 'replace-text' ? 'replace' : null
        }).catch(() => {});
      }, 500);
    }
  });
});

// Handle messages from content script and sidepanel
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'humanizeText') {
    humanizeText(request.text, request.settings || {})
      .then(result => sendResponse(result))
      .catch(error => sendResponse({ success: false, error: error.message }));
    return true; // Keep channel open for async response
  } else if (request.action === 'wordOnlineDetected') {
    // Word Online detected - ensure sidepanel is available
    chrome.sidePanel.setOptions({
      enabled: true
    });
  }
});

// Humanize text using DeepSeek API with streaming
async function humanizeText(text, settings = {}) {
  if (!text || text.trim().length < 10) {
    return { success: false, error: 'Text too short. Please select at least 10 characters.' };
  }

  try {
    const response = await fetch(DEEPSEEK_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${DEEPSEEK_API_KEY}`
      },
      body: JSON.stringify({
        model: settings.model || 'deepseek-chat',
        messages: [
          {
            role: 'system',
            content: getPromptForStyle(settings.writingStyle || 'professional')
          },
          {
            role: 'user',
            content: text
          }
        ],
        temperature: settings.temperature || 0.9, // Higher temperature for more creativity
        max_tokens: settings.maxTokens || 2000,
        stream: true // Enable streaming
      })
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Unknown error' }));
      throw new Error(error.error?.message || `API error: ${response.status}`);
    }

    // Return the reader for streaming
    return {
      success: true,
      stream: response.body.getReader(),
      textDecoder: new TextDecoder()
    };

  } catch (error) {
    console.error('[Lumina] Humanization error:', error);
    return {
      success: false,
      error: error.message || 'Failed to humanize text. Please try again.'
    };
  }
}

// Calculate comprehensive quality metrics
function calculateQualityMetrics(originalText, humanizedText) {
  const metrics = {
    humanScore: 100,
    perplexity: 0,
    burstiness: 0,
    readability: 0,
    aiDetectionRisk: 0,
    wordCount: {
      original: originalText.split(/\s+/).length,
      humanized: humanizedText.split(/\s+/).length
    },
    sentenceCount: {
      original: originalText.split(/[.!?]+/).filter(s => s.trim().length > 0).length,
      humanized: humanizedText.split(/[.!?]+/).filter(s => s.trim().length > 0).length
    }
  };
  
  const lowerText = humanizedText.toLowerCase();
  
  // 1. AI Clichés Detection
  const aiClichés = [
    'in conclusion', 'moreover', 'furthermore', 'it is important to note',
    'it should be noted', 'it is worth mentioning', 'as a result',
    'in addition', 'to summarize', 'in summary'
  ];
  let clichéCount = 0;
  aiClichés.forEach(cliché => {
    if (lowerText.includes(cliché)) {
      clichéCount++;
      metrics.humanScore -= 3;
    }
  });
  metrics.aiDetectionRisk = Math.min(100, clichéCount * 15);

  // 2. Sentence Length Variety (Burstiness)
  const sentences = humanizedText.split(/[.!?]+/).filter(s => s.trim().length > 0);
  if (sentences.length > 1) {
    const lengths = sentences.map(s => s.trim().split(/\s+/).length);
    const avgLength = lengths.reduce((a, b) => a + b, 0) / lengths.length;
    const variance = lengths.reduce((sum, len) => sum + Math.pow(len - avgLength, 2), 0) / lengths.length;
    
    // Burstiness score (0-100): Higher variance = more human-like
    metrics.burstiness = Math.min(100, Math.round((variance / 100) * 100));
    
    if (variance > 50) {
      metrics.humanScore += 5;
    } else if (variance < 20) {
      metrics.humanScore -= 10;
    }
  }

  // 3. Sentence Starting Variety (Perplexity indicator)
  const firstWords = sentences.map(s => s.trim().split(/\s+/)[0].toLowerCase());
  const uniqueStarts = new Set(firstWords).size;
  const startVariety = (uniqueStarts / sentences.length) * 100;
  metrics.perplexity = Math.round(startVariety);
  
  if (startVariety < 60) {
    metrics.humanScore -= 10;
  } else if (startVariety > 80) {
    metrics.humanScore += 5;
  }

  // 4. Readability (Flesch Reading Ease approximation)
  const words = humanizedText.split(/\s+/).length;
  const sentences_count = sentences.length;
  const syllables = humanizedText.match(/[aeiouy]+/gi)?.length || words;
  const avgSentenceLength = words / sentences_count;
  const avgSyllablesPerWord = syllables / words;
  
  // Simplified Flesch score (higher = easier to read)
  const fleschScore = 206.835 - (1.015 * avgSentenceLength) - (84.6 * avgSyllablesPerWord);
  metrics.readability = Math.max(0, Math.min(100, Math.round(fleschScore)));

  // 5. Word variety (unique words / total words)
  const uniqueWords = new Set(humanizedText.toLowerCase().match(/\b\w+\b/g) || []).size;
  const wordVariety = (uniqueWords / words) * 100;
  if (wordVariety < 40) {
    metrics.humanScore -= 5;
  }

  // 6. Contraction usage (more natural)
  const contractions = (humanizedText.match(/\b\w+'(t|s|d|ll|ve|re|m)\b/gi) || []).length;
  if (contractions > 0 && contractions < words * 0.1) {
    metrics.humanScore += 3;
  }

  // Ensure score is between 0-100
  metrics.humanScore = Math.max(0, Math.min(100, Math.round(metrics.humanScore)));

  return metrics;
}

// Export for use in sidepanel
if (typeof chrome !== 'undefined') {
  chrome.runtime.onConnect.addListener((port) => {
    if (port.name === 'lumina-stream') {
      port.onMessage.addListener(async (request) => {
        if (request.action === 'humanize') {
          const result = await humanizeText(request.text, request.settings);
          if (result.success && result.stream) {
            // Stream the response
            const reader = result.stream;
            const decoder = result.textDecoder;
            let buffer = '';
            let fullText = '';

            try {
              while (true) {
                const { done, value } = await reader.read();
                if (done) break;

                buffer += decoder.decode(value, { stream: true });
                const lines = buffer.split('\n');
                buffer = lines.pop() || '';

                for (const line of lines) {
                  if (line.startsWith('data: ')) {
                    const data = line.slice(6);
                    if (data === '[DONE]') continue;

                    try {
                      const json = JSON.parse(data);
                      const delta = json.choices?.[0]?.delta?.content || '';
                      if (delta) {
                        fullText += delta;
                        port.postMessage({
                          type: 'chunk',
                          text: delta,
                          fullText: fullText
                        });
                      }
                    } catch (e) {
                      // Skip invalid JSON
                    }
                  }
                }
              }

              // Final message with complete text and metrics
              const metrics = calculateQualityMetrics(request.text, fullText);
              port.postMessage({
                type: 'complete',
                fullText: fullText,
                metrics: metrics
              });

            } catch (error) {
              port.postMessage({
                type: 'error',
                error: error.message
              });
            }
          } else {
            port.postMessage({
              type: 'error',
              error: result.error
            });
          }
        }
      });
    }
  });
}
