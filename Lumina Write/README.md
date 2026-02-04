# Lumina Write - AI Humanizer for Word Online

**High-end AI Humanizer** that transforms AI-generated text into natural, human-like writing directly in Word Online.

## 🌟 Features

- **Glassmorphic UI** - Beautiful, modern interface with frosted-glass effects
- **Streaming Responses** - Watch text humanize word-by-word (ChatGPT-style)
- **Human Score** - Get a percentage score showing how human-like your text is
- **Deep Integration** - Works seamlessly with Word Online
- **One-Click Replace** - Replace original text with humanized version instantly
- **Advanced Settings** - Control creativity and model selection

## 🎯 How It Works

1. **Select Text** - Highlight any text in Word Online
2. **Humanize** - Click the "Humanize" button
3. **Watch It Transform** - See the text stream in real-time
4. **Copy or Replace** - Use the humanized text or replace the original

## 🔧 Installation

1. Clone or download this repository
2. Open Chrome and navigate to `chrome://extensions/`
3. Enable "Developer mode" (top right)
4. Click "Load unpacked"
5. Select the `Lumina Write` folder
6. Open Word Online and start using!

## 📋 Requirements

- Chrome/Edge browser (Manifest V3)
- Word Online access
- DeepSeek API key (included in code)

## 🎨 Design Philosophy

**Glassmorphism** - The UI uses backdrop-filter blur effects to create a translucent, modern interface that feels native to Windows 11 and macOS.

**Zero Icons** - Focus on typography and space. Clean, minimal design.

**Streaming UX** - Text doesn't just appear; it flows word-by-word for a premium experience.

## 🧠 The Science of Humanization

Lumina uses advanced prompts that focus on:

- **Perplexity** - Randomness in word choice (humans don't always pick the "most likely" word)
- **Burstiness** - Varied sentence lengths (mix of short and long sentences)
- **Natural Transitions** - Avoids AI clichés like "In conclusion" or "Moreover"
- **Sentence Variety** - No two consecutive sentences start the same way

## 📁 File Structure

```
Lumina Write/
├── manifest.json       # Extension configuration
├── content.js          # The Snatcher - captures text from Word
├── background.js       # The Brain - DeepSeek API integration
├── sidepanel.html      # The Canvas - glassmorphic UI
├── sidepanel.js        # The Transformer - orchestrates flow
├── styles.css          # Glassmorphism styling
└── README.md           # This file
```

## 🔐 API Key

The extension uses DeepSeek API. The API key is included in `background.js`. For production, consider:

1. Moving the key to Chrome storage
2. Adding an options page for users to enter their own key
3. Using a backend proxy for security

## 🚀 Usage Tips

1. **Select Meaningful Text** - Works best with paragraphs (10+ characters)
2. **Adjust Temperature** - Higher temperature = more creative (default: 0.9)
3. **Check Human Score** - Aim for 90%+ for best results
4. **Use Replace** - One-click replacement saves time

## 🐛 Troubleshooting

**Text not detected?**
- Ensure you're on Word Online (office.com)
- Try selecting text again
- Refresh the page

**Humanization fails?**
- Check internet connection
- Verify API key is valid
- Try with shorter text first

**UI not loading?**
- Check browser console for errors
- Ensure all files are in the extension folder
- Reload the extension

## 📝 License

This project is provided as-is for educational and development purposes.

## 🎓 Technical Details

- **Manifest V3** - Latest Chrome extension standard
- **Streaming API** - Real-time text generation
- **Cross-frame Communication** - Handles Word Online's iframe structure
- **Backdrop Filter** - Modern CSS for glassmorphism

---

**Built with precision for the enterprise market.**
