# Cortex AI - Enterprise Intelligence Platform

**Transform any webpage into instant intelligence with enterprise-grade AI-powered analysis and summarization.**

Cortex AI is a professional Chrome extension that leverages DeepSeek AI to provide real-time content analysis, summarization, and transformation capabilities. Built with a premium, designer-grade interface and fully integrated features.

## ✨ Features

### Core Intelligence
- ✅ **AI Summarization** - Get instant summaries with core thesis, key points, and action items
- ✅ **Contextual Analysis** - Ask custom questions about any page content
- ✅ **Content Transformation** - Convert content into multiple formats instantly
- ✅ **Real-Time Streaming** - See AI responses appear word-by-word in real-time

### Professional Interface
- ✅ **Side Panel UI** - Persistent interface that doesn't block your view
- ✅ **Premium Design** - Professional-grade UI with animations and transitions
- ✅ **Responsive Layout** - Beautiful on all screen sizes
- ✅ **Dark Mode Ready** - Modern color system

### Advanced Features
- ✅ **Email Integration** - Send results directly via email
- ✅ **Export Options** - Download as TXT, Markdown, or PDF
- ✅ **History Tracking** - Automatic saving of all analyses
- ✅ **Settings Page** - Full configuration options
- ✅ **API Usage Analytics** - Track your usage

### Content Formats
- 🐦 **Tweet** - Twitter/X format (280 chars)
- 💼 **LinkedIn** - Professional posts
- 📧 **Email** - Formatted emails
- 👶 **ELI5** - Explain like I'm 5
- • **Bullets** - Actionable bullet points
- ✍️ **Blog** - Professional blog posts

## 🚀 Installation

### For Development/Testing

1. Open Chrome and navigate to `chrome://extensions/`
2. Enable "Developer mode" (toggle in top right)
3. Click "Load unpacked"
4. Select the `Web Intelligence` folder
5. The extension is now installed!

## 📖 Usage

### Quick Start

1. Navigate to any webpage (YouTube, GitHub, news article, etc.)
2. Click the Cortex AI extension icon or press `Ctrl+Shift+I`
3. Click "Summarize" to get an AI-powered summary
4. Use "Analyze" to ask specific questions

### Keyboard Shortcuts

- `Ctrl+Shift+I` (Mac: `Cmd+Shift+I`) - Toggle side panel

### Export & Share

- **Copy** - Copy results to clipboard
- **Export** - Download as TXT, Markdown, or PDF
- **Email** - Send results via email client

## 🏗️ Architecture

### System Components

1. **Content Scraper (content.js)** - The "Eyes"
   - Intelligently extracts main content
   - Removes ads, navigation, and junk
   - Site-specific extraction logic
   - Special handling for YouTube transcripts

2. **Background Service Worker (background.js)** - The "Brain/Courier"
   - Secure API key storage
   - DeepSeek API communication
   - Streaming response handling
   - Error handling and retry logic
   - Usage analytics tracking

3. **Side Panel (sidepanel.html/js)** - The "Command Center"
   - Premium UI interface
   - Real-time streaming display
   - All action buttons
   - Export and email modals

4. **Settings Page (options.html/js)** - Configuration
   - API key management
   - Model selection
   - Temperature and token settings
   - Custom system prompts

## 🔧 API Integration

Cortex AI uses the DeepSeek API (OpenAI-compatible format):

```javascript
// API Endpoint
https://api.deepseek.com/v1/chat/completions

// Request Format
{
  "model": "deepseek-chat",
  "messages": [
    { "role": "system", "content": "..." },
    { "role": "user", "content": "..." }
  ],
  "temperature": 0.7,
  "max_tokens": 2000,
  "stream": true
}
```

### Features
- ✅ Streaming responses for real-time display
- ✅ Error handling with user-friendly messages
- ✅ Token usage tracking
- ✅ Rate limit handling
- ✅ Network error recovery

## 📁 File Structure

```
Web Intelligence/
├── manifest.json       # Extension configuration
├── content.js          # Content scraper (The "Eyes")
├── background.js        # API handler (The "Brain/Courier")
├── sidepanel.html       # Side panel UI (The "Command Center")
├── sidepanel.js         # UI orchestrator
├── styles.css           # Premium design system
├── options.html         # Settings page
├── options.js           # Settings logic
└── README.md           # This file
```

## 🎨 Design System

### Color Palette
- **Primary**: #6366F1 (Indigo)
- **Secondary**: #8B5CF6 (Purple)
- **Accent**: #EC4899 (Pink)
- **Success**: #10B981 (Green)
- **Error**: #EF4444 (Red)

### Typography
- **Font**: Inter (Google Fonts)
- **Weights**: 300, 400, 500, 600, 700
- **Responsive**: Scales beautifully

### Components
- Gradient headers
- Card-based layouts
- Smooth animations
- Professional shadows
- Hover effects

## 🔒 Privacy & Security

- ✅ API key stored securely in extension storage
- ✅ All data processed locally
- ✅ No external tracking
- ✅ Content only sent to DeepSeek API
- ✅ No data stored on external servers

## ⚙️ Configuration

### Settings Page

Access via: Right-click extension icon → "Options"

**Available Settings:**
- API Key configuration
- Model selection (deepseek-chat, deepseek-coder)
- Temperature (0-2)
- Max tokens (1-4096)
- Custom system prompts

## 🐛 Troubleshooting

**Side panel not opening?**
- Check if extension is enabled
- Try clicking the extension icon
- Use keyboard shortcut `Ctrl+Shift+I`

**No content extracted?**
- Refresh the page
- Some pages may not have extractable content
- Check browser console for errors (F12)

**API errors?**
- Verify API key is correct in settings
- Check internet connection
- Ensure DeepSeek API is accessible
- Check rate limits

**Streaming not working?**
- Check browser console for errors
- Verify API key is valid
- Try refreshing the page

## 📊 Analytics

Cortex AI tracks usage analytics locally:
- Total API calls
- Total tokens used
- Calls by action type
- Last call timestamp

View analytics in the settings page.

## 🚀 Performance

- **Fast Content Extraction** - Optimized selectors
- **Efficient API Calls** - Content truncation for long pages
- **Streaming Responses** - Real-time display
- **Minimal Memory Usage** - Efficient code structure

## 🔄 Version History

### v1.0.0
- Initial release as Cortex AI
- Premium professional interface
- Full DeepSeek API integration
- Streaming responses
- Email and export features
- History tracking
- Settings page
- All features fully functional

## 📝 Development

### Making Changes

1. Edit files as needed
2. Go to `chrome://extensions/`
3. Click refresh icon on extension card
4. Reload side panel to see changes

### Debugging

- **Side Panel**: Right-click in side panel → "Inspect"
- **Content Script**: Open webpage, press F12, check Console
- **Background**: Go to `chrome://extensions/` → "Service worker" link

## 🎯 Best Practices

1. **Content Length** - Pages with 5,000-12,000 characters work best
2. **API Key** - Keep your API key secure and don't share it
3. **Rate Limits** - Be mindful of API rate limits
4. **Token Usage** - Monitor usage in settings

## 📄 License

MIT License - Feel free to use and modify

## 🙏 Credits

- **AI Provider**: DeepSeek (https://www.deepseek.com)
- **Design**: Professional design system
- **Icons**: Custom SVG icons

---

**Cortex AI** - Enterprise-grade intelligence at your fingertips.
