// Service Worker Manager for Chess Web Interface
// Handles registration, updates, and user notifications

class ServiceWorkerManager {
  constructor() {
    this.swRegistration = null;
    this.updateAvailable = false;
    this.init();
  }

  async init() {
    if ('serviceWorker' in navigator) {
      try {
        console.log('[SWM] Registering service worker…');
        this.swRegistration = await navigator.serviceWorker.register('/chess-web/sw.js');

        console.log('[SWM] Service worker registered successfully');

        // Listen for service worker updates
        this.setupUpdateListeners();

        // Check for updates on page load
        this.checkForUpdates();

        // Check for updates every 5 minutes
        setInterval(() => this.checkForUpdates(), 5 * 60 * 1000);

      } catch (error) {
        console.error('[SWM] Service worker registration failed:', error);
      }
    } else {
      console.warn('[SWM] Service workers are not supported in this browser');
    }
  }

  setupUpdateListeners() {
    // Listen for messages from service worker
    navigator.serviceWorker.addEventListener('message', event => {
      if (event.data.type === 'UPDATE_AVAILABLE') {
        console.log('[SWM] Update available notification received');
        this.updateAvailable = true;
        this.showUpdatePrompt();
      }
    });

    // Listen for service worker state changes
    if (this.swRegistration) {
      this.swRegistration.addEventListener('updatefound', () => {
        const newWorker = this.swRegistration.installing;

        newWorker.addEventListener('statechange', () => {
          if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
            console.log('[SWM] New service worker installed');
            this.updateAvailable = true;
            this.showUpdatePrompt();
          }
        });
      });
    }
  }

  async checkForUpdates() {
    if (!this.swRegistration) return;

    try {
      console.log('[SWM] Checking for updates…');

      // Force service worker to check for updates
      await this.swRegistration.update();

      // Send message to service worker to check versions
      const messageChannel = new MessageChannel();

      return new Promise((resolve) => {
        messageChannel.port1.onmessage = (event) => {
          if (event.data.hasUpdates) {
            console.log('[SWM] Updates detected');
            this.updateAvailable = true;
            this.showUpdatePrompt();
          } else {
            console.log('[SWM] No updates available');
          }
          resolve(event.data.hasUpdates);
        };

        navigator.serviceWorker.controller?.postMessage(
          { type: 'CHECK_UPDATES' },
          [messageChannel.port2]
        );
      });

    } catch (error) {
      console.error('[SWM] Error checking for updates:', error);
    }
  }

  showUpdatePrompt() {
    // Remove existing update banner if present
    this.removeUpdateBanner();

    // Create update notification banner
    const banner = document.createElement('div');
    banner.id = 'update-banner';
    banner.className = 'update-banner';
    banner.innerHTML = `
      <div class="update-content">
        <div class="update-message">
          <strong>🎯 Chess Interface Update Available!</strong>
          <p>A new version with improvements and bug fixes is ready.</p>
        </div>
        <div class="update-actions">
          <button id="update-now-btn" class="update-btn update-primary">
            Update Now
          </button>
          <button id="update-later-btn" class="update-btn update-secondary">
            Later
          </button>
        </div>
      </div>
    `;

    // Add styles for the banner
    this.addUpdateBannerStyles();

    // Insert banner at the top of the page
    document.body.insertBefore(banner, document.body.firstChild);

    // Add event listeners
    document.getElementById('update-now-btn').addEventListener('click', () => {
      this.performUpdate();
    });

    document.getElementById('update-later-btn').addEventListener('click', () => {
      this.removeUpdateBanner();
      // Show update prompt again in 30 minutes
      setTimeout(() => {
        if (this.updateAvailable) {
          this.showUpdatePrompt();
        }
      }, 30 * 60 * 1000);
    });

    // Auto-hide after 10 seconds if no action is taken
    setTimeout(() => {
      const existingBanner = document.getElementById('update-banner');
      if (existingBanner) {
        existingBanner.style.opacity = '0.7';
      }
    }, 10000);
  }

  removeUpdateBanner() {
    const existingBanner = document.getElementById('update-banner');
    if (existingBanner) {
      existingBanner.remove();
    }
  }

  addUpdateBannerStyles() {
    // Check if styles are already added
    if (document.getElementById('update-banner-styles')) {
      return;
    }

    const styles = document.createElement('style');
    styles.id = 'update-banner-styles';
    styles.textContent = `
      .update-banner {
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        color: white;
        z-index: 10000;
        box-shadow: 0 2px 10px rgba(0,0,0,0.3);
        transform: translateY(-100%);
        animation: slideDown 0.5s ease-out forwards;
      }

      @keyframes slideDown {
        to {
          transform: translateY(0);
        }
      }

      .update-content {
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 15px 20px;
        max-width: 1200px;
        margin: 0 auto;
      }

      .update-message strong {
        display: block;
        font-size: 16px;
        margin-bottom: 5px;
      }

      .update-message p {
        margin: 0;
        opacity: 0.9;
        font-size: 14px;
      }

      .update-actions {
        display: flex;
        gap: 10px;
        flex-shrink: 0;
      }

      .update-btn {
        padding: 8px 16px;
        border: none;
        border-radius: 6px;
        cursor: pointer;
        font-weight: 600;
        font-size: 14px;
        transition: all 0.2s ease;
      }

      .update-primary {
        background: white;
        color: #667eea;
      }

      .update-primary:hover {
        background: #f0f0f0;
        transform: translateY(-1px);
      }

      .update-secondary {
        background: rgba(255,255,255,0.2);
        color: white;
        border: 1px solid rgba(255,255,255,0.3);
      }

      .update-secondary:hover {
        background: rgba(255,255,255,0.3);
      }

      /* Mobile responsive */
      @media (max-width: 768px) {
        .update-content {
          flex-direction: column;
          text-align: center;
          gap: 15px;
        }

        .update-actions {
          justify-content: center;
        }

        .update-btn {
          min-width: 100px;
        }
      }

      /* Loading overlay for update */
      .update-loading {
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: rgba(255,255,255,0.95);
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        z-index: 20000;
      }

      .update-spinner {
        width: 50px;
        height: 50px;
        border: 4px solid #f3f3f3;
        border-top: 4px solid #667eea;
        border-radius: 50%;
        animation: spin 1s linear infinite;
        margin-bottom: 20px;
      }

      @keyframes spin {
        0% { transform: rotate(0deg); }
        100% { transform: rotate(360deg); }
      }

      .update-loading-text {
        font-size: 18px;
        color: #333;
        font-weight: 600;
      }
    `;

    document.head.appendChild(styles);
  }

  showUpdateLoading() {
    const loadingOverlay = document.createElement('div');
    loadingOverlay.id = 'update-loading';
    loadingOverlay.className = 'update-loading';
    loadingOverlay.innerHTML = `
      <div class="update-spinner"></div>
      <div class="update-loading-text">Updating Chess Interface…</div>
      <p style="margin-top: 10px; opacity: 0.7;">Please wait while we update to the latest version</p>
    `;

    document.body.appendChild(loadingOverlay);
  }

  async performUpdate() {
    try {
      console.log('[SWM] Starting update process…');

      // Remove update banner and show loading screen
      this.removeUpdateBanner();
      this.showUpdateLoading();

      // Clear all caches
      if ('caches' in window) {
        const cacheNames = await caches.keys();
        await Promise.all(
          cacheNames.map(cacheName => {
            console.log('[SWM] Deleting cache:', cacheName);
            return caches.delete(cacheName);
          })
        );
      }

      // Tell service worker to skip waiting and become active
      if (this.swRegistration && this.swRegistration.waiting) {
        this.swRegistration.waiting.postMessage({ type: 'SKIP_WAITING' });
      }

      // Wait a moment for cleanup
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Reload the page
      console.log('[SWM] Reloading page to complete update…');
      window.location.reload(true);

    } catch (error) {
      console.error('[SWM] Error during update process:', error);

      // Remove loading screen and show error
      const loadingOverlay = document.getElementById('update-loading');
      if (loadingOverlay) {
        loadingOverlay.remove();
      }

      window.alert('Update failed. Please refresh the page manually.');
    }
  }

  // Public method to manually trigger update check
  manualUpdateCheck() {
    console.log('[SWM] Manual update check triggered');
    return this.checkForUpdates();
  }

  // Public method to get update status
  hasAvailableUpdate() {
    return this.updateAvailable;
  }
}

// Initialize service worker manager when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    window.swManager = new ServiceWorkerManager();
  });
} else {
  window.swManager = new ServiceWorkerManager();
}

// Export for potential use in other scripts
if (typeof module !== 'undefined' && module.exports) {
  module.exports = ServiceWorkerManager;
}
