# YouTube Downloader Pro

A powerful Chrome extension for downloading YouTube videos and audio with advanced features and multiple download service support.

## Features

### ✅ Current Features (v1.0.0)

- **Download Button** - Adds download button to YouTube video pages
- **Multiple Services** - Support for YouTubePP, Y2Mate, SaveFrom
- **Video Info** - Extract video title, channel, and ID
- **Quality Selection** - Choose download quality preference
- **Keyboard Shortcuts** - Quick download (Ctrl+Shift+D)
- **Settings Page** - Configure default service and quality
- **Analytics** - Track download usage (local storage only)

## Installation

### For Development/Testing

1. Open Chrome and navigate to `chrome://extensions/`
2. Enable "Developer mode" (toggle in top right)
3. Click "Load unpacked"
4. Select the `YouTube Downloader` folder
5. The extension is now installed!

## Usage

### Basic Usage

1. Navigate to any YouTube video
2. Click the red "Download" button in the action bar
3. Choose your preferred download service
4. Select quality and download

### Popup Interface

- Click the extension icon to open the popup
- View current video information
- Select download service and quality
- Click "Download Now" or "Audio Only"

### Keyboard Shortcuts

- `Ctrl+Shift+D` (Mac: `Cmd+Shift+D`) - Quick download current video

Customize at: `chrome://extensions/shortcuts`

### Settings

Right-click extension icon → "Options" to:
- Set default download service
- Set default quality preference
- Reset settings

## Download Services

### YouTubePP (Default)
- Fast and reliable
- Multiple format support
- Good quality options

### Y2Mate
- Alternative service
- Good for international users
- Multiple quality options

### SaveFrom
- Reliable service
- Good format support
- Easy to use

## File Structure

```
YouTube Downloader/
├── manifest.json       # Extension configuration
├── popup.html          # Popup UI
├── popup.js            # Popup logic
├── content.js          # Content script (download button)
├── background.js       # Background service worker
├── styles.css          # Styles
├── options.html        # Settings page
├── options.js          # Settings logic
├── README.md           # This file
└── FEATURES.md         # Feature roadmap
```

## Permissions

- `storage` - Save user settings and preferences
- `tabs` - Access current tab information
- `activeTab` - Interact with YouTube pages
- `downloads` - Download files (for future direct download feature)
- `host_permissions` - Access YouTube pages

## Privacy

- All data stored locally in your browser
- No data sent to external servers (except download services)
- Analytics stored locally only
- No tracking or external analytics

## Legal Notice

⚠️ **Important:** Downloading YouTube videos may violate YouTube's Terms of Service. This extension is provided for educational purposes. Users are responsible for ensuring they have the right to download content. Always respect copyright laws and content creators' rights.

## Troubleshooting

**Download button not showing?**
1. Refresh the YouTube page
2. Make sure you're on a video page (`/watch?v=...`)
3. Check browser console for errors (F12)

**Download service not working?**
1. Try a different download service
2. Check if the service website is accessible
3. Some videos may be restricted from downloading

**Settings not saving?**
1. Check browser storage permissions
2. Try resetting settings in options page

## Planned Features

See `FEATURES.md` for the complete feature roadmap including:
- Direct download support
- Playlist downloader
- Subtitle download
- Download history
- And much more!

## Version History

### v1.0.0
- Initial release
- Download button injection
- Multiple service support
- Basic settings and popup

## Support

For issues or questions:
1. Check browser console for errors (F12)
2. Review FEATURES.md for planned features
3. Ensure you're using the latest version

## License

MIT License - Feel free to use and modify

---

**Note:** This extension uses third-party download services. The extension itself does not host or store any video content.
