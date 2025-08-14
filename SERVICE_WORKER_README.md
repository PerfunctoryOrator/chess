# Service Worker System Documentation

This document explains the comprehensive service worker implementation for the Chess Web Interface, including version management, offline caching, and automatic updates.

## Overview

The service worker system provides:
- **Offline functionality** - All files cached for offline use
- **Version-based updates** - Separate versioning for core files and media assets
- **Automatic background updates** - New versions downloaded silently
- **User-controlled updates** - Users choose when to apply updates
- **Progressive Web App (PWA)** support - Installable as a native app

## Architecture

### Files Structure

```
chess-web/
├── sw.js                 # Service worker (handles caching, updates)
├── sw-manager.js         # Client-side manager (UI, registration)
├── update-tester.js      # Development testing tools
├── manifest.json         # PWA manifest
└── index.html           # Updated with SW integration
```

### Version Management

The system uses **two separate versions**:

1. **CORE_VERSION**: For application logic and styles
   - HTML files
   - JavaScript files
   - CSS files

2. **MEDIA_VERSION**: For static assets
   - Images
   - Icons
   - Fonts

## How It Works

### 1. Initial Installation

When a user first visits:
1. Service worker registers automatically
2. All core and media files are cached
3. Site becomes available offline immediately

### 2. Update Detection

The system checks for updates:
- **Automatically**: Every 30 minutes (service worker) and 5 minutes (client)
- **Manually**: Via `window.swManager.manualUpdateCheck()`
- **On page load**: Every time the page loads

### 3. Background Updates

When updates are detected:
1. New files are downloaded in the background
2. Users continue using the current version
3. No interruption to current session

### 4. Update Notification

After background download completes:
1. User sees an update notification banner
2. User can choose "Update Now" or "Later"
3. If "Later", notification reappears in 30 minutes

### 5. Update Application

When user chooses to update:
1. Loading screen appears
2. Old caches are cleared
3. Page reloads with new version
4. New service worker takes control

## Implementation Guide

### Step 1: Update Versions

To release a new version, edit `sw.js`:

```javascript
// Update these version numbers
const CORE_VERSION = '1.1.0';    // Increment for app changes
const MEDIA_VERSION = '1.0.0';   // Increment for asset changes
```

### Step 2: Categorize Your Files

Ensure files are properly categorized in `sw.js`:

```javascript
// Core files (increment CORE_VERSION when these change)
const CORE_FILES = [
  '/',
  '/index.html',
  '/board-manager.js',
  '/board-styles.css',
  // …other app files
];

// Media files (increment MEDIA_VERSION when these change)
const MEDIA_FILES = [
  '/media-support/favicon.ico',
  '/media-support/white-pawn.png',
  // …other assets
];
```

### Step 3: Deploy

1. Upload all files to your server
2. The service worker automatically detects version changes
3. Users receive update notifications

## Configuration Options

### Update Check Frequency

In `sw.js`, change the interval (currently 30 minutes):
```javascript
setInterval(() => {
  // Check every X milliseconds
}, 30 * 60 * 1000); // 30 minutes
```

In `sw-manager.js`, change client-side checks (currently 5 minutes):
```javascript
setInterval(() => this.checkForUpdates(), 5 * 60 * 1000);
```

### Notification Timing

Change how long the update banner stays prominent:
```javascript
// Auto-hide after X seconds
setTimeout(() => {
  const existingBanner = document.getElementById('update-banner');
  if (existingBanner) {
    existingBanner.style.opacity = '0.7';
  }
}, 10000); // 10 seconds
```

## Development & Testing

### Development Mode

The update tester panel appears automatically when:
- Hostname is `localhost`
- Hostname includes `127.0.0.1`
- URL contains `?test=true`

### Testing Tools

Access via browser console:
```javascript
// Check for updates manually
await window.swManager.manualUpdateCheck();

// Show current cache status
await window.updateTester.showCacheStatus();

// Simulate an update notification
window.updateTester.simulateUpdate();

// Clear all caches and reload
window.updateTester.forceReload();

// Run comprehensive test suite
await window.updateTester.runTestSuite();
```

### Testing Update Flow

