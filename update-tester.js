// Update Tester for Chess Web Interface Service Worker
// This helper script provides functions to test the update mechanism

class UpdateTester {
    constructor() {
        this.log = (message) => console.log(`[UpdateTester] ${message}`);
        this.init();
    }

    // Add testing UI to the page
    init() {
        this.createTestingPanel();
        this.log("Update tester initialized. Use `window.updateTester` to access methods.");
    }

    createTestingPanel() {

        // Only show in development
        const isDevelopment = window.location.hostname === "localhost" ||
            window.location.search.includes("test=true");
        if (!isDevelopment) return;

        const panel = document.createElement("div");
        panel.id = "update-tester-panel";
        panel.style.cssText = `
            position: fixed;
            top: var(--margin);
            right: var(--margin);
            background-color: var(--contrast-background-color);
            z-index: 9999;
            box-shadow: 8px 16px 16px var(--shadow-color);
            border: var(--border);
            border-radius: var(--box-radius);
            `;

        panel.innerHTML = `
            <h2>Update Tester</h2>
            <button onclick="updateTester.checkForUpdates()">Check Updates</button>
            <button onclick="updateTester.showCacheStatus()">Cache Status</button>
            <button onclick="updateTester.clearAllCaches()">Clear Caches</button>
            <button onclick="updateTester.simulateUpdate()">Simulate Update</button>
            <button onclick="updateTester.forceReload()">Force Reload</button>
            <button onclick="updateTester.runTestSuite()">Run Test Suite</button>
            <button onclick="updateTester.clearConsole()">Clear Console</button>
            `;

        document.body.appendChild(panel);

        const console = document.createElement("code");
        console.style.cssText = `
            position: fixed;
            bottom: var(--margin);
            right: var(--margin);
            background-color: var(--color);
            color: var(--background-color);
            z-index: 9999;
            overflow: hidden;
            box-shadow: 8px 16px 16px var(--shadow-color);
            border: var(--border);
            border-radius: var(--box-radius);
            `;
        console.innerHTML = `
            <div id="tester-output" style="overflow: auto; width: 30vw; height: 30vh; padding: var(--padding);"></div>
            `
        document.body.appendChild(console);
    }

    updateOutput(message) {
        const output = document.getElementById("tester-output");
        if (output) {
            const timestamp = new Date().toLocaleTimeString();
            output.innerHTML += `<div>[${timestamp}] ${message}</div>`;
            output.scrollTop = output.scrollHeight;
        }
    }

    async checkForUpdates() {
        this.updateOutput("Checking for updates…");

        if (window.swManager) {
            try {
                const hasUpdates = await window.swManager.manualUpdateCheck();
                this.updateOutput(`Updates available: ${hasUpdates}`);
                return hasUpdates;
            } catch (error) {
                this.updateOutput(`Error: ${error.message}`);
            }
        } else {
            this.updateOutput("Service Worker Manager not available");
        }
    }

    async showCacheStatus() {
        this.updateOutput("Checking cache status…");

        if ("caches" in window) {
            try {
                const cacheNames = await caches.keys();
                this.updateOutput(`Active caches: ${cacheNames.length}`);

                for (const cacheName of cacheNames) {
                    const cache = await caches.open(cacheName);
                    const keys = await cache.keys();
                    this.updateOutput(`${cacheName}: ${keys.length} files`);
                }
            } catch (error) {
                this.updateOutput(`Error checking caches: ${error.message}`);
            }
        } else {
            this.updateOutput("Cache API not supported");
        }
    }

    async clearAllCaches() {
        this.updateOutput("Clearing all caches…");

        if ("caches" in window) {
            try {
                const cacheNames = await caches.keys();
                let deletedCount = 0;

                for (const cacheName of cacheNames) {
                    await caches.delete(cacheName);
                    deletedCount++;
                    this.updateOutput(`Deleted: ${cacheName}`);
                }

                this.updateOutput(`Cleared ${deletedCount} caches`);
            } catch (error) {
                this.updateOutput(`Error clearing caches: ${error.message}`);
            }
        } else {
            this.updateOutput("Cache API not supported");
        }
    }

