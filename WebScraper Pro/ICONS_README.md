# Icons Required

The extension requires the following icon files:

- `icon16.png` - 16x16 pixels
- `icon48.png` - 48x48 pixels  
- `icon128.png` - 128x128 pixels

## Quick Solution

You can create placeholder icons or use any 16x16, 48x48, and 128x128 pixel PNG images.

### Option 1: Use Online Icon Generator
1. Go to https://www.favicon-generator.org/
2. Upload a logo or create one
3. Download the generated icons
4. Rename and place in the extension folder

### Option 2: Create Simple Icons
Use any image editor to create:
- Green square with "WS" text for WebScraper
- Or use a web scraping related icon

### Option 3: Remove Icon Requirements (Temporary)
Edit `manifest.json` and remove the `icons` and `action.default_icon` sections if you want to test without icons first.

The extension will work without icons, but Chrome will show a default puzzle piece icon.