1. Make changes to your files
2. Update version numbers in `sw.js`
3. Use testing panel or console commands
4. Verify update notifications appear
5. Test the update process

## PWA Features

### Installability

The app can be installed on devices via:
- Browser "Install" prompts
- "Add to Home Screen" on mobile
- App stores (with additional setup)

### Manifest Configuration

Edit `manifest.json` to customize:
- App name and description
- Icons and screenshots
- Display mode and orientation
- Theme colors

## Browser Compatibility

### Supported Browsers
- Chrome/Chromium 45+
- Firefox 44+
- Safari 11.1+
- Edge 17+

### Fallback Behavior
- Older browsers work normally without offline features
- No errors or broken functionality
- Graceful degradation

## Security Considerations

### HTTPS Requirement
- Service workers require HTTPS in production
- Localhost works for development
- Use valid SSL certificates

### Cache Security
- Service worker caches are origin-specific
- No cross-origin access
- Automatic cleanup of old versions

## Troubleshooting

### Common Issues

**Service worker not registering:**
- Check browser console for errors
- Verify HTTPS is enabled (production)
- Ensure `sw.js` is accessible

**Updates not working:**
- Check version numbers in `sw.js`
- Verify network connectivity
- Clear browser cache manually

**Files not cached:**
- Check file paths in `CORE_FILES`/`MEDIA_FILES` arrays
- Verify files exist and are accessible
- Check browser Developer Tools → Application → Storage

### Debug Commands

```javascript
// View all caches
console.log(await caches.keys());

// Check service worker status
console.log(await navigator.serviceWorker.getRegistration());

// Force update check
window.swManager?.manualUpdateCheck();
```

## Performance Impact

### Benefits
- **Faster loading**: Files served from cache
- **Offline access**: Complete functionality without network
- **Reduced bandwidth**: Only updated files downloaded

### Considerations
- **Initial load**: Slightly slower first visit (caching files)
- **Storage usage**: Files stored locally (~1-5MB typical)
- **Memory usage**: Minimal impact on browser performance

## Best Practices

### Version Management
1. Use semantic versioning (e.g., 1.2.3)
2. Increment CORE_VERSION for functionality changes
3. Increment MEDIA_VERSION for asset updates
4. Test thoroughly before deploying version changes

### File Organization
1. Keep `CORE_FILES` and `MEDIA_FILES` arrays updated
2. Use relative paths starting with `/`
3. Include all critical files for offline functionality
4. Consider file size impact on caching

### User Experience
1. Don't force updates during active use
2. Provide clear update notifications
3. Handle network failures gracefully
4. Test offline functionality regularly

## Advanced Features

### Custom Update Logic

You can modify the update behavior by editing the service worker's message handlers:

```javascript
self.addEventListener('message', event => {
  if (event.data && event.data.type === 'CUSTOM_UPDATE_CHECK') {
    // Your custom logic here
  }
});
```

### Selective Caching

Add conditional caching logic in the fetch handler:

```javascript
// Example: Only cache during business hours
const now = new Date();
const isBusinessHours = now.getHours() >= 9 && now.getHours() < 17;

if (isBusinessHours) {
  // Cache the file
} else {
  // Serve from network only
}
```

## Monitoring & Analytics

Consider adding analytics to track:
- Service worker registration success rates
- Update adoption rates
- Offline usage patterns
- Cache hit ratios

Example integration:
```javascript
// In sw-manager.js
analytics.track('service_worker_registered', {
  version: CORE_VERSION,
  userAgent: navigator.userAgent
});
```

## Migration Guide

### From No Service Worker

1. Add the service worker files
2. Update `index.html` with new script tags
3. Deploy all files simultaneously
4. Monitor for any issues in browser console

### From Different Service Worker

1. Plan cache key changes to avoid conflicts
2. Consider cleanup of old caches
3. Test thoroughly in staging environment
4. Deploy during low-traffic periods

## Support

For issues or questions:
1. Check browser console for error messages
2. Use the development testing tools
3. Verify all files are accessible
4. Test in different browsers and network conditions

---

This service worker implementation provides a robust foundation for offline functionality and automatic updates. Customize the configuration options and extend the functionality as needed for your specific requirements.
