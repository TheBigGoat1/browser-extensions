# Building & Publishing Guide

## Pre-Publishing Checklist

### 1. Code Quality
- [ ] All files are present
- [ ] No console errors
- [ ] Code is clean and commented
- [ ] Version number is correct in manifest.json

### 2. Icons (Optional but Recommended)

The extension currently doesn't have icons. To add them:

1. Create icon files:
   - `icon16.png` (16x16 pixels)
   - `icon48.png` (48x48 pixels)
   - `icon128.png` (128x128 pixels)

2. Add to manifest.json:
```json
"icons": {
  "16": "icon16.png",
  "48": "icon48.png",
  "128": "icon128.png"
}
```

3. Tools to create icons:
   - [Favicon.io](https://favicon.io/) - Generate from text/emoji
   - [Canva](https://www.canva.com/) - Design custom icons
   - [GIMP](https://www.gimp.org/) - Free image editor

### 3. Prepare for Chrome Web Store

#### Required Assets

1. **Screenshots** (1280x800 or 640x400):
   - Extension popup
   - Options page
   - Before/after YouTube comparison

2. **Promotional Images**:
   - Small tile (440x280)
   - Large tile (920x680)
   - Marquee (1400x560) - optional

3. **Store Listing**:
   - Name: "Focus Flow"
   - Short description (132 chars max)
   - Detailed description
   - Category: Productivity
   - Language: English

#### Store Listing Template

**Short Description:**
```
Remove YouTube distractions instantly. Hide sidebars, comments, and home grid for better focus.
```

**Detailed Description:**
```
Focus Flow helps you stay focused on YouTube by removing distracting elements.

Features:
• Hide sidebar with recommended videos
• Hide comment sections
• Hide home page video grid
• Whitelist/blacklist specific channels
• Keyboard shortcuts for quick control
• Local analytics tracking
• Privacy-friendly (all data stored locally)

Perfect for:
- Students studying with educational videos
- Professionals watching tutorials
- Anyone who wants to reduce distractions

All your data stays on your device. No external tracking or analytics.
```

### 4. Create ZIP Package

**Windows:**
```powershell
# Exclude unnecessary files
Compress-Archive -Path manifest.json,popup.html,popup.js,content.js,background.js,styles.css,options.html,options.js,analytics.js -DestinationPath focus-flow-v1.0.0.zip
```

**Mac/Linux:**
```bash
zip -r focus-flow-v1.0.0.zip manifest.json popup.html popup.js content.js background.js styles.css options.html options.js analytics.js
```

**Files to include:**
- ✅ manifest.json
- ✅ popup.html
- ✅ popup.js
- ✅ content.js
- ✅ background.js
- ✅ styles.css
- ✅ options.html
- ✅ options.js
- ✅ analytics.js
- ✅ icons (if you add them)

**Files to exclude:**
- ❌ README.md
- ❌ TESTING.md
- ❌ BUILD.md
- ❌ .git files
- ❌ node_modules (if any)

### 5. Chrome Web Store Submission

1. Go to [Chrome Web Store Developer Dashboard](https://chrome.google.com/webstore/devconsole)
2. Pay one-time $5 registration fee (if first time)
3. Click "New Item"
4. Upload ZIP file
5. Fill in store listing:
   - Name, description, screenshots
   - Category: Productivity
   - Privacy practices
   - Single purpose (Yes - removes distractions)
6. Submit for review
7. Wait for approval (usually 1-3 days)

### 6. Privacy Policy (Required)

You need a privacy policy URL. Create one stating:
- No data collection
- All data stored locally
- No external tracking
- No third-party services

You can host it on:
- GitHub Pages (free)
- Your own website
- Privacy policy generator

### 7. Version Updates

When updating:

1. Increment version in manifest.json:
```json
"version": "1.0.1"
```

2. Update CHANGELOG.md (create one)
3. Create new ZIP
4. Upload to Chrome Web Store
5. Users will get update notification automatically

## Alternative: Self-Hosting

If you don't want to publish to Chrome Web Store:

1. Host files on GitHub
2. Provide installation instructions
3. Users can install via "Load unpacked" method
4. Or use [Chrome Extension Source Viewer](https://chrome.google.com/webstore/detail/chrome-extension-source-v/jifpbeccnghkjeaalbbjmodiffmgedin) to install from GitHub

## Post-Publishing

- [ ] Monitor user reviews
- [ ] Respond to feedback
- [ ] Fix reported bugs
- [ ] Plan feature updates
- [ ] Update documentation

## Resources

- [Chrome Extension Documentation](https://developer.chrome.com/docs/extensions/)
- [Chrome Web Store Policies](https://developer.chrome.com/docs/webstore/program-policies/)
- [Manifest V3 Migration](https://developer.chrome.com/docs/extensions/mv3/intro/)
