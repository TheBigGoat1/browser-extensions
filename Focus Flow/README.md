# Focus Flow - YouTube Distraction Remover

A Chrome extension that helps you stay focused on YouTube by removing distracting elements like sidebars, comments, and home page video grids.

## Features

- ✅ **Hide Sidebar** - Remove recommended videos sidebar
- ✅ **Hide Comments** - Remove comment sections
- ✅ **Hide Home Grid** - Remove video grid on homepage
- ✅ **Channel Management** - Whitelist/blacklist specific channels
- ✅ **Keyboard Shortcuts** - Quick toggle controls
- ✅ **Analytics** - Track your usage (stored locally)
- ✅ **Update Notifications** - Get notified of new versions

## Installation

### For Development/Testing

1. Open Chrome and navigate to `chrome://extensions/`
2. Enable "Developer mode" (toggle in top right)
3. Click "Load unpacked"
4. Select the `Focus Flow` folder
5. The extension is now installed!

### For Production (Chrome Web Store)

1. Create a ZIP file of all extension files
2. Go to [Chrome Web Store Developer Dashboard](https://chrome.google.com/webstore/devconsole)
3. Upload the ZIP file
4. Fill in store listing details
5. Submit for review

## Usage

### Basic Controls

- Click the extension icon to open the popup
- Toggle features on/off using the switches
- Settings are saved automatically

### Keyboard Shortcuts

- `Ctrl+Shift+F` (Mac: `Cmd+Shift+F`) - Toggle extension on/off
- `Ctrl+Shift+S` (Mac: `Cmd+Shift+S`) - Toggle sidebar hiding
- `Ctrl+Shift+C` (Mac: `Cmd+Shift+C`) - Toggle comments hiding

Customize shortcuts at: `chrome://extensions/shortcuts`

### Channel Management

**Whitelist**: Channels where distractions are always shown
- Add channel name or URL to whitelist
- Example: "MrBeast" or "youtube.com/@MrBeast"

**Blacklist**: Channels where distractions are always hidden
- Add channel name or URL to blacklist
- Distractions will be hidden on these channels

**Note**: Whitelist takes priority over blacklist

### Options Page

Right-click extension icon → "Options" to:
- View analytics
- Reset settings
- See keyboard shortcuts

## File Structure

```
Focus Flow/
├── manifest.json       # Extension configuration
├── popup.html          # Popup UI
├── popup.js            # Popup logic
├── content.js          # Main content script
├── background.js       # Background service worker
├── styles.css          # CSS styles
├── options.html        # Options page
├── options.js          # Options page logic
├── analytics.js        # Analytics tracking
├── README.md           # This file
├── TESTING.md          # Testing guide
└── BUILD.md            # Build & publish guide
```

## Permissions

- `storage` - Save user settings
- `tabs` - Communicate with YouTube tabs
- `notifications` - Show update notifications
- `host_permissions` - Access YouTube pages

## Privacy

- All data is stored locally in your browser
- No data is sent to external servers
- Analytics are stored locally only
- No tracking or external analytics

## Version History

### v1.0.0
- Initial release
- Core hiding features
- Channel management
- Keyboard shortcuts
- Analytics tracking
- Update notifications

## Troubleshooting

**Extension not working?**
1. Refresh the YouTube page
2. Check if extension is enabled in `chrome://extensions/`
3. Check browser console for errors (F12)

**Settings not saving?**
1. Check browser storage permissions
2. Try resetting settings in options page

**Keyboard shortcuts not working?**
1. Go to `chrome://extensions/shortcuts`
2. Verify shortcuts are assigned
3. Check for conflicts with other extensions

## Development

### Making Changes

1. Edit files as needed
2. Go to `chrome://extensions/`
3. Click the refresh icon on the extension card
4. Refresh YouTube page to see changes

### Debugging

- **Popup**: Right-click extension icon → "Inspect popup"
- **Content Script**: Open YouTube, press F12, check Console tab
- **Background**: Go to `chrome://extensions/` → "Service worker" link

## License

MIT License - Feel free to use and modify

## Support

For issues or questions, check the browser console for error messages.
