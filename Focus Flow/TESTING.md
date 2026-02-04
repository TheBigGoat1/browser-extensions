# Testing Guide for Focus Flow

## Quick Test Steps

### 1. Load the Extension
1. Open Chrome → `chrome://extensions/`
2. Enable "Developer mode"
3. Click "Load unpacked"
4. Select the `Focus Flow` folder
5. Verify extension appears in list

### 2. Test Basic Functionality

#### Test Popup
- [ ] Click extension icon - popup should open
- [ ] All toggles should be visible
- [ ] Status indicator shows "Active" or "Inactive"
- [ ] Toggle "Enable Extension" - status should change

#### Test Hiding Features
1. Go to `youtube.com`
2. Open a video page
3. Toggle "Hide Sidebar" - sidebar should disappear
4. Toggle "Hide Comments" - comments should disappear
5. Go to YouTube homepage
6. Toggle "Hide Home Grid" - video grid should disappear

#### Test Persistence
- [ ] Change settings
- [ ] Close popup
- [ ] Reopen popup
- [ ] Settings should be saved

### 3. Test Channel Management

#### Whitelist Test
1. Go to any YouTube channel page
2. Note the channel name/URL
3. Open extension popup
4. Add channel to whitelist
5. Go back to that channel's video
6. Distractions should NOT be hidden (they should show)

#### Blacklist Test
1. Add a channel to blacklist
2. Go to that channel's video
3. Distractions should be hidden even if extension is enabled

### 4. Test Keyboard Shortcuts

1. Go to `chrome://extensions/shortcuts`
2. Verify shortcuts are listed:
   - Toggle extension (Ctrl+Shift+F)
   - Toggle sidebar (Ctrl+Shift+S)
   - Toggle comments (Ctrl+Shift+C)
3. Go to YouTube
4. Press `Ctrl+Shift+F` - extension should toggle
5. Press `Ctrl+Shift+S` - sidebar should toggle
6. Press `Ctrl+Shift+C` - comments should toggle

### 5. Test Options Page

1. Right-click extension icon → "Options"
2. Options page should open
3. Click "View Analytics" - should show stats
4. Click "Reset to Defaults" - should reset settings

### 6. Test Different YouTube Pages

Test on these pages:
- [ ] Homepage (`youtube.com`)
- [ ] Video watch page (`youtube.com/watch?v=...`)
- [ ] Channel page (`youtube.com/@...`)
- [ ] Search results (`youtube.com/results?search_query=...`)
- [ ] Playlist page

### 7. Test Edge Cases

- [ ] Refresh page - settings should persist
- [ ] Navigate between pages (SPA) - should work
- [ ] Disable extension - everything should show
- [ ] Re-enable extension - hiding should resume
- [ ] Add duplicate channel - should show error
- [ ] Remove channel from list - should work

### 8. Test Notifications

1. Uninstall extension
2. Reinstall extension
3. Should see "Focus Flow Installed!" notification
4. Update version in manifest.json
5. Reload extension
6. Should see "Focus Flow Updated!" notification

### 9. Check for Errors

Open browser console (F12) and check for:
- [ ] No JavaScript errors
- [ ] No permission errors
- [ ] No storage errors

## Common Issues

### Extension not loading
- Check manifest.json syntax
- Verify all files exist
- Check browser console for errors

### Settings not saving
- Check storage permission in manifest
- Verify Chrome storage is working
- Check browser console

### Hiding not working
- Refresh YouTube page
- Check if extension is enabled
- Verify content script is injected (check console)

### Popup not opening
- Check popup.html exists
- Verify manifest.json has correct popup path
- Check for JavaScript errors in popup

## Performance Testing

- [ ] Extension loads quickly
- [ ] No lag when toggling features
- [ ] No memory leaks (check task manager)
- [ ] Works smoothly on long YouTube sessions

## Browser Compatibility

Test on:
- [ ] Chrome (latest)
- [ ] Edge (Chromium-based)
- [ ] Other Chromium browsers

## Ready for Production?

Before publishing, ensure:
- [ ] All tests pass
- [ ] No console errors
- [ ] README is complete
- [ ] Version number is correct
- [ ] Description is clear
- [ ] All features work as expected