    simulateUpdate() {
        this.updateOutput("Simulating update notification…");

        if (window.swManager) {
            // Temporarily set update available flag
            window.swManager.updateAvailable = true;
            window.swManager.showUpdatePrompt();
            this.updateOutput("Update prompt should be visible");
        } else {
            this.updateOutput("Service Worker Manager not available");
        }
    }

    forceReload() {
        this.updateOutput("Force reloading…");

        // Clear all caches before reload
        this.clearAllCaches().then(() => {
            setTimeout(() => {
                window.location.reload(true);
            }, 1000);
        });
    }

    // Method to simulate version change in service worker
    async simulateVersionChange(newCoreVersion, newMediaVersion) {
        this.updateOutput(`Simulating version change: Core ${newCoreVersion}, Media ${newMediaVersion}`);

        try {
            // This would typically involve modifying the service worker file
            // For testing purposes, we"ll just trigger the update check
            localStorage.setItem("test-core-version", newCoreVersion || "2.0.0");
            localStorage.setItem("test-media-version", newMediaVersion || "2.0.0");

            this.updateOutput(`Set test versions — Core: ${newCoreVersion || "2.0.0"}, Media: ${newMediaVersion || "2.0.0"}`);
            this.updateOutput("Now run `checkForUpdates()` to test the flow");

        } catch (error) {
            this.updateOutput(`Error: ${error.message}`);
        }
    }

    // Get service worker registration info
    async getServiceWorkerInfo() {
        if ("serviceWorker" in navigator) {
            const registration = await navigator.serviceWorker.getRegistration();
            if (registration) {
                const info = {
                    scope: registration.scope,
                    updateViaCache: registration.updateViaCache,
                    installing: !!registration.installing,
                    waiting: !!registration.waiting,
                    active: !!registration.active
                };

                this.updateOutput(`SW Info: ${JSON.stringify(info, null, 2)}`);
                return info;
            }
        }
        this.updateOutput("No service worker registration found");
        return null;
    }

    // Test network connectivity
    async testNetworkConnectivity() {
        this.updateOutput("Testing network connectivity…");

        try {
            const response = await fetch("/chess-web/sw.js", {
                method: "HEAD",
                cache: "no-cache"
            });

            this.updateOutput(`Network test: ${response.ok ? "ONLINE" : "ISSUES"} (${response.status})`);
            return response.ok;

        } catch (error) {
            this.updateOutput(`Network test: OFFLINE (${error.message})`);
            return false;
        }
    }

    // Show storage usage
    async showStorageInfo() {
        if ("storage" in navigator && "estimate" in navigator.storage) {
            try {
                const estimate = await navigator.storage.estimate();
                const used = (estimate.usage / (1024 * 1024)).toFixed(2);
                const quota = (estimate.quota / (1024 * 1024)).toFixed(2);

                this.updateOutput(`Storage: ${used}MB used of ${quota}MB quota`);
                return estimate;
            } catch (error) {
                this.updateOutput(`Storage info error: ${error.message}`);
            }
        } else {
            this.updateOutput("Storage API not supported");
        }
        return null;
    }

    // Run comprehensive test suite
    async runTestSuite() {
        this.updateOutput("=== STARTING TEST SUITE ===");

        await this.getServiceWorkerInfo();
        await this.testNetworkConnectivity();
        await this.showStorageInfo();
        await this.showCacheStatus();

        this.updateOutput("=== TEST SUITE COMPLETE ===");
    }

    clearConsole() {
        const output = document.getElementById("tester-output");
        if (output) {
            output.innerHTML = "";
        }
    }
}

// Initialize the tester when DOM is ready
if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", () => {
        window.updateTester = new UpdateTester();
    });
} else {
    window.updateTester = new UpdateTester();
}
